import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  type UIMessage,
} from 'ai'
import { openai as aiOpenAI } from '@ai-sdk/openai'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import {
  analyzeSceneWithVision,
  compareWithCorrectState,
  determineGuideAnalysisStatus,
} from '@/features/guide/utils/vision'
import { generateGuideFeedback } from '@/features/guide/utils/llm'
import { generateSpeech } from '@/features/guide/utils/tts'
import { buildRAGPrompt, getRAGContext } from '@/lib/agent/rag'
import type { ChatCitation } from '@/types/agent'

import archive from './archive'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 min – needed for Whisper transcription of large files

const app = new Hono().basePath('/api')

app.get('/health', (c) => {
  return c.json({ status: 'ok' })
})

app.route('/archive', archive)

type AgentChatMessage = UIMessage<unknown, { citations: ChatCitation[] }>

function getMessageText(message: UIMessage | undefined): string {
  return (
    message?.parts
      ?.filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join('') ?? ''
  ).trim()
}

function createTagCitations(
  tags: Awaited<ReturnType<typeof getRAGContext>>['tags'],
): ChatCitation[] {
  return tags.map((tag) => ({
    type: 'tag',
    id: tag.id,
    title: tag.situation,
    excerpt: `${tag.judgment} - ${tag.reason}`,
    relevance: tag.similarity,
    retrieval: tag.retrieval,
  }))
}

async function canAccessAgentShop(
  supabase: SupabaseClient,
  userId: string,
  shopId: string,
): Promise<boolean> {
  const { data: ownedShop, error: ownedShopError } = await supabase
    .from('shops')
    .select('id')
    .eq('id', shopId)
    .maybeSingle()

  if (ownedShopError) {
    console.error('Agent shop ownership check error:', ownedShopError)
    return false
  }

  if (ownedShop) {
    return true
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organization_ids')
    .eq('id', userId)
    .maybeSingle()

  if (profileError) {
    console.error('Agent profile access check error:', profileError)
    return false
  }

  return Array.isArray(profile?.organization_ids) && profile.organization_ids.includes(shopId)
}

// Chat endpoint with streaming
const chatSchema = z.object({
  messages: z.array(z.unknown()),
  shopId: z.string().uuid(),
})

app.post('/agent/chat', zValidator('json', chatSchema), async (c) => {
  const { messages, shopId } = c.req.valid('json')
  const uiMessages = messages as UIMessage[]
  const latestMessage = uiMessages[uiMessages.length - 1]
  const messageText = getMessageText(latestMessage)

  if (!messageText) {
    return c.json({ error: 'Message is required' }, 400)
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  if (!(await canAccessAgentShop(supabase, user.id, shopId))) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  if (!process.env.OPENAI_API_KEY) {
    return c.json({ error: 'OpenAI API key not configured' }, 500)
  }

  try {
    const ragContext = await getRAGContext(supabase, messageText, shopId)
    const systemPrompt = buildRAGPrompt(ragContext, messageText)
    const citations = createTagCitations(ragContext.tags)

    const result = streamText({
      model: aiOpenAI('gpt-4o'),
      system: systemPrompt,
      messages: await convertToModelMessages(uiMessages),
      temperature: 0.7,
      maxOutputTokens: 800,
    })

    const stream = createUIMessageStream<AgentChatMessage>({
      originalMessages: uiMessages as AgentChatMessage[],
      execute({ writer }) {
        writer.write({
          type: 'data-citations',
          data: citations,
        })
        writer.merge(result.toUIMessageStream<AgentChatMessage>())
      },
    })

    return createUIMessageStreamResponse({ stream })
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

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

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

const guideAnalyzeSchema = z.object({
  imageDataUrl: z.string().min(1),
  sceneId: z.string().uuid(),
})

// Guide feature: Analyze scene
app.post('/guide/analyze', zValidator('json', guideAnalyzeSchema), async (c) => {
  try {
    const { imageDataUrl, sceneId } = c.req.valid('json')

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    if (!process.env.OPENAI_API_KEY) {
      return c.json({ error: 'OpenAI API key not configured' }, 500)
    }

    const { data: scene, error: sceneError } = await supabase
      .from('reference_scenes')
      .select('id, shop_id, scene_name, correct_state, season')
      .eq('id', sceneId)
      .maybeSingle()

    if (sceneError) {
      console.error('Guide scene read error:', sceneError)
      return c.json({ error: 'Failed to load reference scene' }, 500)
    }

    if (!scene) {
      return c.json({ error: 'Reference scene not found' }, 404)
    }

    // Step 1: Vision analysis
    const visionResult = await analyzeSceneWithVision(imageDataUrl, scene.scene_name)

    // Step 2: Compare with correct state
    const correctState = scene.correct_state as Record<string, unknown>
    const differences = compareWithCorrectState(visionResult.items, correctState)
    const status = determineGuideAnalysisStatus(visionResult.items, differences)

    // Step 3: Generate feedback
    const feedback = await generateGuideFeedback({
      sceneName: scene.scene_name,
      season: scene.season,
      observedItems: visionResult.items,
      missingItems: differences.missing,
      extraItems: differences.extra,
      correctState,
      status,
    })

    return c.json({
      scene: {
        id: scene.id,
        sceneName: scene.scene_name,
        season: scene.season,
      },
      visionResult: {
        items: visionResult.items,
        rawDescription: visionResult.rawDescription,
        missing: differences.missing,
        extra: differences.extra,
        status,
        sceneId: scene.id,
      },
      differences,
      status,
      feedback,
    })
  } catch (error) {
    console.error('Scene analysis error:', error)
    return c.json({ error: error instanceof Error ? error.message : 'Scene analysis failed' }, 500)
  }
})

const guideTtsSchema = z.object({
  text: z.string().min(1).max(1000),
})

// Guide feature: Generate TTS
app.post('/guide/tts', zValidator('json', guideTtsSchema), async (c) => {
  try {
    const { text } = c.req.valid('json')

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
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
