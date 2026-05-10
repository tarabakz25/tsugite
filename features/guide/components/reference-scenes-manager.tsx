'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import Badge from '@/components/ui/badge'
import Button from '@/components/ui/button'
import Card from '@/components/ui/card'
import { deleteReferenceScene, type DeleteReferenceSceneResult } from '@/features/guide/actions'

type ReferenceSceneSummary = {
  id: string
  sceneName: string
  season: string | null
  sourceTagId: string | null
  createdAt: string
}

type ReferenceScenesManagerProps = {
  scenes: ReferenceSceneSummary[]
}

const DELETE_REFERENCE_SCENE_MESSAGES: Record<
  Exclude<DeleteReferenceSceneResult, { ok: true }>['error'],
  string
> = {
  not_authenticated: 'ログイン情報が無効です。再度ログインしてください。',
  role_mismatch: '店ユーザーとしてログインしてください。',
  no_shop: '店舗情報を確認できませんでした。',
  not_found: 'このGuideシーンは見つからないか、すでに削除されています。',
  db_error: 'Guideシーンの削除に失敗しました。時間をおいて再度お試しください。',
}

export default function ReferenceScenesManager({ scenes }: ReferenceScenesManagerProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [, startDeleteTransition] = useTransition()

  const handleDelete = (scene: ReferenceSceneSummary) => {
    const confirmed = window.confirm(
      `Guideシーン「${scene.sceneName}」を削除しますか？\n過去の観察ログは残りますが、このシーンはGuideで選択できなくなります。`,
    )

    if (!confirmed) return

    startDeleteTransition(() => {
      void (async () => {
        setDeletingId(scene.id)
        const result = await deleteReferenceScene(scene.id)
        setDeletingId(null)

        if (result.ok) {
          router.refresh()
          return
        }

        alert(DELETE_REFERENCE_SCENE_MESSAGES[result.error])
      })()
    })
  }

  if (scenes.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="mx-auto max-w-xl space-y-5">
          <div>
            <h2 className="text-lg font-bold text-ink">Guideシーンがありません</h2>
            <p className="mt-2 text-sm leading-6 text-ink-3">
              Archiveの暗黙知タグからGuideシーンを生成してください。生成したシーンはここで削除できます。
            </p>
          </div>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-shu bg-shu px-4 text-sm font-semibold text-white transition-colors hover:bg-shu-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shu"
              href="/shop/archive"
            >
              Archiveから生成
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-washi-3 bg-white px-4 text-sm font-semibold text-ink transition-colors hover:border-ink-4 hover:bg-washi focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shu"
              href="/shop/guide"
            >
              Guideで使う
            </Link>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {scenes.map((scene) => (
        <Card className="flex flex-col gap-4 p-5" key={scene.id}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-ink">{scene.sceneName}</h2>
              <p className="mt-1 text-xs text-ink-4">
                {new Date(scene.createdAt).toLocaleDateString('ja-JP')}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              {scene.season ? <Badge tone="neutral">{scene.season}</Badge> : null}
              {scene.sourceTagId ? (
                <Badge tone="shu">Archive由来</Badge>
              ) : (
                <Badge tone="neutral">手入力</Badge>
              )}
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-2 border-t border-washi-3 pt-4 sm:flex-row sm:justify-end">
            <Button
              disabled={deletingId === scene.id}
              isLoading={deletingId === scene.id}
              onClick={() => handleDelete(scene)}
              size="sm"
              variant="danger"
            >
              削除
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
