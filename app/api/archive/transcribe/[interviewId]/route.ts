import type { NextRequest } from 'next/server'

import { getSessionUser } from '@/lib/api/auth'
import { jsonError } from '@/lib/api/http'
import { openai } from '@/lib/openai'
import { getStorageFileName } from '@/features/archive/utils/media'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(
  _request: NextRequest,
  ctx: RouteContext<'/api/archive/transcribe/[interviewId]'>,
) {
  const { interviewId } = await ctx.params

  const { supabase, user } = await getSessionUser()
  if (!user) {
    return jsonError('Unauthorized', 401)
  }

  const { data: interview } = await supabase
    .from('interviews')
    .select('*, shops!inner(owner_profile_id)')
    .eq('id', interviewId)
    .maybeSingle()

  if (!interview || interview.shops.owner_profile_id !== user.id) {
    return jsonError('Not found', 404)
  }

  if (interview.transcript) {
    return jsonError('Already transcribed', 400)
  }

  try {
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('interview-videos')
      .download(interview.storage_path)

    if (downloadError || !fileData) {
      console.error('Storage download error:', downloadError)
      return Response.json(
        { error: `Failed to download interview media: ${downloadError?.message ?? 'unknown'}` },
        { status: 500 },
      )
    }

    const WHISPER_MAX_BYTES = 25 * 1024 * 1024
    if (fileData.size > WHISPER_MAX_BYTES) {
      return Response.json(
        {
          error: `File too large for transcription (${(fileData.size / 1024 / 1024).toFixed(1)} MB). Maximum is 25 MB. Please upload an MP3 audio file instead.`,
        },
        { status: 422 },
      )
    }

    console.log(
      `[transcribe] interviewId=${interviewId} size=${fileData.size} type=${fileData.type} path=${interview.storage_path}`,
    )

    const file = new File([fileData], getStorageFileName(interview.storage_path), {
      type: fileData.type || 'audio/mpeg',
    })

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'ja',
    })

    const { error: updateError } = await supabase
      .from('interviews')
      .update({ transcript: transcription.text })
      .eq('id', interviewId)

    if (updateError) {
      console.error('DB update error:', updateError)
      return jsonError(`Failed to save transcript: ${updateError.message}`, 500)
    }

    return Response.json({
      success: true,
      transcript: transcription.text,
    })
  } catch (error) {
    console.error('Transcription error:', error)
    return jsonError(
      `Transcription failed: ${error instanceof Error ? error.message : String(error)}`,
      500,
    )
  }
}
