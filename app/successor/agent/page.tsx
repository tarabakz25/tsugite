import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AgentChat from '@/features/agent/components/agent-chat'
import Container from '@/components/ui/container'

export default async function AgentPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?returnTo=/successor/agent')
  }

  // Get user's profile to find their shop association
  const { data: _profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  // For MVP, we'll use a mock shop ID since successor-shop relationship isn't fully implemented
  // In production, this would come from the successor's profile or organization
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
