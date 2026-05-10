'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Mic, Upload, ArrowRight, Search, Plus } from 'lucide-react'

import Button from '@/components/ui/button'
import StatusBadge from '@/components/ui/status-badge'
import VideoUploadForm from '@/features/archive/components/video-upload-form'
import { deleteInterview } from '@/features/archive/actions'
import { deleteTacitTag } from '@/features/archive/actions'
import type { Interview, TacitTag } from '@/features/archive/types'

type ArchiveContentProps = {
  interviews: Interview[]
  tags: TacitTag[]
}

/** 暗黙知カテゴリ定義 */
const KNOWLEDGE_CATEGORIES = [
  {
    key: 'judge',
    kanji: '判断基準',
    color: 'navy' as const,
    desc: '値段だけでなく関係性、季節を読む、客の顔色 …',
  },
  {
    key: 'manner',
    kanji: '所作',
    color: 'shu' as const,
    desc: '湯切りの角度、お椀の置き位置、間合い …',
  },
  {
    key: 'person',
    kanji: '人柄',
    color: 'leaf' as const,
    desc: '口調、距離感、間、頑固さ、譲り方 …',
  },
  {
    key: 'region',
    kanji: '地域知',
    color: 'sky' as const,
    desc: '地元の祭事、隣家との関係、食文化 …',
  },
]

const COLOR_MAP = {
  navy: 'var(--navy)',
  shu: 'var(--shu)',
  leaf: 'var(--leaf)',
  sky: 'var(--sky)',
} as const

type ViewMode = 'overview' | 'upload'

export default function ArchiveContent({ interviews, tags }: ArchiveContentProps) {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'transcribed' | 'pending'>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('overview')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const transcribed = interviews.filter((i) => i.transcript)
  const pending = interviews.filter((i) => !i.transcript)
  const visible = filter === 'all' ? interviews : filter === 'transcribed' ? transcribed : pending

  const filters = [
    { k: 'all' as const, label: '全て', n: interviews.length },
    { k: 'transcribed' as const, label: '解析済', n: transcribed.length },
    { k: 'pending' as const, label: '未解析', n: pending.length },
  ]

  const handleProcess = async (interviewId: string) => {
    setProcessingId(interviewId)
    try {
      const transcribeRes = await fetch(`/api/archive/transcribe/${interviewId}`, {
        method: 'POST',
      })
      if (!transcribeRes.ok) {
        const body = await transcribeRes.json().catch(() => ({}))
        alert(`文字起こしに失敗しました: ${body.error ?? '不明なエラー'}`)
        return
      }
      const extractRes = await fetch(`/api/archive/extract/${interviewId}`, { method: 'POST' })
      if (!extractRes.ok) {
        const body = await extractRes.json().catch(() => ({}))
        alert(`暗黙知抽出に失敗しました: ${body.error ?? '不明なエラー'}`)
        return
      }
      const extractData = await extractRes.json()
      if (extractData.tags) {
        for (const tag of extractData.tags) {
          await fetch(`/api/archive/embed/${tag.id}`, { method: 'POST' })
        }
      }
      window.location.reload()
    } catch (err) {
      alert(`処理中にエラーが発生しました: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setProcessingId(null)
    }
  }

  const handleDelete = (interviewId: string) => {
    if (!window.confirm('このインタビューを削除しますか？')) return
    startTransition(() => {
      void (async () => {
        setDeletingId(interviewId)
        const result = await deleteInterview(interviewId)
        setDeletingId(null)
        if (result.ok) {
          router.refresh()
        } else {
          alert('削除に失敗しました。')
        }
      })()
    })
  }

  const handleDeleteTag = (tagId: string) => {
    if (!window.confirm('この暗黙知タグを削除しますか？')) return
    startTransition(() => {
      void (async () => {
        setDeletingId(tagId)
        const result = await deleteTacitTag(tagId)
        setDeletingId(null)
        if (result.ok) {
          router.refresh()
        } else {
          alert('削除に失敗しました。')
        }
      })()
    })
  }

  if (viewMode === 'upload') {
    return (
      <div className="mx-auto w-full max-w-[1320px] px-6 py-7 md:px-8">
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => setViewMode('overview')}
            className="text-sm font-semibold text-navy hover:underline"
          >
            ← 一覧に戻る
          </button>
        </div>
        <div className="max-w-2xl">
          <h2 className="mb-4 font-serif text-lg font-bold text-ink">
            新しいインタビュー動画・音声をアップロード
          </h2>
          <VideoUploadForm onSuccess={() => window.location.reload()} />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-7 px-6 py-7 md:px-8">
      {/* 暗黙知カテゴリカード */}
      <section>
        <div className="mb-3.5 flex items-baseline justify-between">
          <SectionLabel>抽出された暗黙知</SectionLabel>
          <span className="text-[11px] text-ink-3">合計 {tags.length} 件</span>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {KNOWLEDGE_CATEGORIES.map((cat) => {
            const c = COLOR_MAP[cat.color]
            // 実際のタグ数はカテゴリ分類がないのでタグ総数を4等分で表示（モック的に）
            const count = Math.floor(tags.length / 4)
            return (
              <div
                key={cat.key}
                className="relative overflow-hidden rounded-xl border border-[var(--line-soft)] bg-paper-4 p-4"
              >
                <div className="absolute left-0 top-0 h-full w-[3px]" style={{ background: c }} />
                <div className="flex items-baseline justify-between">
                  <span className="font-serif text-base font-bold tracking-[0.05em]">
                    {cat.kanji}
                  </span>
                  <span
                    className="font-serif text-[22px] font-bold tabular-nums"
                    style={{ color: c }}
                  >
                    {count}
                  </span>
                </div>
                <p className="mt-2 text-[11px] leading-[1.7] text-ink-3">{cat.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* アップロードバナー */}
      <section className="flex items-center gap-6 rounded-[14px] border border-shu bg-paper-4 px-6 py-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-shu/10 animate-pulse-soft">
          <Mic size={22} className="text-shu" />
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-bold text-ink">新しいインタビュー・動画を記録しましょう</p>
          <p className="mt-0.5 text-[11px] text-ink-3">
            音声・動画をアップロードすると、AIが自動で暗黙知を抽出します
          </p>
        </div>
        <button
          onClick={() => setViewMode('upload')}
          className="inline-flex items-center gap-2 rounded-full bg-shu px-4 py-2.5 text-[13px] font-semibold text-white transition hover:brightness-110"
        >
          <Upload size={14} />
          アップロード
        </button>
      </section>

      {/* フィルター + インタビュー一覧 */}
      <section>
        <div className="mb-4 flex flex-wrap items-center gap-2.5">
          {filters.map((f) => (
            <button
              key={f.k}
              onClick={() => setFilter(f.k)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                filter === f.k
                  ? 'border-navy bg-navy text-white'
                  : 'border-[var(--line)] bg-transparent text-ink-2 hover:bg-washi'
              }`}
            >
              {f.label}
              <span className="text-[10px] opacity-70">{f.n}</span>
            </button>
          ))}
          <div className="flex-1" />
          <span className="text-[11px] text-ink-3">並び順: 新しい順</span>
        </div>

        {visible.length === 0 ? (
          <div className="rounded-2xl border border-[var(--line-soft)] bg-paper-4 py-16 text-center">
            <p className="text-sm text-ink-3">
              {filter === 'all'
                ? 'まだインタビューがアップロードされていません。'
                : filter === 'transcribed'
                  ? '解析済みのインタビューはまだありません。'
                  : '未解析のインタビューはありません。'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((interview) => {
              const hasTranscript = !!interview.transcript
              const gradientColor = hasTranscript ? 'var(--navy)' : 'var(--ink-3)'
              const duration = interview.durationSec
                ? `${Math.floor(interview.durationSec / 60)}分${interview.durationSec % 60}秒`
                : '—'

              return (
                <article
                  key={interview.id}
                  className="flex cursor-pointer flex-col overflow-hidden rounded-[14px] border border-[var(--line-soft)] bg-paper-4 transition hover:shadow-md"
                >
                  {/* グラデーションヘッダー */}
                  <div
                    className="relative flex h-[120px] items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${gradientColor} 0%, color-mix(in oklab, ${gradientColor} 70%, black) 100%)`,
                    }}
                  >
                    <Mic size={36} className="text-white/80" strokeWidth={1.4} />
                    <span className="absolute left-2.5 top-2.5 rounded-full border border-white/30 bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                      インタビュー
                    </span>
                    <span className="absolute bottom-2.5 right-2.5 rounded bg-black/40 px-2 py-0.5 font-mono text-[11px] text-white">
                      {duration}
                    </span>
                  </div>

                  {/* 情報 */}
                  <div className="flex flex-1 flex-col gap-2.5 p-4">
                    <h3 className="font-serif text-[15px] font-bold leading-snug tracking-[0.03em]">
                      インタビュー #{interview.id.slice(0, 8)}
                    </h3>
                    <p className="text-[10px] text-ink-3">
                      {new Date(interview.createdAt).toLocaleDateString('ja-JP')}
                    </p>

                    {interview.transcript && (
                      <p className="line-clamp-2 text-xs leading-relaxed text-ink-2">
                        {interview.transcript}
                      </p>
                    )}

                    <div className="mt-auto flex items-center justify-between border-t border-dotted border-[var(--line-soft)] pt-2.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`size-1.5 rounded-full ${hasTranscript ? 'bg-leaf' : 'bg-ink-4'}`}
                        />
                        <span className="text-[10px] tracking-[0.05em] text-ink-3">
                          {hasTranscript ? '解析済' : '未解析'}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        {!hasTranscript && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleProcess(interview.id)
                            }}
                            disabled={processingId === interview.id}
                            className="h-7 rounded-md px-2.5 text-[10px]"
                          >
                            {processingId === interview.id ? '処理中…' : '解析する'}
                          </Button>
                        )}
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(interview.id)
                          }}
                          disabled={deletingId === interview.id}
                          className="h-7 rounded-md px-2.5 text-[10px]"
                        >
                          削除
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {/* 暗黙知タグ一覧 */}
      {tags.length > 0 && (
        <section>
          <div className="mb-3.5 flex items-baseline justify-between">
            <SectionLabel accent="shu">暗黙知タグ</SectionLabel>
            <span className="text-[11px] text-ink-3">{tags.length} 件</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="flex flex-col gap-2 rounded-xl border border-[var(--line-soft)] bg-paper-4 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif text-sm font-bold text-ink">暗黙知</span>
                  {tag.isInferred && (
                    <span className="rounded-full bg-shu/10 px-2 py-0.5 text-[9px] font-semibold text-shu">
                      AI抽出
                    </span>
                  )}
                </div>
                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-[9px] font-semibold tracking-[0.15em] text-ink-4">
                      状況
                    </span>
                    <p className="text-ink">{tag.situation}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-semibold tracking-[0.15em] text-ink-4">
                      判断
                    </span>
                    <p className="text-ink">{tag.judgment}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-semibold tracking-[0.15em] text-ink-4">
                      理由
                    </span>
                    <p className="text-ink">{tag.reason}</p>
                  </div>
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-dotted border-[var(--line-soft)] pt-2">
                  <span className="text-[10px] text-ink-4">
                    {new Date(tag.createdAt).toLocaleDateString('ja-JP')}
                  </span>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteTag(tag.id)}
                    disabled={deletingId === tag.id}
                    className="h-6 rounded-md px-2 text-[9px]"
                  >
                    削除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function SectionLabel({
  children,
  accent = 'navy',
}: {
  children: React.ReactNode
  accent?: 'navy' | 'shu' | 'leaf' | 'sky'
}) {
  const colorMap = {
    navy: 'bg-navy',
    shu: 'bg-shu',
    leaf: 'bg-leaf',
    sky: 'bg-sky',
  }
  return (
    <div className="inline-flex items-center gap-2.5">
      <span className={`h-4 w-[3px] ${colorMap[accent]}`} />
      <span className="text-[13px] font-bold tracking-[0.2em] text-ink">{children}</span>
    </div>
  )
}
