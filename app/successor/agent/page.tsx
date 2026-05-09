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

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_ids')
    .eq('id', user.id)
    .maybeSingle()

  const shopId = Array.isArray(profile?.organization_ids) ? profile.organization_ids[0] : undefined

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
          {shopId ? (
            <AgentChat shopId={shopId} />
          ) : (
            <div className="flex h-full items-center justify-center text-center">
              <div className="max-w-md rounded-lg border border-washi-3 bg-white p-6">
                <h2 className="text-lg font-semibold text-ink">接続先の店舗が未設定です</h2>
                <p className="mt-2 text-sm text-ink-3">
                  店舗との紐づきが登録されると、その店舗の暗黙知タグを参照して相談できます。
                </p>
              </div>
            </div>
          )}
        </Container>
      </div>
    </div>
  )
}
