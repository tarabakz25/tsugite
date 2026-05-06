import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { convertToModelMessages, streamText, type UIMessage } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import postgres from 'postgres'
import { analyzeSceneWithVision, compareWithCorrectState } from '@/features/guide/utils/vision'
import { generateGuideFeedback } from '@/features/guide/utils/llm'
import { generateSpeech } from '@/features/guide/utils/tts'
import type { GuideSourceTagContext } from '@/features/guide/types'
import {
  generateEmbedding,
  searchSimilarTags,
  getRelatedInterviews,
  buildRAGPrompt,
} from '@/lib/agent/rag'
import type { ChatCitation } from '@/types/agent'

import archive from './archive'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 min – needed for Whisper transcription of large files

const app = new Hono().basePath('/api')

app.get('/health', (c) => {
  return c.json({ status: 'ok' })
})

app.route('/archive', archive)

// Chat endpoint with streaming
const chatSchema = z.object({
  messages: z.array(z.unknown()),
  shopId: z.string().uuid(),
})

app.post('/agent/chat', zValidator('json', chatSchema), async (c) => {
  const { messages, shopId } = c.req.valid('json')
  const uiMessages = messages as UIMessage[]
  const latestMessage = uiMessages[uiMessages.length - 1]
  const messageText =
    latestMessage?.parts
      ?.filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join('') ?? ''

  if (!messageText) {
    return c.json({ error: 'Message is required' }, 400)
  }

  if (!process.env.DATABASE_URL) {
    return c.json({ error: 'Database not configured' }, 500)
  }

  if (!process.env.OPENAI_API_KEY) {
    return c.json({ error: 'OpenAI API key not configured' }, 500)
  }

  try {
    // Create database connection
    const db = postgres(process.env.DATABASE_URL)

    // Generate embedding for the user's question
    const embedding = await generateEmbedding(messageText)

    // Search for similar tacit knowledge tags
    const similarTags = await searchSimilarTags(db, embedding, shopId, 5)

    // Get related interview transcripts
    const relatedInterviews = await getRelatedInterviews(
      db,
      similarTags.map((t) => t.id),
      shopId,
    )

    // Build RAG context
    const ragContext = {
      tags: similarTags,
      interviews: relatedInterviews,
    }

    // Build prompt with context
    const systemPrompt = buildRAGPrompt(ragContext, messageText)

    // Generate citations
    const citations: ChatCitation[] = similarTags.map((tag) => ({
      type: 'tag' as const,
      id: tag.id,
      title: tag.situation,
      excerpt: `${tag.judgment} - ${tag.reason}`,
    }))

    // Stream response using Vercel AI SDK
    const result = await streamText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      messages: await convertToModelMessages(uiMessages),
      temperature: 0.7,
      maxOutputTokens: 800,
    })

    // Return streaming response with citations in headers
    const response = result.toUIMessageStreamResponse()
    response.headers.set('X-Citations', JSON.stringify(citations))

    await db.end()

    return response
  } catch (error) {
    console.error('Chat error:', error)
    return c.json({ error: 'Failed to generate response' }, 500)
  }
})

// TTS endpoint for audio generation
const ttsSchema = z.object({
  text: z.string().min(1),
})

app.post('/agent/tts', zValidator('json', ttsSchema), async (c) => {
  const { text } = c.req.valid('json')

  if (!process.env.OPENAI_API_KEY) {
    return c.json({ error: 'OpenAI API key not configured' }, 500)
  }

  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: 'nova', // Female voice for the proprietor
        input: text,
      }),
    })

    if (!response.ok) {
      throw new Error('TTS API request failed')
    }

    const audioBuffer = await response.arrayBuffer()

    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error('TTS error:', error)
    return c.json({ error: 'Failed to generate audio' }, 500)
  }
})

const guideSourceTagSchema = z.object({
  id: z.string().uuid(),
  situation: z.string().min(1),
  judgment: z.string().min(1),
  reason: z.string().min(1),
})

const guideAnalyzeSchema = z.object({
  correctState: z.record(z.string(), z.unknown()).nullable().optional(),
  imageDataUrl: z.string().min(1),
  sceneName: z.string().min(1),
  season: z.string().nullable().optional(),
  sourceTag: guideSourceTagSchema.nullable().optional(),
  sourceType: z.enum(['scene', 'tag']).optional(),
})

// Guide feature: Analyze scene
app.post('/guide/analyze', async (c) => {
  try {
    const parsed = guideAnalyzeSchema.safeParse(await c.req.json())

    if (!parsed.success) {
      return c.json({ error: 'Invalid guide analysis request' }, 400)
    }

    const { imageDataUrl, sceneName, correctState, season, sourceTag, sourceType } = parsed.data
    const sourceTagContext: GuideSourceTagContext | null = sourceTag ?? null
    const hasCorrectState = Boolean(correctState && Object.keys(correctState).length > 0)

    if (!hasCorrectState && !sourceTagContext) {
      return c.json({ error: 'Missing guide source context' }, 400)
    }

    // Step 1: Vision analysis
    const visionResult = await analyzeSceneWithVision(imageDataUrl, sceneName, sourceTagContext)

    // Step 2: Compare with correct state
    const differences =
      hasCorrectState && correctState
        ? compareWithCorrectState(visionResult.items, correctState)
        : { missing: [], extra: [] }

    // Step 3: Generate feedback
    const feedback = await generateGuideFeedback({
      correctState: correctState ?? null,
      sceneName,
      season,
      observedItems: visionResult.items,
      missingItems: differences.missing,
      extraItems: differences.extra,
      sourceTag: sourceTagContext,
      sourceType: sourceType ?? (sourceTagContext ? 'tag' : 'scene'),
    })

    return c.json({
      visionResult: {
        items: visionResult.items,
        rawDescription: visionResult.rawDescription,
      },
      differences,
      feedback,
    })
  } catch (error) {
    console.error('Scene analysis error:', error)
    return c.json({ error: error instanceof Error ? error.message : 'Scene analysis failed' }, 500)
  }
})

// Guide feature: Generate TTS
app.post('/guide/tts', async (c) => {
  try {
    const body = await c.req.json()
    const { text } = body

    if (!text) {
      return c.json({ error: 'Missing text field' }, 400)
    }

    const audioBuffer = await generateSpeech(text)

    // Return audio as base64
    const base64Audio = audioBuffer.toString('base64')
    return c.json({
      audioData: base64Audio,
      mimeType: 'audio/mpeg',
    })
  } catch (error) {
    console.error('TTS generation error:', error)
    return c.json({ error: error instanceof Error ? error.message : 'TTS failed' }, 500)
  }
})

export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const PATCH = handle(app)
export const DELETE = handle(app)
