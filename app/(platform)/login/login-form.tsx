'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

import Button from '@/components/ui/button'
import { sanitizeReturnTo } from '@/lib/sanitize-return-to'
import { createClient } from '@/lib/supabase/client'

const errorMessages: Record<string, string> = {
  auth_state: '認証の状態が無効です。もう一度お試しください。',
  google_auth: 'Google ログインに失敗しました。',
  auth_callback: 'ログインの完了処理に失敗しました。',
}

export default function LoginForm() {
  const searchParams = useSearchParams()
  const [pending, setPending] = useState(false)
  const [oauthError, setOauthError] = useState<string | null>(null)

  const errorKey = searchParams.get('error')
  const queryErrorMessage = errorKey
    ? (errorMessages[errorKey] ?? 'ログインに問題が発生しました。')
    : null

  async function signInWithGoogle() {
    setOauthError(null)
    setPending(true)
    try {
      const supabase = createClient()
      const returnPath = sanitizeReturnTo(searchParams.get('returnTo') ?? searchParams.get('next'))
      const callbackUrl = new URL(`${window.location.origin}/auth/callback`)
      if (returnPath !== '/') {
        callbackUrl.searchParams.set('next', returnPath)
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: callbackUrl.toString() },
      })

      if (error) {
        setOauthError(error.message)
      }
    } catch {
      setOauthError('ログインを開始できませんでした。')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-semibold text-ink">ログイン</h1>
        <p className="mt-2 text-sm text-ink-3">Google アカウントで続行します。</p>
      </div>
      {queryErrorMessage ? (
        <p
          className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
          role="alert"
        >
          {queryErrorMessage}
        </p>
      ) : null}
      {oauthError ? (
        <p
          className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
          role="alert"
        >
          {oauthError}
        </p>
      ) : null}
      <Button
        className="w-full"
        disabled={pending}
        isLoading={pending}
        onClick={() => void signInWithGoogle()}
        type="button"
        variant="primary"
      >
        Google でログイン
      </Button>
    </div>
  )
}
