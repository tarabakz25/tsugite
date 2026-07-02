import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import ArchiveContent from '@/features/archive/components/archive-content'
import type { Interview, TacitTag } from '@/features/archive/types'
import { resolveShopIdForUser } from '@/lib/shops'
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
  if (!role) redirect('/onboarding/role')

  const shopId = await resolveShopIdForUser(supabase, user.id, profile, role)

  const title = role === 'shop' ? 'Archive ─ 蓄える' : 'Archive ─ 暗黙知の閲覧'
  const description =
    role === 'shop'
      ? '先代の経験を記録し、AIが暗黙知を抽出していきます。'
      : '店舗の先代が蓄積した判断基準・暗黙知を閲覧できます。'

  if (!shopId) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-auto">
        <header className="flex flex-col gap-2 border-b border-[var(--line-soft)] bg-[var(--washi)] px-6 pb-5 pt-6 md:px-8">
          <h1 className="font-serif text-2xl font-bold tracking-[0.06em] text-ink md:text-[26px]">
            {title}
          </h1>
          <p className="text-[13px] leading-relaxed text-ink-3">{description}</p>
        </header>
        <div className="mx-auto w-full max-w-[1320px] px-6 py-7 md:px-8">
          <div className="rounded-2xl border border-washi-3 bg-washi-2 p-8 text-center">
            <p className="text-sm text-ink-3">
              紐づけされた店舗がありません。店舗オーナーに招待を依頼してください。
            </p>
          </div>
        </div>
      </div>
    )
  }

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

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <header className="flex flex-col gap-2 border-b border-[var(--line-soft)] bg-[var(--washi)] px-6 pb-5 pt-6 md:px-8">
        <h1 className="font-serif text-2xl font-bold tracking-[0.06em] text-ink md:text-[26px]">
          {title}
        </h1>
        <p className="text-[13px] leading-relaxed text-ink-3">{description}</p>
      </header>
      <ArchiveContent interviews={interviews} tags={tags} />
    </div>
  )
}
