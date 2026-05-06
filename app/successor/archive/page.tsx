import Container from '@/components/ui/container'

export default function SuccessorArchivePage() {
  return (
    <section className="flex flex-col gap-10 py-10">
      <Container>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">暗黙知タグ閲覧</h1>
        <p className="mt-2 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
          店舗の先代が蓄積してきた判断基準・暗黙知を閲覧できます。Agent
          への質問の参考にしてください。
        </p>

        {/* TODO: query tacit_tags for shops the successor has applied to,
            once the applications <-> shop relationship is implemented. */}
        <div className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            応募中の店舗の暗黙知タグはここに表示されます（近日公開予定）。
          </p>
        </div>
      </Container>
    </section>
  )
}
