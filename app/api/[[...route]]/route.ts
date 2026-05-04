import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import postgres from 'postgres'
import {
  generateEmbedding,
  searchSimilarTags,
  getRelatedInterviews,
  buildRAGPrompt,
} from '@/lib/agent/rag'
import type { ChatCitation } from '@/types/agent'

export const runtime = 'nodejs'

const app = new Hono().basePath('/api')

app.get('/health', (c) => {
  return c.json({ status: 'ok' })
})

// Chat endpoint with streaming
const chatSchema = z.object({
  message: z.string().min(1),
  shopId: z.string().uuid(),
})

app.post('/agent/chat', zValidator('json', chatSchema), async (c) => {
  const { message, shopId } = c.req.valid('json')

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
    const embedding = await generateEmbedding(message)

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
    const systemPrompt = buildRAGPrompt(ragContext, message)

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
      prompt: message,
      temperature: 0.7,
      maxTokens: 800,
    })

    // Return streaming response with citations in headers
    const response = result.toDataStreamResponse()
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

export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const PATCH = handle(app)
export const DELETE = handle(app)
