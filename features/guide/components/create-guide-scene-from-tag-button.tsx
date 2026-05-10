'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import Button from '@/components/ui/button'
import {
  createReferenceSceneFromTag,
  type CreateReferenceSceneFromTagResult,
} from '@/features/guide/actions'

type CreateGuideSceneFromTagButtonProps = {
  tagId: string
}

const ERROR_MESSAGES: Record<
  Exclude<CreateReferenceSceneFromTagResult, { ok: true }>['error'],
  string
> = {
  not_authenticated: 'ログイン情報が無効です。再度ログインしてください。',
  role_mismatch: '店ユーザーとしてログインしてください。',
  no_shop: '店舗情報を確認できませんでした。',
  not_found: 'この暗黙知タグは見つからないか、利用できません。',
  ai_not_configured: 'OpenAI APIキーが設定されていないため、Guideシーンを生成できません。',
  invalid_generation: 'Guideシーンの生成結果を確認できませんでした。タグの内容を見直してください。',
  db_error: 'Guideシーンの保存に失敗しました。時間をおいて再度お試しください。',
}

export default function CreateGuideSceneFromTagButton({
  tagId,
}: CreateGuideSceneFromTagButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleCreate = () => {
    startTransition(() => {
      void (async () => {
        const result = await createReferenceSceneFromTag(tagId)
        if (result.ok) {
          router.push('/shop/guide')
          router.refresh()
          return
        }

        alert(ERROR_MESSAGES[result.error])
      })()
    })
  }

  return (
    <Button isLoading={isPending} onClick={handleCreate} size="sm" variant="outline">
      Guideで使う
    </Button>
  )
}
