import type { NextRequest } from 'next/server'

import { jsonError } from '@/lib/api/http'
import { generateSpeech } from '@/features/guide/utils/tts'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    if (!body || typeof body !== 'object') {
      return jsonError('Invalid JSON body', 400)
    }
    const { text } = body as Record<string, unknown>

    if (typeof text !== 'string' || !text) {
      return jsonError('Missing text field', 400)
    }

    const audioBuffer = await generateSpeech(text)
    const base64Audio = audioBuffer.toString('base64')

    return Response.json({
      audioData: base64Audio,
      mimeType: 'audio/mpeg',
    })
  } catch (error) {
    console.error('TTS generation error:', error)
    return jsonError(error instanceof Error ? error.message : 'TTS failed', 500)
  }
}
