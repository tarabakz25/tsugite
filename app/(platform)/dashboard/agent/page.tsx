import { redirect } from 'next/navigation'

import AgentChat from '@/features/agent/components/agent-chat'
import { createClient } from '@/lib/supabase/server'
import { ensureShopForProfile } from '@/lib/shops'
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

  if (role === 'shop') {
    const shop = await ensureShopForProfile(supabase, user.id, profile?.shop_profile)
    if (!shop) redirect('/dashboard')

    const shopId = shop.id

    return (
      <div className="flex min-h-0 flex-1 flex-col">
        {/* ヘッダー */}
        <header className="flex flex-col gap-2 border-b border-[var(--line-soft)] bg-[var(--washi)] px-6 pb-5 pt-6 md:px-8">
          <h1 className="font-serif text-2xl font-bold tracking-[0.06em] text-ink md:text-[26px]">
            Agent ─ 相談する
          </h1>
          <p className="text-[13px] leading-relaxed text-ink-3">
            蓄積された暗黙知をもとに、店舗運営の疑問にお答えします。
          </p>
        </header>
        <div className="flex min-h-0 flex-1 flex-col">
          <AgentChat shopId={shopId} />
        </div>
      </div>
    )
  }

  // successor
  const mockShopId = '00000000-0000-0000-0000-000000000001'

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-[calc(5.25rem+env(safe-area-inset-bottom))] md:pb-0">
      {/* ヘッダー */}
      <header className="flex flex-col gap-2 border-b border-[var(--line-soft)] bg-[var(--washi)] px-6 pb-5 pt-6 md:px-8">
        <h1 className="font-serif text-2xl font-bold tracking-[0.06em] text-ink md:text-[26px]">
          Agent ─ 先代に相談
        </h1>
        <p className="text-[13px] leading-relaxed text-ink-3">
          困ったことや判断に迷うことがあれば、先代の経験と知恵を参考にできます。
        </p>
      </header>
      <div className="flex min-h-0 flex-1 flex-col">
        <AgentChat shopId={mockShopId} />
      </div>
    </div>
  )
}
