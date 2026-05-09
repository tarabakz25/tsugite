/** Instant loading UI for successor routes below the shared layout. */
export default function SuccessorRouteLoading() {
  return (
    <div className="animate-pulse px-6 py-10" aria-busy="true" aria-label="読み込み中">
      <div className="h-8 w-48 max-w-full rounded-md bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-3 h-4 w-80 max-w-full rounded-md bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-10 space-y-4">
        <div className="h-24 rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900" />
        <div className="h-24 rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900" />
      </div>
    </div>
  )
}
