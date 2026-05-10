import Link from 'next/link'

export default function NotFoundPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <div className="text-sm font-semibold uppercase tracking-[0.2em] text-ink-4">404</div>
      <h1 className="text-2xl font-semibold text-ink">ページが見つかりません</h1>
      <p className="max-w-md text-sm leading-relaxed text-ink-3">
        URL
        が変更されたか、このページがまだ公開されていません。トップまたは募集一覧からたどってください。
      </p>
      <div className="flex gap-4 text-sm font-medium">
        <Link href="/" className="text-ink underline underline-offset-4 hover:text-ink-2">
          トップへ
        </Link>
        <Link
          href="/opportunities"
          className="text-ink underline underline-offset-4 hover:text-ink-2"
        >
          募集一覧
        </Link>
      </div>
    </main>
  )
}
