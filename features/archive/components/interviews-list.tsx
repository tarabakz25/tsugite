'use client'

import { useState } from 'react'
import Card from '@/components/ui/card'
import Button from '@/components/ui/button'
import StatusBadge from '@/components/ui/status-badge'
import GridList from '@/components/layout/grid-list'

import type { Interview } from '@/features/archive/types'

type InterviewsListProps = {
  interviews: Interview[]
  onProcess?: (interviewId: string) => void
}

export default function InterviewsList({ interviews, onProcess }: InterviewsListProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)

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

          {!interview.transcript && (
            <Button
              size="sm"
              onClick={() => handleProcess(interview.id)}
              disabled={processingId === interview.id}
              className="mt-auto"
            >
              {processingId === interview.id ? '処理中...' : '文字起こし・暗黙知抽出'}
            </Button>
          )}
        </Card>
      ))}
    </GridList>
  )
}
