import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import ArchiveContent from '@/features/archive/components/archive-content'
import type { Interview, TacitTag } from '@/features/archive/types'
import { ensureShopForProfile } from '@/lib/shops'
import { parseUserRole } from '@/lib/roles'

export default async function DashboardArchivePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  const role = parseUserRole(profile)

  if (role === 'shop') {
    const shop = await ensureShopForProfile(supabase, user.id, profile?.shop_profile)
    if (!shop) redirect('/dashboard')
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- redirect() above guarantees non-null
    const shopId = shop!.id

    const { data: interviewsData } = await supabase
      .from('interviews')
      .select('*')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })

    const interviews: Interview[] = (interviewsData || []).map((row) => ({
      id: row.id,
      shopId: row.shop_id,
      storagePath: row.storage_path,
      transcript: row.transcript,
      durationSec: row.duration_sec,
      createdAt: new Date(row.created_at),
    }))

    const { data: tagsData } = await supabase
      .from('tacit_tags')
      .select('*')
      .eq('shop_id', shopId)
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

  // successor
  return (
    <div className="space-y-8 p-6">
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-ink-3">Archive</p>
        <h1 className="text-2xl font-bold text-ink">暗黙知タグ閲覧</h1>
        <p className="mt-2 text-sm text-ink-3">
          店舗の先代が蓄積してきた判断基準・暗黙知を閲覧できます。Agent
          への質問の参考にしてください。
        </p>
      </div>

      {/* TODO: query tacit_tags for shops the successor has applied to,
          once the applications <-> shop relationship is implemented. */}
      <div className="rounded-2xl border border-washi-3 bg-washi-2 p-8 text-center">
        <p className="text-sm text-ink-3">
          応募中の店舗の暗黙知タグはここに表示されます（近日公開予定）。
        </p>
      </div>
    </div>
  )
}
