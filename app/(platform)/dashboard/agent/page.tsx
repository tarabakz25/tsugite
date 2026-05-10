import { redirect } from 'next/navigation'

import AgentChat from '@/features/agent/components/agent-chat'
import PageContainer from '@/components/layout/page-container'
import PageHeader from '@/components/layout/page-header'
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

  const header =
    role === 'shop'
      ? {
          title: 'Agent — AI相談',
          description: '蓄積された暗黙知をもとに、店舗運営の疑問にお答えします。',
        }
      : {
          title: 'Agent — 先代に相談',
          description: '困ったことや判断に迷うことがあれば、先代の経験と知恵を参考にできます。',
        }

  if (role === 'shop') {
    const shop = await ensureShopForProfile(supabase, user.id, profile?.shop_profile)
    if (!shop) redirect('/dashboard')

    const shopId = shop.id

    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageContainer maxWidth="7xl" className="shrink-0 pb-4 pt-2 sm:pt-4">
          <PageHeader title={header.title} description={header.description} />
        </PageContainer>
        <div className="flex min-h-0 flex-1 flex-col border-t border-washi-3">
          <AgentChat shopId={shopId} />
        </div>
      </div>
    )
  }

  // successor
  // TODO: resolve the shop linked to this successor once the
  //       applications <-> shop relationship is implemented.
  const mockShopId = '00000000-0000-0000-0000-000000000001'

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-[calc(5.25rem+env(safe-area-inset-bottom))] md:pb-0">
      <PageContainer maxWidth="7xl" className="shrink-0 pb-4 pt-2 sm:pt-4">
        <PageHeader title={header.title} description={header.description} />
      </PageContainer>
      <div className="flex min-h-0 flex-1 flex-col border-t border-washi-3">
        <AgentChat shopId={mockShopId} />
      </div>
    </div>
  )
}
