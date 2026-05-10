import Link from 'next/link'
import { redirect } from 'next/navigation'

import PageContainer from '@/components/layout/page-container'
import PageHeader from '@/components/layout/page-header'
import ReferenceSceneForm from '@/features/guide/components/reference-scene-form'
import { ensureShopForProfile } from '@/lib/shops'
import { createClient } from '@/lib/supabase/server'

export default async function NewGuideScenePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?returnTo=/shop/guide/scenes/new')
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

  return (
    <PageContainer maxWidth="lg">
      <PageHeader
        description="カメラ判定で使う基準状態をJSONで登録します。"
        rightContent={
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-washi-3 bg-white px-3 text-sm font-semibold text-ink transition-colors hover:border-ink-4 hover:bg-washi focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shu"
            href="/shop/guide"
          >
            Guideへ戻る
          </Link>
        }
        title="正解シーンを作成"
      />
      <ReferenceSceneForm />
    </PageContainer>
  )
}
