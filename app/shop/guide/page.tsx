import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GuideInterface from '@/features/guide/components/guide-interface'
import { getReferenceScenes } from '@/features/guide/actions'
import AppShell from '@/components/ui/app-shell'
import Container from '@/components/ui/container'
import { ensureShopForProfile } from '@/lib/shops'

export default async function GuidePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?returnTo=/shop/guide')
  }

  // Get user's profile to find shop
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  if (!profile || profile.role !== 'shop') {
    redirect('/onboarding/role')
  }

  const shop = await ensureShopForProfile(supabase, user.id, profile.shop_profile)

  if (!shop) {
    redirect('/onboarding/shop')
  }

  // Get reference scenes
  const scenesResult = await getReferenceScenes(shop.id)
  const scenes = scenesResult.success
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase returns generic Record type
      scenesResult.data.map((scene: any) => ({
        id: scene.id,
        sceneName: scene.scene_name,
        season: scene.season,
      }))
    : []

  return (
    <AppShell>
      <Container className="py-8">
        <GuideInterface shopId={shop.id} scenes={scenes} />
      </Container>
    </AppShell>
  )
}
