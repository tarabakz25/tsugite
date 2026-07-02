import { redirect } from 'next/navigation'

import AgentChat from '@/features/agent/components/agent-chat'
import { createClient } from '@/lib/supabase/server'
import { resolveShopIdForUser } from '@/lib/shops'
import { parseUserRole } from '@/lib/roles'

export default async function DashboardAgentPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?returnTo=/dashboard/agent')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  const role = parseUserRole(profile)
  if (!role) redirect('/onboarding/role')

  const shopId = await resolveShopIdForUser(supabase, user.id, profile, role)

  const title = role === 'shop' ? 'Agent ─ 相談する' : 'Agent ─ 先代に相談'
  const description =
    role === 'shop'
      ? '蓄積された暗黙知をもとに、店舗運営の疑問にお答えします。'
      : '困ったことや判断に迷うことがあれば、先代の経験と知恵を参考にできます。'

  if (!shopId) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="flex flex-col gap-2 border-b border-[var(--line-soft)] bg-[var(--washi)] px-6 pb-5 pt-6 md:px-8">
          <h1 className="font-serif text-2xl font-bold tracking-[0.06em] text-ink md:text-[26px]">
            {title}
          </h1>
          <p className="text-[13px] leading-relaxed text-ink-3">{description}</p>
        </header>
        <div className="mx-auto w-full max-w-[1320px] px-6 py-7 md:px-8">
          <div className="rounded-2xl border border-washi-3 bg-washi-2 p-8 text-center">
            <p className="text-sm text-ink-3">
              紐づけされた店舗がありません。店舗オーナーに招待を依頼してください。
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-[calc(5.25rem+env(safe-area-inset-bottom))] md:pb-0">
      <header className="flex flex-col gap-2 border-b border-[var(--line-soft)] bg-[var(--washi)] px-6 pb-5 pt-6 md:px-8">
        <h1 className="font-serif text-2xl font-bold tracking-[0.06em] text-ink md:text-[26px]">
          {title}
        </h1>
        <p className="text-[13px] leading-relaxed text-ink-3">{description}</p>
      </header>
      <div className="flex min-h-0 flex-1 flex-col">
        <AgentChat shopId={shopId} />
      </div>
    </div>
  )
}
