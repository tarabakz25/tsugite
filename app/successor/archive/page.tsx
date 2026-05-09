export default function SuccessorArchivePage() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-ink-3">記録</p>
        <h1 className="text-2xl font-bold text-ink">暗黙知タグ閲覧</h1>
        <p className="mt-2 text-sm text-ink-3">
          店舗の先代が蓄積してきた判断基準・暗黙知を閲覧できます。
          相談への質問の参考にしてください。
        </p>
      </div>

      {/* TODO: query tacit_tags for shops the successor has applied to,
          once the applications <-> shop relationship is implemented. */}
      <div className="rounded-2xl border border-washi-3 bg-washi-2 p-8 text-center">
        <p className="text-sm text-ink-3">
          応募中の店舗の暗黙知タグはここに表示されます（近日公開予定）。
        </p>
      </div>
    </div>
  )
}
