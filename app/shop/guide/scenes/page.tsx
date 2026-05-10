import Link from 'next/link'
import { redirect } from 'next/navigation'

import PageContainer from '@/components/layout/page-container'
import PageHeader from '@/components/layout/page-header'
import AppShell from '@/components/ui/app-shell'
import ReferenceScenesManager from '@/features/guide/components/reference-scenes-manager'
import { ensureShopForProfile } from '@/lib/shops'
import { createClient } from '@/lib/supabase/server'

export default async function GuideScenesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?returnTo=/shop/guide/scenes')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, shop_profile')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'shop') {
    redirect('/onboarding/role')
  }

  const shop = await ensureShopForProfile(supabase, user.id, profile.shop_profile)
  if (!shop) {
    redirect('/onboarding/shop')
  }

  const { data: scenes } = await supabase
    .from('reference_scenes')
    .select('id, scene_name, season, source_tag_id, created_at')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: false })

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          description="Archiveから生成されたGuideシーンを確認し、不要になったシーンを削除できます。"
          rightContent={
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-washi-3 bg-white px-3 text-sm font-semibold text-ink transition-colors hover:border-ink-4 hover:bg-washi focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shu"
                href="/shop/guide"
              >
                Guideで使う
              </Link>
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-shu bg-shu px-3 text-sm font-semibold text-white transition-colors hover:bg-shu-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shu"
                href="/shop/archive"
              >
                Archiveから生成
              </Link>
            </div>
          }
          title="Guideシーン管理"
        />
        <ReferenceScenesManager
          scenes={(scenes || []).map((scene) => ({
            id: scene.id,
            sceneName: scene.scene_name,
            season: scene.season,
            sourceTagId: scene.source_tag_id,
            createdAt: scene.created_at,
          }))}
        />
      </PageContainer>
    </AppShell>
  )
}
