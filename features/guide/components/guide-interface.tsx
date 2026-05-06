'use client'

import { useState, useCallback, useMemo } from 'react'
import Button from '@/components/ui/button'
import Card from '@/components/ui/card'
import Badge from '@/components/ui/badge'
import Select from '@/components/ui/select'
import CameraCapture from './camera-capture'
import FeedbackDisplay from './feedback-display'
import type {
  GuideFeedback,
  GuideSourceType,
  GuideStatus,
  GuideTacitTag,
  SceneState,
} from '../types'
import { saveObservationLog } from '../actions'

type GuideInterfaceProps = {
  shopId: string
  scenes: SceneState[]
  tags: GuideTacitTag[]
}

type GuideSource = {
  correctState: Record<string, unknown> | null
  id: string
  key: `${GuideSourceType}:${string}`
  sceneId: string | null
  sceneName: string
  season?: string | null
  sourceTag: GuideTacitTag | null
  type: GuideSourceType
}

function getCorrectStateEntries(correctState: Record<string, unknown> | null) {
  if (!correctState) return []

  return Object.entries(correctState).filter(
    ([, value]) => value !== false && value !== null && value !== 0 && value !== '',
  )
}

function formatCorrectStateValue(value: unknown) {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return JSON.stringify(value)
}

export default function GuideInterface({ shopId, scenes, tags }: GuideInterfaceProps) {
  const guideSources = useMemo<GuideSource[]>(
    () => [
      ...scenes.map((scene) => ({
        correctState: scene.correctState,
        id: scene.id,
        key: `scene:${scene.id}` as const,
        sceneId: scene.id,
        sceneName: scene.sceneName,
        season: scene.season,
        sourceTag: scene.sourceTag ?? null,
        type: 'scene' as const,
      })),
      ...tags.map((tag) => ({
        correctState: null,
        id: tag.id,
        key: `tag:${tag.id}` as const,
        sceneId: null,
        sceneName: tag.situation,
        season: null,
        sourceTag: tag,
        type: 'tag' as const,
      })),
    ],
    [scenes, tags],
  )

  const [isActive, setIsActive] = useState(false)
  const [status, setStatus] = useState<GuideStatus>('idle')
  const [feedback, setFeedback] = useState<GuideFeedback | null>(null)
  const [selectedSourceKey, setSelectedSourceKey] = useState<string>(guideSources[0]?.key ?? '')
  const [lastProcessedImage, setLastProcessedImage] = useState<string | null>(null)

  const selectedSource =
    guideSources.find((source) => source.key === selectedSourceKey) ?? guideSources[0] ?? null

  const handleCapture = useCallback(
    async (imageDataUrl: string) => {
      if (!selectedSource || status === 'analyzing') {
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
            sceneName: selectedSource.sceneName,
            correctState: selectedSource.correctState,
            season: selectedSource.season,
            sourceTag: selectedSource.sourceTag
              ? {
                  id: selectedSource.sourceTag.id,
                  situation: selectedSource.sourceTag.situation,
                  judgment: selectedSource.sourceTag.judgment,
                  reason: selectedSource.sourceTag.reason,
                }
              : null,
            sourceType: selectedSource.type,
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
          sceneId: selectedSource.sceneId,
          visionResult: {
            items: analyzeData.visionResult.items,
            rawDescription: analyzeData.visionResult.rawDescription,
            differences: analyzeData.differences,
            guideSource: {
              id: selectedSource.id,
              sceneName: selectedSource.sceneName,
              sourceTagId: selectedSource.sourceTag?.id ?? null,
              type: selectedSource.type,
            },
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
    [selectedSource, status, lastProcessedImage, shopId],
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

  if (guideSources.length === 0) {
    return (
      <Card className="p-5 text-center sm:p-8">
        <h2 className="text-lg font-semibold text-ink">Guideで使える素材がありません</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink-3">
          Archiveで暗黙知タグを抽出すると、タグの状況・判断・理由をGuideの判断基準として使えます。
        </p>
      </Card>
    )
  }

  const correctStateEntries = getCorrectStateEntries(selectedSource?.correctState ?? null)

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink">Guide - AI弟子モード</h2>
          <p className="mt-1 text-sm leading-6 text-ink-3">
            カメラをかざして、先代の所作との差分を確認しましょう
          </p>
        </div>
        <div className="self-start">{getStatusBadge()}</div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)] lg:items-start">
        <aside className="space-y-4 lg:order-2">
          <Card className="p-4 sm:p-5">
            <div className="grid gap-4">
              <Select
                disabled={isActive}
                label="Guideソース"
                onChange={(event) => setSelectedSourceKey(event.target.value)}
                value={selectedSource?.key ?? ''}
              >
                {guideSources.map((source) => (
                  <option key={source.key} value={source.key}>
                    {source.type === 'scene' ? '参照シーン' : '暗黙知タグ'}: {source.sceneName}
                    {source.season ? ` (${source.season})` : ''}
                  </option>
                ))}
              </Select>

              {selectedSource?.sourceTag ? (
                <div className="grid gap-3 rounded-md border border-washi-2 bg-surface-muted p-3">
                  <div>
                    <p className="text-xs font-semibold text-shu">状況</p>
                    <p className="mt-1 break-words text-sm leading-6 text-ink">
                      {selectedSource.sourceTag.situation}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-ink-3">判断</p>
                    <p className="mt-1 break-words text-sm leading-6 text-ink">
                      {selectedSource.sourceTag.judgment}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-ink-4">理由</p>
                    <p className="mt-1 break-words text-sm leading-6 text-ink-3">
                      {selectedSource.sourceTag.reason}
                    </p>
                  </div>
                </div>
              ) : null}

              {correctStateEntries.length > 0 ? (
                <dl className="grid gap-2 rounded-md border border-washi-2 p-3">
                  {correctStateEntries.map(([key, value]) => (
                    <div className="flex items-start justify-between gap-3" key={key}>
                      <dt className="break-words text-sm font-medium text-ink">{key}</dt>
                      <dd className="max-w-[60%] break-words text-right text-sm text-ink-3">
                        {formatCorrectStateValue(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>
          </Card>

          <Card className="border-warning/25 bg-warning-bg p-4">
            <p className="text-sm leading-6 text-warning">
              <strong>デモモード:</strong> 画像はクラウドのVision
              APIに送信されます。プライバシー保証はありません。
            </p>
          </Card>

          <FeedbackDisplay feedback={feedback} />
        </aside>

        <section className="space-y-4 lg:order-1">
          <Card className="overflow-hidden p-3 sm:p-4">
            <CameraCapture onCapture={handleCapture} captureInterval={2000} isActive={isActive} />
          </Card>

          <div className="sticky bottom-0 z-20 -mx-6 border-t border-washi-3 bg-background/95 px-6 py-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
            {!isActive ? (
              <Button className="w-full" disabled={!selectedSource} onClick={handleStart} size="lg">
                ガイドを開始
              </Button>
            ) : (
              <Button className="w-full" onClick={handleStop} size="lg" variant="danger">
                停止
              </Button>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
