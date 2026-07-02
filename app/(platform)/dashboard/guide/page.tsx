import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GuideInterface from '@/features/guide/components/guide-interface'
import { getReferenceScenes } from '@/features/guide/actions'
import { parseUserRole } from '@/lib/roles'
import { resolveShopIdForUser } from '@/lib/shops'

export default async function DashboardGuidePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?returnTo=/dashboard/guide')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const role = parseUserRole(profile)
  if (!role) redirect('/onboarding/role')

  const shopId = await resolveShopIdForUser(supabase, user.id, profile, role)

  if (!shopId) {
    return <GuideInterface shopId="" scenes={[]} />
  }

  const scenesResult = await getReferenceScenes(shopId)
  const scenes = scenesResult.success
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase returns generic Record type
      scenesResult.data.map((scene: any) => ({
        id: scene.id,
        sceneName: scene.scene_name,
        season: scene.season,
      }))
    : []

  return <GuideInterface shopId={shopId} scenes={scenes} />
}
