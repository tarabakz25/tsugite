'use client'

import { useActionState } from 'react'

import Button from '@/components/ui/button'

import {
  type SuccessorProfileState,
  saveSuccessorProfile,
} from '@/features/register/successor-actions'

type SuccessorProfileFormProps = {
  defaultDisplayName?: string
  defaultInterests?: string
  defaultBio?: string
}

function errorMessage(code: SuccessorProfileState['error']): string | null {
  switch (code) {
    case 'required':
      return '表示名は必須です。'
    case 'too_long':
      return '入力が長すぎます。'
    case 'role_mismatch':
      return '継ぎ手としてログインされていません。'
    default:
      return null
  }
}

export default function SuccessorProfileForm({
  defaultDisplayName = '',
  defaultInterests = '',
  defaultBio = '',
}: SuccessorProfileFormProps) {
  const [state, formAction] = useActionState(saveSuccessorProfile, {})

  const msg = errorMessage(state.error)

  return (
    <form
      action={formAction}
      className="mx-auto flex max-w-xl flex-col gap-5 rounded-xl border border-washi-3 bg-white p-8 shadow-sm"
    >
      {msg ? (
        <p className="text-sm text-danger" role="alert">
          {msg}
        </p>
      ) : null}
      <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
        表示名
        <input
          name="displayName"
          required
          defaultValue={defaultDisplayName}
          className="rounded-lg border border-washi-3 bg-white px-3 py-2 font-normal text-ink outline-none ring-washi-3 transition-colors focus:border-shu focus:ring-2"
          placeholder="名前または活動名"
          autoComplete="nickname"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
        興味のあるジャンル
        <input
          name="interests"
          defaultValue={defaultInterests}
          className="rounded-lg border border-washi-3 bg-white px-3 py-2 font-normal text-ink outline-none ring-washi-3 transition-colors focus:border-shu focus:ring-2"
          placeholder="例: 木工、織・染、鍛錬など"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
        自己紹介
        <textarea
          name="bio"
          defaultValue={defaultBio}
          rows={6}
          className="rounded-lg border border-washi-3 bg-white px-3 py-2 font-normal text-ink outline-none ring-washi-3 transition-colors focus:border-shu focus:ring-2"
          placeholder="学びたいこと、現在の経験など"
        />
      </label>
      <Button type="submit">保存してダッシュボードへ</Button>
      <p className="text-xs text-ink-3">
        プロフィールは Supabase の <code className="text-xs">profiles</code>{' '}
        テーブルに保存されます（開発用）。
      </p>
    </form>
  )
}
