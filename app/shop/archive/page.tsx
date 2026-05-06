import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import ArchiveContent from '@/features/archive/components/archive-content'
import Container from '@/components/ui/container'
import type { Interview, TacitTag } from '@/features/archive/types'
import { ensureShopForProfile } from '@/lib/shops'

export default async function ArchivePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_profile')
    .eq('id', user.id)
    .maybeSingle()

  const shop = await ensureShopForProfile(supabase, user.id, profile?.shop_profile)

  if (!shop) redirect('/shop')

  // Get interviews for this shop
  const { data: interviewsData } = await supabase
    .from('interviews')
    .select('*')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: false })

  const interviews: Interview[] = (interviewsData || []).map((row) => ({
    id: row.id,
    shopId: row.shop_id,
    storagePath: row.storage_path,
    transcript: row.transcript,
    durationSec: row.duration_sec,
    createdAt: new Date(row.created_at),
  }))

  // Get tacit tags for this shop
  const { data: tagsData } = await supabase
    .from('tacit_tags')
    .select('*')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: false })

  const tags: TacitTag[] = (tagsData || []).map((row) => ({
    id: row.id,
    shopId: row.shop_id,
    interviewId: row.interview_id,
    situation: row.situation,
    judgment: row.judgment,
    reason: row.reason,
    isInferred: row.is_inferred,
    meta: row.meta as Record<string, unknown>,
    createdAt: new Date(row.created_at),
  }))

  return (
    <>
      <section className="flex flex-col gap-6 py-10">
        <Container>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Archive - 暗黙知の蓄積
          </h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
            インタビュー動画・音声から、言語化されていない判断基準を抽出し、構造化して蓄積します。
          </p>
        </Container>
      </section>
      <ArchiveContent interviews={interviews} tags={tags} />
    </>
  )
}
