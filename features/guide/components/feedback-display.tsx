'use client'

import { useEffect, useRef, useState } from 'react'
import type { GuideFeedback } from '../types'

type FeedbackDisplayProps = {
  feedback: GuideFeedback | null
}

export default function FeedbackDisplay({ feedback }: FeedbackDisplayProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (!feedback?.audioUrl) return

    // Auto-play audio when new feedback arrives
    const audio = new Audio(feedback.audioUrl)
    audioRef.current = audio

    audio.onplay = () => setIsPlaying(true)
    audio.onended = () => setIsPlaying(false)
    audio.onerror = () => setIsPlaying(false)

    audio.play().catch((error) => {
      console.error('Audio playback failed:', error)
      setIsPlaying(false)
    })

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [feedback?.audioUrl, feedback?.timestamp])

  if (!feedback) {
    return (
      <div className="rounded-lg border border-washi-3 bg-white p-5 text-center text-sm text-ink-4 sm:p-6">
        カメラをシーンにかざしてください
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-lg border border-washi-3 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="mb-2 text-sm font-medium text-ink-3">先代からのフィードバック</h3>
          <p className="break-words text-base leading-7 text-ink">{feedback.text}</p>
        </div>
        {isPlaying && (
          <div className="flex shrink-0 items-center gap-2 text-sm text-ink-4">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-shu opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-shu"></span>
            </span>
            再生中
          </div>
        )}
      </div>
    </div>
  )
}
