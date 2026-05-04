import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import ArchiveContent from '@/features/archive/components/archive-content'
import type { Interview, TacitTag } from '@/features/archive/types'

export default async function ArchivePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get shop for this user
  const { data: shop } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_profile_id', user.id)
    .maybeSingle()

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
