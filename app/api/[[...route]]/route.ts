import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { analyzeSceneWithVision, compareWithCorrectState } from '@/features/guide/utils/vision'
import { generateGuideFeedback } from '@/features/guide/utils/llm'
import { generateSpeech } from '@/features/guide/utils/tts'

export const runtime = 'nodejs'

const app = new Hono().basePath('/api')

app.get('/health', (c) => {
  return c.json({ status: 'ok' })
})

// Guide feature: Analyze scene
app.post('/guide/analyze', async (c) => {
  try {
    const body = await c.req.json()
    const { imageDataUrl, sceneName, correctState, season } = body

    if (!imageDataUrl || !sceneName || !correctState) {
      return c.json({ error: 'Missing required fields' }, 400)
    }

    // Step 1: Vision analysis
    const visionResult = await analyzeSceneWithVision(imageDataUrl, sceneName)

    // Step 2: Compare with correct state
    const differences = compareWithCorrectState(visionResult.items, correctState)

    // Step 3: Generate feedback
    const feedback = await generateGuideFeedback({
      sceneName,
      season,
      observedItems: visionResult.items,
      missingItems: differences.missing,
      extraItems: differences.extra,
      correctState,
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
