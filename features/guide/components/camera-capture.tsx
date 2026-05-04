'use client'

import { useEffect, useRef, useState } from 'react'
import { getCameraStream, stopCameraStream, captureImageFromVideo } from '../utils/camera'

type CameraCaptureProps = {
  onCapture: (imageDataUrl: string) => void
  captureInterval?: number
  isActive: boolean
}

export default function CameraCapture({
  onCapture,
  captureInterval = 2000,
  isActive,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  // Initialize camera
  useEffect(() => {
    let mounted = true

    async function initCamera() {
      try {
        const stream = await getCameraStream()
        if (!mounted) {
          stopCameraStream(stream)
          return
        }

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setIsReady(true)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'カメラの初期化に失敗しました')
        }
      }
    }

    initCamera()

    return () => {
      mounted = false
      if (streamRef.current) {
        stopCameraStream(streamRef.current)
        streamRef.current = null
      }
    }
  }, [])

  // Periodic capture
  useEffect(() => {
    if (!isActive || !isReady || !videoRef.current) {
      return
    }

    const intervalId = setInterval(() => {
      if (videoRef.current) {
        try {
          const imageDataUrl = captureImageFromVideo(videoRef.current)
          onCapture(imageDataUrl)
        } catch (err) {
          console.error('Failed to capture image:', err)
        }
      }
    }, captureInterval)

    return () => clearInterval(intervalId)
  }, [isActive, isReady, captureInterval, onCapture])

  if (error) {
    return (
      <div className="flex items-center justify-center bg-black text-white p-8 rounded-lg">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
          <p>カメラを初期化中...</p>
        </div>
      )}
      {isActive && isReady && (
        <div className="absolute top-4 right-4 w-3 h-3 bg-red-600 rounded-full animate-pulse" />
      )}
    </div>
  )
}
