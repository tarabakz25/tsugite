import { redirect } from 'next/navigation'

import AgentChat from '@/features/agent/components/agent-chat'
import Container from '@/components/ui/container'
import { createClient } from '@/lib/supabase/server'
import { ensureShopForProfile } from '@/lib/shops'

export default async function ShopAgentPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?returnTo=/shop/agent')

  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_profile')
    .eq('id', user.id)
    .maybeSingle()

  const shop = await ensureShopForProfile(supabase, user.id, profile?.shop_profile)
  if (!shop) redirect('/shop')

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <section className="border-b border-zinc-200 bg-white py-6 dark:border-zinc-800 dark:bg-zinc-950">
        <Container>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Agent - AI相談</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            蓄積された暗黙知をもとに、店舗運営の疑問にお答えします。
          </p>
        </Container>
      </section>
      <div className="flex-1 overflow-hidden">
        <Container className="h-full">
          <AgentChat shopId={shop.id} />
        </Container>
      </div>
    </div>
  )
}
