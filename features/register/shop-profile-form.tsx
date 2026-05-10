'use client'

import { useActionState } from 'react'

import Button from '@/components/ui/button'

import { type ShopProfileState, saveShopProfile } from '@/features/register/shop-actions'

type ShopProfileFormProps = {
  defaultDisplayName?: string
  defaultRegion?: string
  defaultDescription?: string
}

function errorMessage(code: ShopProfileState['error']): string | null {
  switch (code) {
    case 'required':
      return '表示名と地域は必須です。'
    case 'too_long':
      return '入力が長すぎます。'
    case 'role_mismatch':
      return '店としてログインされていません。'
    default:
      return null
  }
}

export default function ShopProfileForm({
  defaultDisplayName = '',
  defaultRegion = '',
  defaultDescription = '',
}: ShopProfileFormProps) {
  const [state, formAction] = useActionState(saveShopProfile, {})

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
          placeholder="工房・店の名称"
          autoComplete="organization"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
        主な所在地（都道府県など）
        <input
          name="region"
          required
          defaultValue={defaultRegion}
          className="rounded-lg border border-washi-3 bg-white px-3 py-2 font-normal text-ink outline-none ring-washi-3 transition-colors focus:border-shu focus:ring-2"
          placeholder="例: 京都府"
          autoComplete="address-level1"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
        紹介文
        <textarea
          name="description"
          defaultValue={defaultDescription}
          rows={6}
          className="rounded-lg border border-washi-3 bg-white px-3 py-2 font-normal text-ink outline-none ring-washi-3 transition-colors focus:border-shu focus:ring-2"
          placeholder="事業概要、募集の雰囲気、伝えたい価値観など"
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
