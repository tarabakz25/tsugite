'use client'

import { useEffect, useRef, useState } from 'react'
import type { GuideFeedback } from '../types'

type FeedbackDisplayProps = {
  feedback: GuideFeedback | null
  emphasized?: boolean
}

export default function FeedbackDisplay({ feedback, emphasized = false }: FeedbackDisplayProps) {
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
      <div className="rounded-xl border border-washi-3 bg-surface-muted p-6 text-center text-base text-ink-3 lg:text-sm">
        カメラをシーンにかざしてください
      </div>
    )
  }

  const textCls = emphasized
    ? 'text-lg font-medium leading-snug text-ink sm:text-xl'
    : 'text-base leading-relaxed text-ink'

  return (
    <div className="space-y-4 rounded-xl border border-washi-3 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3 lg:text-xs">
            先代からのフィードバック
          </h3>
          <p className={textCls}>{feedback.text}</p>
        </div>
        {isPlaying ? (
          <div className="flex shrink-0 items-center gap-2 text-xs font-semibold text-shu lg:text-sm">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-shu opacity-55" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-shu" />
            </span>
            再生中
          </div>
        ) : null}
      </div>
    </div>
  )
}
