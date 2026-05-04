'use client'

import { useState, useCallback } from 'react'
import Button from '@/components/ui/button'
import Card from '@/components/ui/card'
import Badge from '@/components/ui/badge'
import CameraCapture from './camera-capture'
import FeedbackDisplay from './feedback-display'
import type { GuideFeedback, GuideStatus, SceneState } from '../types'
import { saveObservationLog } from '../actions'

type GuideInterfaceProps = {
  shopId: string
  scenes: SceneState[]
}

export default function GuideInterface({ shopId, scenes }: GuideInterfaceProps) {
  const [isActive, setIsActive] = useState(false)
  const [status, setStatus] = useState<GuideStatus>('idle')
  const [feedback, setFeedback] = useState<GuideFeedback | null>(null)
  const [selectedScene, setSelectedScene] = useState<SceneState | null>(
    scenes.length > 0 ? scenes[0] : null,
  )
  const [lastProcessedImage, setLastProcessedImage] = useState<string | null>(null)

  const handleCapture = useCallback(
    async (imageDataUrl: string) => {
      if (!selectedScene || status === 'analyzing') {
        return
      }

      // Avoid processing the same image multiple times
      if (imageDataUrl === lastProcessedImage) {
        return
      }

      setLastProcessedImage(imageDataUrl)
      setStatus('analyzing')

      try {
        // Step 1: Analyze scene
        const analyzeResponse = await fetch('/api/guide/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageDataUrl,
            sceneName: selectedScene.sceneName,
            correctState: selectedScene.correctState,
            season: selectedScene.season,
          }),
        })

        if (!analyzeResponse.ok) {
          throw new Error('Scene analysis failed')
        }

        const analyzeData = await analyzeResponse.json()

        // Step 2: Generate TTS
        setStatus('speaking')
        const ttsResponse = await fetch('/api/guide/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: analyzeData.feedback,
          }),
        })

        let audioUrl: string | undefined

        if (ttsResponse.ok) {
          const ttsData = await ttsResponse.json()
          const audioBlob = new Blob(
            [Uint8Array.from(atob(ttsData.audioData), (c) => c.charCodeAt(0))],
            { type: ttsData.mimeType },
          )
          audioUrl = URL.createObjectURL(audioBlob)
        }

        const newFeedback: GuideFeedback = {
          text: analyzeData.feedback,
          audioUrl,
          timestamp: Date.now(),
        }

        setFeedback(newFeedback)

        // Step 3: Save observation log
        await saveObservationLog({
          shopId,
          sceneId: selectedScene.id,
          visionResult: {
            items: analyzeData.visionResult.items,
            rawDescription: analyzeData.visionResult.rawDescription,
            differences: analyzeData.differences,
          },
          llmFeedback: analyzeData.feedback,
        })

        setStatus('idle')
      } catch (error) {
        console.error('Guide processing error:', error)
        setStatus('error')
        setFeedback({
          text: 'エラーが発生しました。もう一度お試しください。',
          timestamp: Date.now(),
        })
        setTimeout(() => setStatus('idle'), 3000)
      }
    },
    [selectedScene, status, lastProcessedImage, shopId],
  )

  const handleStart = () => {
    setIsActive(true)
    setStatus('capturing')
    setLastProcessedImage(null)
  }

  const handleStop = () => {
    setIsActive(false)
    setStatus('idle')
    setLastProcessedImage(null)
  }

  const getStatusBadge = () => {
    switch (status) {
      case 'initializing':
        return <Badge tone="neutral">初期化中</Badge>
      case 'capturing':
        return <Badge tone="success">撮影中</Badge>
      case 'analyzing':
        return <Badge tone="neutral">分析中</Badge>
      case 'speaking':
        return <Badge tone="success">フィードバック中</Badge>
      case 'error':
        return <Badge tone="danger">エラー</Badge>
      default:
        return <Badge tone="neutral">待機中</Badge>
    }
  }

  if (scenes.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sumi-600">
          参照シーンが登録されていません。
          <br />
          まずArchive機能でシーンを作成してください。
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-sumi-900">Guide - AI弟子モード</h2>
          <p className="text-sm text-sumi-600 mt-1">
            カメラをかざして、先代の所作との差分を確認しましょう
          </p>
        </div>
        {getStatusBadge()}
      </div>

      {/* Privacy Notice */}
      <Card className="bg-yellow-50 border-yellow-200 p-4">
        <p className="text-sm text-yellow-900">
          ⚠️
          <strong>デモモード:</strong> 画像はクラウドのVision
          APIに送信されます。プライバシー保証はありません。
        </p>
      </Card>

      {/* Scene Selection */}
      <Card className="p-4">
        <label className="block text-sm font-medium text-sumi-700 mb-2">シーンを選択</label>
        <select
          value={selectedScene?.id || ''}
          onChange={(e) => {
            const scene = scenes.find((s) => s.id === e.target.value)
            setSelectedScene(scene || null)
          }}
          disabled={isActive}
          className="w-full px-3 py-2 border border-sumi-300 rounded-md focus:outline-none focus:ring-2 focus:ring-aka-500"
        >
          {scenes.map((scene) => (
            <option key={scene.id} value={scene.id}>
              {scene.sceneName}
              {scene.season ? ` (${scene.season})` : ''}
            </option>
          ))}
        </select>
      </Card>

      {/* Camera View */}
      <Card className="p-4">
        <CameraCapture onCapture={handleCapture} captureInterval={2000} isActive={isActive} />
      </Card>

      {/* Control Buttons */}
      <div className="flex gap-4">
        {!isActive ? (
          <Button onClick={handleStart} disabled={!selectedScene} className="flex-1">
            ガイドを開始
          </Button>
        ) : (
          <Button onClick={handleStop} variant="danger" className="flex-1">
            停止
          </Button>
        )}
      </div>

      {/* Feedback Display */}
      <FeedbackDisplay feedback={feedback} />
    </div>
  )
}
