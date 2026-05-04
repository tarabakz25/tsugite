'use client'

import { useState } from 'react'
import Card from '@/components/ui/card'
import Button from '@/components/ui/button'
import StatusBadge from '@/components/ui/status-badge'

import type { Interview } from '@/features/archive/types'

type InterviewsListProps = {
  interviews: Interview[]
  onProcess?: (interviewId: string) => void
}

export default function InterviewsList({ interviews, onProcess }: InterviewsListProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)

  const handleProcess = async (interviewId: string) => {
    setProcessingId(interviewId)
    if (onProcess) {
      await onProcess(interviewId)
    }
    setProcessingId(null)
  }

  if (interviews.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
        まだインタビュー動画がアップロードされていません。
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {interviews.map((interview) => (
        <Card key={interview.id} className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                インタビュー #{interview.id.slice(0, 8)}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                アップロード日時: {new Date(interview.createdAt).toLocaleString('ja-JP')}
              </p>
              {interview.durationSec && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  長さ: {Math.floor(interview.durationSec / 60)}分{interview.durationSec % 60}秒
                </p>
              )}
            </div>
            <StatusBadge status={interview.transcript ? 'success' : 'warning'}>
              {interview.transcript ? '処理済み' : '未処理'}
            </StatusBadge>
          </div>

          {interview.transcript && (
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                文字起こし
              </p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 line-clamp-3">
                {interview.transcript}
              </p>
            </div>
          )}

          {!interview.transcript && (
            <Button
              size="sm"
              onClick={() => handleProcess(interview.id)}
              disabled={processingId === interview.id}
            >
              {processingId === interview.id ? '処理中...' : '文字起こし・暗黙知抽出'}
            </Button>
          )}
        </Card>
      ))}
    </div>
  )
}
