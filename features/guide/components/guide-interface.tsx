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

      if (imageDataUrl === lastProcessedImage) {
        return
      }

      setLastProcessedImage(imageDataUrl)
      setStatus('analyzing')

      try {
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
      <PageContainer maxWidth="2xl">
        <Card className="border border-dashed border-warning/35 bg-warning-bg px-8 py-10 text-center shadow-none">
          <p className="text-lg font-semibold text-ink">
            Guide に表示できるシーンがまだありません。
          </p>
          <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-ink-2">
            先に Archive から参照シーンを登録すると、リアルタイム比較を開始できます。
          </p>
        </Card>
      </PageContainer>
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
