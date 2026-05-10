import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { getSessionUser } from '@/lib/api/auth'
import { jsonError, parseJsonBody } from '@/lib/api/http'

export const runtime = 'nodejs'

const ttsSchema = z.object({
  text: z.string().min(1),
})

export async function POST(request: NextRequest) {
  const parsed = await parseJsonBody(request, ttsSchema)
  if (!parsed.ok) {
    return parsed.response
  }

  const { text } = parsed.data

  const { user } = await getSessionUser()
  if (!user) {
    return jsonError('Unauthorized', 401)
  }

  if (!process.env.OPENAI_API_KEY) {
    return jsonError('OpenAI API key not configured', 500)
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
        voice: 'nova',
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
    return jsonError('Failed to generate audio', 500)
  }
}
