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
      <div className="bg-washi-50 border border-sumi-200 rounded-lg p-6 text-center text-sumi-500">
        カメラをシーンにかざしてください
      </div>
    )
  }

  return (
    <div className="bg-washi-50 border border-sumi-200 rounded-lg p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-sumi-600 mb-2">先代からのフィードバック</h3>
          <p className="text-base text-sumi-900 leading-relaxed">{feedback.text}</p>
        </div>
        {isPlaying && (
          <div className="ml-4 flex items-center gap-2 text-sm text-sumi-500">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-aka-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-aka-500"></span>
            </span>
            再生中
          </div>
        )}
      </div>
    </div>
  )
}
