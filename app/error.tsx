'use client'

import Link from 'next/link'
import { useEffect } from 'react'

type ErrorProps = {
  error: Error & { digest?: string }
}

export default function AppErrorBoundary({ error }: ErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold text-ink">問題が発生しました</h1>
      <p className="max-w-lg text-sm leading-relaxed text-ink-3">
        自動で復旧できませんでした。もう一度操作するか時間をおいて試してください。
        {error.digest ? (
          <>
            {' '}
            <span className="font-mono text-xs opacity-75">digest: {error.digest}</span>
          </>
        ) : null}
      </p>
      <Link
        href="/"
        className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink-2"
      >
        トップへ戻る
      </Link>
    </main>
  )
}
