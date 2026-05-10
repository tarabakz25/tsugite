'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/card'
import Badge from '@/components/ui/badge'
import Button from '@/components/ui/button'

import type { TacitTag } from '@/features/archive/types'
import { deleteTacitTag } from '@/features/archive/actions'
import CreateGuideSceneFromTagButton from '@/features/guide/components/create-guide-scene-from-tag-button'

type TacitTagsListProps = {
  tags: TacitTag[]
}

const DELETE_TACIT_TAG_MESSAGES: Record<
  Exclude<Awaited<ReturnType<typeof deleteTacitTag>>, { ok: true }>['error'],
  string
> = {
  not_authenticated: 'ログイン情報が無効です。再度ログインしてください。',
  no_shop: '店舗情報が見つかりません。',
  not_found: 'この暗黙知タグは見つからないか、すでに削除されています。',
  db_error: '削除に失敗しました。時間をおいて再度お試しください。',
}

export default function TacitTagsList({ tags }: TacitTagsListProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [, startDeleteTransition] = useTransition()

  const handleDeleteTag = (tagId: string) => {
    const confirmed = window.confirm(
      'この暗黙知タグを削除しますか？RAG の参照対象からも除かれます。',
    )
    if (!confirmed) {
      return
    }

    startDeleteTransition(() => {
      void (async () => {
        setDeletingId(tagId)
        const result = await deleteTacitTag(tagId)
        setDeletingId(null)
        if (result.ok) {
          router.refresh()
          return
        }
        alert(DELETE_TACIT_TAG_MESSAGES[result.error])
      })()
    })
  }

  if (tags.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
        まだ暗黙知タグが抽出されていません。
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tags.map((tag) => (
        <Card key={tag.id} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">暗黙知タグ</h3>
            {tag.isInferred && <Badge tone="shu">AI抽出</Badge>}
          </div>

          <div className="space-y-2">
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">状況</p>
              <p className="text-sm text-zinc-900 dark:text-zinc-100">{tag.situation}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">判断</p>
              <p className="text-sm text-zinc-900 dark:text-zinc-100">{tag.judgment}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">理由</p>
              <p className="text-sm text-zinc-900 dark:text-zinc-100">{tag.reason}</p>
            </div>
          </div>

          <div className="mt-auto pt-2 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-2">
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              {new Date(tag.createdAt).toLocaleDateString('ja-JP')}
            </p>
            <CreateGuideSceneFromTagButton tagId={tag.id} />
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDeleteTag(tag.id)}
              disabled={deletingId === tag.id}
              isLoading={deletingId === tag.id}
            >
              削除
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
