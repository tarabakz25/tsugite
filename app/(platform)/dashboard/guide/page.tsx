import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GuideInterface from '@/features/guide/components/guide-interface'
import { getReferenceScenes } from '@/features/guide/actions'
import { parseUserRole } from '@/lib/roles'

export default async function DashboardGuidePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?returnTo=/dashboard/guide')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const role = parseUserRole(profile)

  // Guide is successor-only
  if (role !== 'successor') redirect('/shop')

  // TODO: resolve the shop linked to this successor once the
  //       applications <-> shop relationship is implemented.
  //       Using a mock shop ID for MVP.
  const mockShopId = '00000000-0000-0000-0000-000000000001'

  const scenesResult = await getReferenceScenes(mockShopId)
  const scenes = scenesResult.success
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase returns generic Record type
      scenesResult.data.map((scene: any) => ({
        id: scene.id,
        sceneName: scene.scene_name,
        season: scene.season,
      }))
    : []

  return <GuideInterface shopId={mockShopId} scenes={scenes} />
}
