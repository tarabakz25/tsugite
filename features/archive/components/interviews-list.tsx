'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/card'
import Button from '@/components/ui/button'
import StatusBadge from '@/components/ui/status-badge'
import GridList from '@/components/layout/grid-list'

import type { Interview } from '@/features/archive/types'
import { deleteInterview } from '@/features/archive/actions'

const PROCESS_LABEL_IDLE = '文字起こし・暗黙知抽出'
const PROCESS_LABEL_WORKING = '処理中...'

const DELETE_ERROR_MESSAGES: Record<
  Exclude<Awaited<ReturnType<typeof deleteInterview>>, { ok: true }>['error'],
  string
> = {
  not_authenticated: 'ログイン情報が無効です。再度ログインしてください。',
  no_shop: '店舗情報が見つかりません。',
  not_found: 'インタビューが見つからないか、削除済みです。',
  db_error: '削除に失敗しました。時間をおいて再度お試しください。',
}

function resolveProcessLabel(isThisInterviewProcessing: boolean): string {
  const labelMap: Record<'processing' | 'idle', string> = {
    processing: PROCESS_LABEL_WORKING,
    idle: PROCESS_LABEL_IDLE,
  }
  if (isThisInterviewProcessing) {
    return labelMap.processing
  }
  return labelMap.idle
}

type InterviewsListProps = {
  interviews: Interview[]
  onProcess?: (interviewId: string) => void
}

export default function InterviewsList({ interviews, onProcess }: InterviewsListProps) {
  const router = useRouter()
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [deletingInterviewId, setDeletingInterviewId] = useState<string | null>(null)
  const [, startDeleteTransition] = useTransition()

  const handleDelete = (interviewId: string) => {
    const message =
      'このインタビューを削除しますか？ストレージ上の音声・動画ファイルとレコードが削除されます。関連する暗黙知タグは残りますが、インタビューとの紐づけは外れます。'
    const confirmed = window.confirm(message)
    if (!confirmed) {
      return
    }

    startDeleteTransition(() => {
      void (async () => {
        setDeletingInterviewId(interviewId)
        const result = await deleteInterview(interviewId)
        setDeletingInterviewId(null)
        if (result.ok) {
          router.refresh()
          return
        }
        const msg = DELETE_ERROR_MESSAGES[result.error]
        alert(msg)
      })()
    })
  }

  const handleProcess = async (interviewId: string) => {
    setProcessingId(interviewId)
    try {
      if (onProcess) {
        await onProcess(interviewId)
      }
    } finally {
      setProcessingId(null)
    }
  }

  if (interviews.length === 0) {
    return (
      <div className="text-center py-12 text-ink-3">
        まだインタビュー動画・音声がアップロードされていません。
      </div>
    )
  }

  return (
    <GridList columns={2}>
      {interviews.map((interview) => (
        <Card key={interview.id} className="flex flex-col gap-4 p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-ink">
                インタビュー #{interview.id.slice(0, 8)}
              </h3>
              <p className="text-xs text-ink-3 mt-1">
                アップロード日時: {new Date(interview.createdAt).toLocaleString('ja-JP')}
              </p>
              {interview.durationSec && (
                <p className="text-xs text-ink-3">
                  長さ: {Math.floor(interview.durationSec / 60)}分{interview.durationSec % 60}秒
                </p>
              )}
            </div>
            <StatusBadge status={interview.transcript ? 'completed' : 'incomplete'} />
          </div>

          {interview.transcript && (
            <div className="border-t border-washi-3 pt-3">
              <p className="text-xs font-medium text-ink-3 mb-2">文字起こし</p>
              <p className="text-sm text-ink-2 line-clamp-3">{interview.transcript}</p>
            </div>
          )}

          <div className="mt-auto flex flex-col gap-2">
            {!interview.transcript && (
              <Button
                size="sm"
                onClick={() => handleProcess(interview.id)}
                disabled={processingId === interview.id}
              >
                {resolveProcessLabel(processingId === interview.id)}
              </Button>
            )}

            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDelete(interview.id)}
              disabled={deletingInterviewId === interview.id}
              isLoading={deletingInterviewId === interview.id}
            >
              削除
            </Button>
          </div>
        </Card>
      ))}
    </GridList>
  )
}
