'use client'

import Link from 'next/link'
import { useCallback, useRef, useState } from 'react'
import Badge from '@/components/ui/badge'
import Button from '@/components/ui/button'
import Card from '@/components/ui/card'
import PageContainer from '@/components/layout/page-container'
import PageHeader from '@/components/layout/page-header'
import SplitLayout from '@/components/layout/split-layout'
import CameraCapture from './camera-capture'
import FeedbackDisplay from './feedback-display'
import type { GuideAnalysisStatus, GuideFeedback, GuideStatus, SceneState } from '../types'
import { saveObservationLog } from '../actions'

const FEEDBACK_COOLDOWN_MS = 5000

type GuideInterfaceProps = {
  shopId: string
  scenes: SceneState[]
}

type ProcessingErrors = {
  analysis?: string
  tts?: string
  log?: string
}

type AnalyzeGuideResponse = {
  visionResult: {
    items: string[]
    rawDescription: string
    missing: string[]
    extra: string[]
    status: GuideAnalysisStatus
    sceneId: string
  }
  differences: {
    missing: string[]
    extra: string[]
  }
  status: GuideAnalysisStatus
  feedback: string
}

export default function GuideInterface({ shopId, scenes }: GuideInterfaceProps) {
  const [isActive, setIsActive] = useState(false)
  const [status, setStatus] = useState<GuideStatus>('idle')
  const [feedback, setFeedback] = useState<GuideFeedback | null>(null)
  const [selectedScene, setSelectedScene] = useState<SceneState | null>(
    scenes.length > 0 ? scenes[0] : null,
  )
  const [lastProcessedImage, setLastProcessedImage] = useState<string | null>(null)
  const [processingErrors, setProcessingErrors] = useState<ProcessingErrors>({})
  const isProcessingRef = useRef(false)
  const isActiveRef = useRef(false)
  const lastFeedbackAtRef = useRef(0)

  const hasProcessingErrors = Boolean(
    processingErrors.analysis || processingErrors.tts || processingErrors.log,
  )

  const handleCapture = useCallback(
    async (imageDataUrl: string) => {
      if (!selectedScene || isProcessingRef.current) {
        return
      }

      if (Date.now() - lastFeedbackAtRef.current < FEEDBACK_COOLDOWN_MS) {
        return
      }

      if (imageDataUrl === lastProcessedImage) {
        return
      }

      setLastProcessedImage(imageDataUrl)
      setProcessingErrors({})
      isProcessingRef.current = true
      setStatus('analyzing')

      try {
        const analyzeResponse = await fetch('/api/guide/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageDataUrl,
            sceneId: selectedScene.id,
          }),
        })

        if (!analyzeResponse.ok) {
          throw new Error('Scene analysis failed')
        }

        const analyzeData = (await analyzeResponse.json()) as AnalyzeGuideResponse

        let audioUrl: string | undefined

        try {
          setStatus('speaking')
          const ttsResponse = await fetch('/api/guide/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: analyzeData.feedback,
            }),
          })

          if (ttsResponse.ok) {
            const ttsData = (await ttsResponse.json()) as { audioData: string; mimeType: string }
            const audioBlob = new Blob(
              [Uint8Array.from(atob(ttsData.audioData), (c) => c.charCodeAt(0))],
              { type: ttsData.mimeType },
            )
            audioUrl = URL.createObjectURL(audioBlob)
          } else {
            setProcessingErrors((current) => ({
              ...current,
              tts: '音声生成に失敗しました。テキストのフィードバックは表示されています。',
            }))
          }
        } catch (ttsError) {
          console.error('Guide TTS error:', ttsError)
          setProcessingErrors((current) => ({
            ...current,
            tts: '音声生成に失敗しました。テキストのフィードバックは表示されています。',
          }))
        }

        const newFeedback: GuideFeedback = {
          text: analyzeData.feedback,
          audioUrl,
          timestamp: Date.now(),
        }

        setFeedback(newFeedback)
        lastFeedbackAtRef.current = Date.now()

        const logResult = await saveObservationLog({
          shopId,
          sceneId: selectedScene.id,
          visionResult: {
            ...analyzeData.visionResult,
            differences: analyzeData.differences,
            status: analyzeData.status,
            sceneId: selectedScene.id,
          },
          llmFeedback: analyzeData.feedback,
        })

        if (!logResult.success) {
          setProcessingErrors((current) => ({
            ...current,
            log: logResult.error || '観察ログの保存に失敗しました。',
          }))
        }

        setStatus(isActiveRef.current ? 'capturing' : 'idle')
      } catch (error) {
        console.error('Guide processing error:', error)
        setStatus('error')
        setProcessingErrors({
          analysis: '画像解析に失敗しました。シーンとカメラ映像を確認してください。',
        })
        setFeedback({
          text: 'エラーが発生しました。もう一度お試しください。',
          timestamp: Date.now(),
        })
        setTimeout(() => setStatus(isActiveRef.current ? 'capturing' : 'idle'), 3000)
      } finally {
        isProcessingRef.current = false
      }
    },
    [selectedScene, lastProcessedImage, shopId],
  )

  const handleStart = () => {
    isActiveRef.current = true
    setIsActive(true)
    setStatus('capturing')
    setLastProcessedImage(null)
    setProcessingErrors({})
  }

  const handleStop = () => {
    isActiveRef.current = false
    setIsActive(false)
    setStatus('idle')
    setLastProcessedImage(null)
    setProcessingErrors({})
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
        <div className="mx-auto max-w-xl space-y-5">
          <div>
            <h2 className="text-lg font-bold text-ink">参照シーンが登録されていません</h2>
            <p className="mt-2 text-sm leading-6 text-sumi-600">
              Archiveの暗黙知タグからGuideシーンを生成してください。生成後にこの画面で選択できます。
            </p>
          </div>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-shu bg-shu px-4 text-sm font-semibold text-white transition-colors hover:bg-shu-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shu"
              href="/shop/archive"
            >
              Archiveから生成
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-washi-3 bg-white px-4 text-sm font-semibold text-ink transition-colors hover:border-ink-4 hover:bg-washi focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shu"
              href="/shop/guide/scenes"
            >
              シーン管理
            </Link>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Guide - AI弟子モード"
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
            {hasProcessingErrors ? (
              <Card className="border-danger/20 bg-danger-bg/40 p-4">
                <h3 className="text-sm font-bold text-danger">処理状況</h3>
                <ul className="mt-2 space-y-1 text-sm text-danger">
                  {processingErrors.analysis ? <li>{processingErrors.analysis}</li> : null}
                  {processingErrors.tts ? <li>{processingErrors.tts}</li> : null}
                  {processingErrors.log ? <li>{processingErrors.log}</li> : null}
                </ul>
              </Card>
            ) : null}
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
                  <Link
                    className="mt-2 inline-flex text-xs font-semibold text-shu hover:text-shu-2"
                    href="/shop/guide/scenes"
                  >
                    シーン管理
                  </Link>
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
