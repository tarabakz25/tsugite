import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GuideInterface from '@/features/guide/components/guide-interface'
import { getReferenceScenes, getTacitGuideTags } from '@/features/guide/actions'
import type { GuideTacitTag } from '@/features/guide/types'
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

  // Get Guide sources
  const tagsResult = await getTacitGuideTags(shop.id)
  const tags: GuideTacitTag[] = tagsResult.success
    ? tagsResult.data.map((tag) => ({
        id: tag.id,
        situation: tag.situation,
        judgment: tag.judgment,
        reason: tag.reason,
        isInferred: tag.is_inferred,
        createdAt: tag.created_at,
      }))
    : []
  const tagsById = new Map(tags.map((tag) => [tag.id, tag]))

  const scenesResult = await getReferenceScenes(shop.id)
  const scenes = scenesResult.success
    ? scenesResult.data.map((scene) => ({
        id: scene.id,
        sceneName: scene.scene_name,
        correctState: scene.correct_state,
        season: scene.season,
        sourceTagId: scene.source_tag_id,
        sourceTag: scene.source_tag_id ? (tagsById.get(scene.source_tag_id) ?? null) : null,
      }))
    : []

  return (
    <AppShell>
      <Container className="py-8">
        <GuideInterface shopId={shop.id} scenes={scenes} tags={tags} />
      </Container>
    </AppShell>
  )
}
