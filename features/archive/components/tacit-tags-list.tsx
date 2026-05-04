'use client'

import Card from '@/components/ui/card'
import Badge from '@/components/ui/badge'

import type { TacitTag } from '@/features/archive/types'

type TacitTagsListProps = {
  tags: TacitTag[]
}

export default function TacitTagsList({ tags }: TacitTagsListProps) {
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
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              暗黙知タグ
            </h3>
            {tag.isInferred && (
              <Badge variant="secondary" size="sm">
                AI抽出
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                状況
              </p>
              <p className="text-sm text-zinc-900 dark:text-zinc-100">{tag.situation}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                判断
              </p>
              <p className="text-sm text-zinc-900 dark:text-zinc-100">{tag.judgment}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                理由
              </p>
              <p className="text-sm text-zinc-900 dark:text-zinc-100">{tag.reason}</p>
            </div>
          </div>

          <div className="mt-auto pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              {new Date(tag.createdAt).toLocaleDateString('ja-JP')}
            </p>
          </div>
        </Card>
      ))}
    </div>
  )
}
