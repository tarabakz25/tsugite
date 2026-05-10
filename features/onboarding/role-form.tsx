'use client'

import { useTransition } from 'react'

import Button from '@/components/ui/button'

import { setUserRole } from '@/features/onboarding/actions'
import type { UserRole } from '@/lib/roles'

export default function RoleForm({ error }: { error?: string }) {
  const [pending, startTransition] = useTransition()

  function choose(role: UserRole) {
    startTransition(async () => {
      await setUserRole(role)
    })
  }

  return (
    <div className="mx-auto grid max-w-2xl gap-4 md:grid-cols-2">
      {error === 'failed' ? (
        <p className="col-span-full text-sm text-danger md:col-span-2">
          保存に失敗しました。時間をおいて再度お試しください。
        </p>
      ) : null}
      <div className="flex flex-col gap-4 rounded-xl border border-washi-3 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">店（掲載者）</h2>
        <p className="flex-1 text-sm leading-relaxed text-ink-2">
          伝統芸能・工芸への参加募集や職場体験などを載せて、継ぎ手候補を集められます。
        </p>
        <Button disabled={pending} type="button" onClick={() => choose('shop')}>
          {pending ? '送信中…' : 'この形で進む'}
        </Button>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-washi-3 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">継ぎ手</h2>
        <p className="flex-1 text-sm leading-relaxed text-ink-2">
          全国の現場での学びや挑戦機会を探し、志とスキルを形にできます。
        </p>
        <Button
          disabled={pending}
          type="button"
          variant="secondary"
          onClick={() => choose('successor')}
        >
          {pending ? '送信中…' : 'この形で進む'}
        </Button>
      </div>
    </div>
  )
}
