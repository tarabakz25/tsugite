'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import Button from '@/components/ui/button'
import Card from '@/components/ui/card'
import Input from '@/components/ui/input'
import Textarea from '@/components/ui/textarea'
import { createReferenceScene, type CreateReferenceSceneState } from '@/features/guide/actions'

const DEFAULT_CORRECT_STATE = `{
  "湯呑": 2,
  "茶托": 2,
  "急須": 1,
  "茶葉": 1,
  "お盆": 1
}`

function errorMessage(code: CreateReferenceSceneState['error']): string | null {
  switch (code) {
    case 'required':
      return 'シーン名と正しい状態JSONは必須です。'
    case 'too_long':
      return '入力が長すぎます。シーン名、季節、JSONを短くしてください。'
    case 'invalid_json':
      return '正しい状態JSONの形式が不正です。ダブルクォートを使ったJSONで入力してください。'
    case 'invalid_state':
      return '正しい状態JSONは空でないオブジェクトにしてください。'
    case 'role_mismatch':
      return '店ユーザーとしてログインしてください。'
    case 'no_shop':
      return '店舗情報を確認できませんでした。先に店舗プロフィールを設定してください。'
    case 'db_error':
      return '正解シーンの保存に失敗しました。時間をおいて再度お試しください。'
    default:
      return null
  }
}

export default function ReferenceSceneForm() {
  const [state, formAction, isPending] = useActionState(createReferenceScene, {})
  const message = errorMessage(state.error)

  return (
    <Card className="p-6">
      <form action={formAction} className="grid gap-5">
        {message ? (
          <p
            className="rounded-md border border-danger/25 bg-danger-bg px-3 py-2 text-sm text-danger"
            role="alert"
          >
            {message}
          </p>
        ) : null}

        <Input
          autoComplete="off"
          label="シーン名"
          name="sceneName"
          placeholder="例: 客室のお茶出し準備"
          required
        />

        <Input
          autoComplete="off"
          helperText="任意。季節や時期で正解状態が変わる場合に入力します。"
          label="季節"
          name="season"
          placeholder="例: 5月"
        />

        <Textarea
          className="min-h-56 font-mono text-sm leading-6"
          defaultValue={DEFAULT_CORRECT_STATE}
          helperText='例: { "湯呑": 2, "茶托": 2 }'
          label="正しい状態 JSON"
          name="correctState"
          required
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-washi-3 bg-white px-4 text-sm font-semibold text-ink transition-colors hover:border-ink-4 hover:bg-washi focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shu"
            href="/shop/guide"
          >
            戻る
          </Link>
          <Button isLoading={isPending} type="submit">
            保存してGuideへ
          </Button>
        </div>
      </form>
    </Card>
  )
}
