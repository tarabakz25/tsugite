import { redirect } from 'next/navigation'

import AgentChat from '@/features/agent/components/agent-chat'
import Container from '@/components/ui/container'
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

  if (role === 'shop') {
    const shop = await ensureShopForProfile(supabase, user.id, profile?.shop_profile)
    if (!shop) redirect('/dashboard')
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- redirect() above guarantees non-null
    const shopId = shop!.id

    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col">
        <div className="border-b border-ink/10 bg-washi p-4">
          <Container>
            <h1 className="text-2xl font-bold text-ink">Agent - AI相談</h1>
            <p className="mt-1 text-sm text-ink/60">
              蓄積された暗黙知をもとに、店舗運営の疑問にお答えします。
            </p>
          </Container>
        </div>
        <div className="flex-1 overflow-hidden">
          <Container className="h-full">
            <AgentChat shopId={shopId} />
          </Container>
        </div>
      </div>
    )
  }

  // successor
  // TODO: resolve the shop linked to this successor once the
  //       applications <-> shop relationship is implemented.
  const mockShopId = '00000000-0000-0000-0000-000000000001'

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="border-b border-ink/10 bg-washi p-4">
        <Container>
          <h1 className="text-2xl font-bold text-ink">先代女将に相談</h1>
          <p className="mt-1 text-sm text-ink/60">
            困ったことや判断に迷うことがあれば、先代の経験と知恵を参考にできます。
          </p>
        </Container>
      </div>
      <div className="flex-1 overflow-hidden">
        <Container className="h-full">
          <AgentChat shopId={mockShopId} />
        </Container>
      </div>
    </div>
  )
}
