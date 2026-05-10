import { redirect } from 'next/navigation'

import Container from '@/components/ui/container'
import { getCurrentProfile } from '@/lib/get-profile'
import { parseUserRole } from '@/lib/roles'

export default async function ShopHomePage() {
  const profile = await getCurrentProfile()
  const role = parseUserRole(profile)
  if (role !== 'shop') redirect('/successor')

  return (
    <section className="flex flex-col gap-10 py-10">
      <Container>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">店ダッシュボード</h1>
        <p className="mt-2 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
          ひとまず KPI はダミー表示です。API と DB を載せたら掲載数・応募数・返信 SLA
          を並べられます。
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ['掲載中の募集（モック）', '12'],
            ['今月の応募（モック）', '38'],
            ['未読メッセージ（モック）', '5'],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {label}
              </div>
              <div className="mt-2 text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {value}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
