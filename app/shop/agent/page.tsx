import { redirect } from 'next/navigation'

import AgentChat from '@/features/agent/components/agent-chat'
import Container from '@/components/ui/container'
import { getServerAuthSession } from '@/lib/get-profile'
import { ensureShopForProfile } from '@/lib/shops'

export default async function ShopAgentPage() {
  const session = await getServerAuthSession()
  if (!session) redirect('/login?returnTo=/shop/agent')

  const { supabase, user, profile } = session
  const shop = await ensureShopForProfile(supabase, user.id, profile.shop_profile)
  if (!shop) redirect('/shop')

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
          <AgentChat shopId={shop.id} />
        </Container>
      </div>
    </div>
  )
}
