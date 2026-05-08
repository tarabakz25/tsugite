'use client'

import { useState } from 'react'
import Card from '@/components/ui/card'
import Button from '@/components/ui/button'
import StatusBadge from '@/components/ui/status-badge'

import type { Interview } from '@/features/archive/types'

type InterviewsListProps = {
  interviews: Interview[]
  onProcess?: (interviewId: string) => void
  onDelete?: (interviewId: string) => Promise<void>
}

export default function InterviewsList({ interviews, onProcess, onDelete }: InterviewsListProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

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

  const handleDeleteClick = (interviewId: string) => {
    setConfirmId(interviewId)
  }

  const handleConfirm = async (interviewId: string) => {
    setConfirmId(null)
    setDeletingId(interviewId)
    try {
      if (onDelete) {
        await onDelete(interviewId)
      }
    } finally {
      setDeletingId(null)
    }
  }

  const handleCancel = () => {
    setConfirmId(null)
  }

  if (interviews.length === 0) {
    return (
      <div className="py-8 text-center text-ink/50">
        まだインタビュー動画・音声がアップロードされていません。
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {interviews.map((interview) => (
        <Card key={interview.id} className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-ink">
                インタビュー #{interview.id.slice(0, 8)}
              </h3>
              <p className="mt-1 text-xs text-ink/50">
                アップロード日時: {new Date(interview.createdAt).toLocaleString('ja-JP')}
              </p>
              {interview.durationSec && (
                <p className="text-xs text-ink/50">
                  長さ: {Math.floor(interview.durationSec / 60)}分{interview.durationSec % 60}秒
                </p>
              )}
            </div>
            <StatusBadge status={interview.transcript ? 'completed' : 'incomplete'} />
          </div>

          {interview.transcript && (
            <div className="border-t border-washi-3 pt-3">
              <p className="mb-2 text-xs font-medium text-ink/50">文字起こし</p>
              <p className="line-clamp-3 text-sm text-ink">{interview.transcript}</p>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            {!interview.transcript && (
              <Button
                size="sm"
                onClick={() => handleProcess(interview.id)}
                disabled={processingId === interview.id}
              >
                {processingId === interview.id ? '処理中...' : '文字起こし・暗黙知抽出'}
              </Button>
            )}

            {onDelete && (
              <div className="ml-auto flex items-center gap-2">
                {confirmId === interview.id ? (
                  <>
                    <span className="text-xs text-ink/60">本当に削除しますか？</span>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleConfirm(interview.id)}
                      disabled={deletingId === interview.id}
                    >
                      削除
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancel}>
                      キャンセル
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteClick(interview.id)}
                    disabled={deletingId === interview.id}
                  >
                    {deletingId === interview.id ? '削除中...' : '削除'}
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}
