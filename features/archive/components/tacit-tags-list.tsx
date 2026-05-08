'use client'

import { useState } from 'react'
import Card from '@/components/ui/card'
import Badge from '@/components/ui/badge'
import Button from '@/components/ui/button'

import type { TacitTag } from '@/features/archive/types'

type TacitTagsListProps = {
  tags: TacitTag[]
  onDelete?: (tagId: string) => Promise<void>
}

export default function TacitTagsList({ tags, onDelete }: TacitTagsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const handleDeleteClick = (tagId: string) => {
    setConfirmId(tagId)
  }

  const handleConfirm = async (tagId: string) => {
    setConfirmId(null)
    setDeletingId(tagId)
    try {
      if (onDelete) {
        await onDelete(tagId)
      }
    } finally {
      setDeletingId(null)
    }
  }

  const handleCancel = () => {
    setConfirmId(null)
  }

  if (tags.length === 0) {
    return <div className="py-8 text-center text-ink/50">まだ暗黙知タグが抽出されていません。</div>
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tags.map((tag) => (
        <Card key={tag.id} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">暗黙知タグ</h3>
            {tag.isInferred && <Badge tone="shu">AI抽出</Badge>}
          </div>

          <div className="space-y-2">
            <div>
              <p className="text-xs font-medium text-ink/50">状況</p>
              <p className="text-sm text-ink">{tag.situation}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-ink/50">判断</p>
              <p className="text-sm text-ink">{tag.judgment}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-ink/50">理由</p>
              <p className="text-sm text-ink">{tag.reason}</p>
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-washi-3 pt-2">
            <p className="text-xs text-ink/40">
              {new Date(tag.createdAt).toLocaleDateString('ja-JP')}
            </p>

            {onDelete && (
              <div className="flex items-center gap-2">
                {confirmId === tag.id ? (
                  <>
                    <span className="text-xs text-ink/60">本当に削除しますか？</span>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleConfirm(tag.id)}
                      disabled={deletingId === tag.id}
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
                    onClick={() => handleDeleteClick(tag.id)}
                    disabled={deletingId === tag.id}
                  >
                    {deletingId === tag.id ? '削除中...' : '削除'}
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
