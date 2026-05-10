import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { ensureShopForProfile } from '@/lib/shops'
import { isAudioStoragePath } from '@/features/archive/utils/media'
import type { TacitTag } from '@/features/archive/types'
import { parseUserRole } from '@/lib/roles'
import TranscribeButton from './_components/transcribe-button'

export default async function DashboardArchiveDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
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

  // Archive detail is shop-only; successors see the stub list page
  if (role !== 'shop') redirect('/dashboard/archive')

  const shop = await ensureShopForProfile(supabase, user.id, profile?.shop_profile)
  if (!shop) redirect('/dashboard')
   
  const shopId = shop!.id

  const { data: interview } = await supabase
    .from('interviews')
    .select('*')
    .eq('id', id)
    .eq('shop_id', shopId)
    .maybeSingle()

  if (!interview) notFound()

  const { data: tagsData } = await supabase
    .from('tacit_tags')
    .select('*')
    .eq('interview_id', id)
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

  const { data: signedData } = await supabase.storage
    .from('interview-videos')
    .createSignedUrl(interview.storage_path, 60 * 10)
  const mediaUrl = signedData?.signedUrl ?? null
  const isAudio = isAudioStoragePath(interview.storage_path)

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-shu">Archive</p>
          <h1 className="text-2xl font-bold text-ink">インタビュー #{id.slice(0, 8)}</h1>
          <p className="mt-1 text-sm text-ink-3">
            {new Date(interview.created_at).toLocaleString('ja-JP')}
          </p>
        </div>
        <Link
          href="/dashboard/archive"
          className="text-sm text-ink-3 underline underline-offset-4 hover:text-ink"
        >
          ← 一覧に戻る
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Media player */}
        <div className="overflow-hidden rounded-2xl bg-ink">
          {mediaUrl && isAudio ? (
            <div className="aspect-video bg-[radial-gradient(circle_at_50%_42%,rgba(240,216,208,0.24),transparent_28%),linear-gradient(135deg,#142028,#2b4351)] p-6">
              <div className="flex h-full flex-col justify-between rounded-2xl border border-white/12 bg-black/20 p-5">
                <p className="text-sm uppercase tracking-[0.28em] text-white/50">Audio</p>
                <div>
                  {interview.duration_sec && (
                    <p className="text-3xl font-semibold text-white">
                      {Math.floor(interview.duration_sec / 60)}分{interview.duration_sec % 60}秒
                    </p>
                  )}
                  <audio controls className="mt-4 w-full" src={mediaUrl} />
                </div>
              </div>
            </div>
          ) : mediaUrl ? (
            <video controls className="aspect-video w-full bg-black" src={mediaUrl} />
          ) : (
            <div className="flex aspect-video items-center justify-center bg-[linear-gradient(135deg,#142028,#2b4351)]">
              <p className="text-sm text-white/50">メディアを読み込めませんでした</p>
            </div>
          )}
        </div>

        {/* Status panel */}
        <div className="space-y-4 rounded-2xl border border-washi-3 bg-white p-5">
          <h2 className="text-xl font-semibold text-ink">処理状態</h2>
          <div className="space-y-2">
            <div
              className={`rounded-xl px-4 py-3 text-sm font-medium ${
                interview.transcript ? 'bg-shu-3 text-shu' : 'bg-washi-2 text-ink-3'
              }`}
            >
              {interview.transcript ? '✓ Whisper文字起こし完了' : '文字起こし待ち'}
            </div>
            <div
              className={`rounded-xl px-4 py-3 text-sm font-medium ${
                tags.length > 0 ? 'bg-shu-3 text-shu' : 'bg-washi-2 text-ink-3'
              }`}
            >
              {tags.length > 0 ? `✓ 暗黙知タグ ${tags.length}件` : '暗黙知タグ未抽出'}
            </div>
          </div>
          {!interview.transcript && <TranscribeButton interviewId={id} />}
        </div>
      </div>

      {/* Transcript */}
      {interview.transcript && (
        <section className="rounded-2xl border border-washi-3 bg-white p-6">
          <h2 className="mb-3 text-lg font-semibold text-ink">文字起こし</h2>
          <p className="whitespace-pre-wrap text-sm leading-7 text-ink-3">{interview.transcript}</p>
        </section>
      )}

      {/* Tacit tags */}
      {tags.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-ink">暗黙知タグ ({tags.length}件)</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {tags.map((tag) => (
              <div key={tag.id} className="rounded-2xl border border-washi-3 bg-white p-5">
                <p className="mb-2 text-xs font-medium uppercase tracking-widest text-shu">状況</p>
                <p className="text-sm font-semibold text-ink">{tag.situation}</p>
                <p className="mb-1 mt-3 text-xs font-medium uppercase tracking-widest text-ink-3">
                  判断
                </p>
                <p className="text-sm text-ink-3">{tag.judgment}</p>
                <p className="mb-1 mt-3 text-xs font-medium uppercase tracking-widest text-ink-4">
                  理由
                </p>
                <p className="text-sm text-ink-4">{tag.reason}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
