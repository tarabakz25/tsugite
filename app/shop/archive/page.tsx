import { redirect } from 'next/navigation'

import ArchiveContent from '@/features/archive/components/archive-content'
import type { Interview, TacitTag } from '@/features/archive/types'
import { getServerAuthSession } from '@/lib/get-profile'
import { ensureShopForProfile } from '@/lib/shops'

export default async function ArchivePage() {
  const session = await getServerAuthSession()
  if (!session) redirect('/login')

  const { supabase, user, profile } = session
  const shop = await ensureShopForProfile(supabase, user.id, profile.shop_profile)

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

  return <ArchiveContent interviews={interviews} tags={tags} />
}
