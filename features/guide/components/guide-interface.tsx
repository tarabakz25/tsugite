'use client'

import { useState, useCallback } from 'react'
import Button from '@/components/ui/button'
import Card from '@/components/ui/card'
import Badge from '@/components/ui/badge'
import PageContainer from '@/components/layout/page-container'
import PageHeader from '@/components/layout/page-header'
import SplitLayout from '@/components/layout/split-layout'
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
          まず記録機能でシーンを作成してください。
        </p>
      </Card>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="指南 - AI弟子モード"
        description="カメラをかざして、先代の所作との差分を確認しましょう"
        rightContent={getStatusBadge()}
      />

      <div className="mb-6">
        <Card className="bg-warning-bg border-warning/20 p-4">
          <p className="text-sm text-warning flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span>
              <strong>デモモード:</strong> 画像はクラウドのVision
              APIに送信されます。プライバシー保証はありません。
            </span>
          </p>
        </Card>
      </div>

      <SplitLayout
        main={
          <div className="space-y-6">
            <Card className="relative overflow-hidden bg-sumi-900 aspect-video flex items-center justify-center border-none shadow-xl">
              <CameraCapture onCapture={handleCapture} captureInterval={2000} isActive={isActive} />
              {isActive && (
                <div className="absolute top-4 left-4">
                  <Badge tone="success" className="animate-pulse shadow-md">
                    REC
                  </Badge>
                </div>
              )}
            </Card>
            <FeedbackDisplay feedback={feedback} />
          </div>
        }
        side={
          <div className="space-y-6">
            <Card className="p-5">
              <h3 className="text-sm font-bold text-ink mb-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-shu"></span>
                シーン設定
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-ink-3 mb-1.5 ml-0.5">
                    シーンを選択
                  </label>
                  <select
                    value={selectedScene?.id || ''}
                    onChange={(e) => {
                      const scene = scenes.find((s) => s.id === e.target.value)
                      setSelectedScene(scene || null)
                    }}
                    disabled={isActive}
                    className="w-full px-3 py-2 bg-washi border border-washi-3 rounded-md text-sm text-ink focus:outline-none focus:ring-2 focus:ring-shu/50 transition-all disabled:opacity-50"
                  >
                    {scenes.map((scene) => (
                      <option key={scene.id} value={scene.id}>
                        {scene.sceneName}
                        {scene.season ? ` (${scene.season})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2">
                  {!isActive ? (
                    <Button
                      onClick={handleStart}
                      disabled={!selectedScene}
                      className="w-full py-6 text-base font-bold shadow-lg shadow-shu/10"
                    >
                      ガイドを開始
                    </Button>
                  ) : (
                    <Button
                      onClick={handleStop}
                      variant="danger"
                      className="w-full py-6 text-base font-bold shadow-lg shadow-danger/10"
                    >
                      ガイドを停止
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-washi-2 border-none">
              <h4 className="text-xs font-bold text-ink-3 uppercase tracking-wider mb-3">
                ガイドの使いかた
              </h4>
              <ul className="text-xs text-ink-2 space-y-2.5">
                <li className="flex gap-2">
                  <span className="text-shu">1.</span>
                  <span>現在の状況に合ったシーンを選択してください。</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-shu">2.</span>
                  <span>「ガイドを開始」を押すとカメラが起動します。</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-shu">3.</span>
                  <span>AIがリアルタイムで所作の改善点を音声でお伝えします。</span>
                </li>
              </ul>
            </Card>
          </div>
        }
      />
    </PageContainer>
  )
}
