import { Suspense } from 'react'

import LoginForm from './login-form'

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="px-4 py-16 text-center text-sm text-ink-3">読み込み中…</p>}>
      <LoginForm />
    </Suspense>
  )
}
