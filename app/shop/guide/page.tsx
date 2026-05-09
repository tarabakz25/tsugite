import { redirect } from 'next/navigation'
import GuideInterface from '@/features/guide/components/guide-interface'
import { getReferenceScenes } from '@/features/guide/actions'
import AppShell from '@/components/ui/app-shell'
import Container from '@/components/ui/container'
import { getServerAuthSession } from '@/lib/get-profile'
import { ensureShopForProfile } from '@/lib/shops'

export default async function GuidePage() {
  const session = await getServerAuthSession()
  if (!session) {
    redirect('/login?returnTo=/shop/guide')
  }

  const { supabase, profile } = session

  if (!profile.role || profile.role !== 'shop') {
    redirect('/onboarding/role')
  }

  const shop = await ensureShopForProfile(supabase, profile.id, profile.shop_profile)

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
        correctState: scene.correct_state as Record<string, unknown>,
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
