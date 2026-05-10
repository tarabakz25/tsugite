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

  const cameraPanel =
    scenes.length === 0 ? null : (
      <div className="relative isolate flex min-h-[42vh] w-full overflow-hidden rounded-2xl border border-washi-3 bg-[#081018] shadow-inner lg:aspect-video lg:min-h-[360px]">
        <CameraCapture onCapture={handleCapture} captureInterval={2000} isActive={isActive} />

        {(status === 'analyzing' || status === 'speaking') && (
          <div
            className="pointer-events-none absolute inset-0 animate-pulse bg-shu/20"
            aria-hidden
          />
        )}

        {feedback && isActive ? (
          <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black via-black/80 to-transparent p-6 pt-28 text-white md:hidden md:bg-none md:p-0">
            <div className="rounded-xl border border-white/10 bg-black/72 p-5 shadow-lg backdrop-blur-sm">
              <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-white/85">
                先代視点フィードバック
              </p>
              <p className="mt-3 max-h-[9.5rem] overflow-y-auto text-lg font-semibold leading-snug text-white drop-shadow-[0_1px_2px_rgb(0_0_0/0.6)]">
                {feedback.text}
              </p>
              {status === 'analyzing' ? (
                <p className="mt-2 text-xs text-white/80">AIがシーンとの差を計算しています…</p>
              ) : null}
            </div>
          </div>
        ) : null}

        {isActive ? (
          <div className="pointer-events-none absolute left-6 top-6 z-[5] lg:left-10 lg:top-10">
            <Badge tone="success" className="shadow-lg shadow-black/30">
              REC
            </Badge>
          </div>
        ) : null}

        {!isActive && (
          <div className="pointer-events-none absolute inset-0 hidden items-center justify-center bg-black/45 text-white md:flex lg:hidden">
            <p className="max-w-[18rem] text-center text-sm font-semibold">
              「ガイドを開始」を押してカメラを起動します
            </p>
          </div>
        )}
      </div>
    )

  const controlPanel =
    scenes.length === 0 ? null : (
      <Card className="space-y-5 border border-washi-3 p-6 shadow-none">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-bold text-ink">シーンと操作</h3>
          {getStatusBadge()}
        </div>

        <div className="space-y-5">
          <div>
            <label
              className="mb-2 ml-1 block text-sm font-semibold text-ink-2"
              htmlFor="guide-scene-select"
            >
              シーンを選択
            </label>
            <select
              id="guide-scene-select"
              value={selectedScene?.id || ''}
              onChange={(e) => {
                const scene = scenes.find((s) => s.id === e.target.value)
                setSelectedScene(scene || null)
              }}
              disabled={isActive}
              className="w-full rounded-xl border border-washi-3 bg-white px-3 py-3 text-base leading-snug text-ink shadow-sm transition focus:border-shu focus:outline-none focus:ring-[3px] focus:ring-shu/35 disabled:bg-washi-3"
            >
              {scenes.map((scene) => (
                <option key={scene.id} value={scene.id}>
                  {scene.sceneName}
                  {scene.season ? ` (${scene.season})` : ''}
                </option>
              ))}
            </select>
          </div>

          {!isActive ? (
            <Button
              size="lg"
              onClick={handleStart}
              disabled={!selectedScene}
              className="min-h-[56px] w-full text-[17px]"
            >
              ガイドを開始（カメラON）
            </Button>
          ) : (
            <Button
              variant="danger"
              size="lg"
              className="min-h-[56px] w-full text-[17px]"
              onClick={handleStop}
            >
              ガイドを停止
            </Button>
          )}
        </div>
      </Card>
    )

  const stepsCard = (
    <Card className="border border-transparent bg-washi-2/80 p-6 shadow-none">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-ink-3">運用ヒント</p>
      <ol className="mt-4 space-y-3 text-sm leading-relaxed text-ink">
        <li>
          <span className="font-semibold text-shu">1.</span>{' '}
          屋外・明るめの環境での利用をおすすめします。
        </li>
        <li>
          <span className="font-semibold text-shu">2.</span>{' '}
          音声ガイダンスは自動再生されますが、環境によりミュート状態のときは画面上の文言を読み上げください。
        </li>
        <li>
          <span className="font-semibold text-shu">3.</span>{' '}
          プライベートな情報が映らないよう、開始前に画角だけ軽く確認してください。
        </li>
      </ol>
    </Card>
  )

  if (scenes.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="mx-auto max-w-xl space-y-5">
          <div>
            <h2 className="text-lg font-bold text-ink">参照シーンが登録されていません</h2>
            <p className="mt-2 text-sm leading-6 text-ink-2">
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
    <PageContainer maxWidth="7xl">
      <PageHeader
        title="Guide — リアルタイム練習"
        description="カメラ越しに、正解との差だけを音声とテキストで返します。"
        rightContent={<div className="hidden sm:block">{getStatusBadge()}</div>}
      />

      <Card className="border border-warning/30 bg-warning-bg p-6 shadow-none">
        <div className="flex flex-wrap items-start gap-3">
          <span className="text-lg text-warning leading-none">⚠︎</span>
          <p className="min-w-[16rem] flex-1 text-sm font-medium leading-relaxed text-ink">
            <strong className="font-bold">デモ・検証環境:</strong>{' '}
            送信した画像はクラウドの視覚モデルまで届きます。モザイクの必要な環境では利用しないでください。
          </p>
        </div>
      </Card>

      <div className="mt-8 space-y-6 lg:hidden">{cameraPanel}</div>

      <div className="mt-10 hidden lg:block">
        <SplitLayout
          main={
            <div className="flex flex-col gap-8">
              {cameraPanel}
              {stepsCard}
            </div>
          }
          side={
            <div className="sticky top-[calc(env(safe-area-inset-top)+1.5rem)] space-y-6">
              {controlPanel}
              <FeedbackDisplay feedback={feedback} />
            </div>
          }
        />
      </div>

      {/* モバイル: サイドコンテンツを縦並び */}
      <div className="mt-6 space-y-5 lg:hidden">
        {controlPanel}
        {/* オーバーレイに加え詳細ログを表示 */}
        <FeedbackDisplay feedback={feedback} emphasized />
        {stepsCard}
      </div>
    </PageContainer>
  )
}
