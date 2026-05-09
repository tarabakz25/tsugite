/** Instant loading UI for shop routes below the shared layout (sidebar stays visible). */
export default function ShopRouteLoading() {
  return (
    <div className="animate-pulse px-6 py-10" aria-busy="true" aria-label="読み込み中">
      <div className="h-8 w-48 max-w-full rounded-md bg-washi-3" />
      <div className="mt-3 h-4 w-96 max-w-full rounded-md bg-washi-3" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-36 rounded-xl border border-washi-3 bg-washi-2" />
        <div className="h-36 rounded-xl border border-washi-3 bg-washi-2" />
        <div className="hidden h-36 rounded-xl border border-washi-3 bg-washi-2 lg:block" />
      </div>
    </div>
  )
}
