import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, Mic, Archive, Bot, Compass, Bell } from 'lucide-react'

import { getCurrentProfile } from '@/lib/get-profile'
import { parseUserRole } from '@/lib/roles'

const PROGRESS = [
  { label: '物語', val: 78, note: '創業〜現在まで概ね揃いました' },
  { label: 'ノウハウ', val: 42, note: '厨房の記録、まだ薄い領域あり' },
  { label: '関係性', val: 65, note: '常連・取引先・地域' },
  { label: '価値観', val: 31, note: 'もう少し対話が必要です' },
]

const PILLARS = [
  {
    icon: Archive,
    kanji: '蓄',
    romaji: 'ARCHIVE',
    jp: '蓄える',
    color: 'bg-navy text-white',
    colorText: 'text-navy',
    count: '—',
    countLabel: '記録された素材',
    desc: '店主のインタビュー、業務動画、過去の資料を一箇所に。AIが自動で暗黙知を抽出します。',
    cta: '記録を見る',
    href: '/dashboard/archive',
  },
  {
    icon: Bot,
    kanji: '談',
    romaji: 'AGENT',
    jp: '相談する',
    color: 'bg-sky text-white',
    colorText: 'text-sky',
    count: '—',
    countLabel: '今月の対話',
    desc: '店主の判断・口調・人柄を再現したAIと対話。後継者が日々の判断を学べます。',
    cta: '相談する',
    href: '/dashboard/agent',
  },
  {
    icon: Compass,
    kanji: '導',
    romaji: 'GUIDE',
    jp: '現場で導く',
    color: 'bg-leaf text-white',
    colorText: 'text-leaf',
    count: 'リアルタイム',
    countLabel: '現場サポート',
    desc: '厨房・接客の現場で、所作や段取りをARで可視化。やってみせて、やらせてみる。',
    cta: 'ガイド開始',
    href: '/dashboard/guide',
  },
]

export default async function ShopHomePage() {
  const profile = await getCurrentProfile()
  const role = parseUserRole(profile)
  if (role !== 'shop') redirect('/successor')

  const displayName = profile?.display_name || 'ユーザー'

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      {/* ヘッダー */}
      <header className="flex flex-col gap-2 border-b border-[var(--line-soft)] bg-[var(--washi)] px-8 pb-5 pt-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-[26px] font-bold tracking-[0.06em] text-ink">
              お帰りなさい、{displayName}さん
            </h1>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3">
              暗黙知を言葉にする旅を、ここから続けましょう。
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-transparent px-4 py-2.5 text-[13px] font-semibold text-navy transition hover:bg-washi-2"
            >
              <Bell size={14} />
              お知らせ
            </Link>
            <Link
              href="/dashboard/archive"
              className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-navy-2"
            >
              <Mic size={14} />
              新しく記録する
            </Link>
          </div>
        </div>
      </header>

      {/* コンテンツ */}
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-7 px-8 py-7">
        {/* ヒーロー */}
        <section className="relative grid gap-10 overflow-hidden rounded-[20px] bg-navy p-9 text-white md:grid-cols-[1.2fr_1fr]">
          <div className="absolute -right-10 -top-10 size-60 rounded-full bg-shu opacity-[0.18]" />
          <div>
            <p className="text-[11px] tracking-[0.3em] text-navy-4">継承プロジェクト</p>
            <h2 className="mt-2 font-serif text-[32px] font-bold leading-[1.5] tracking-[0.06em]">
              先代の経験を、
              <br />
              言葉にしていく旅。
            </h2>
            <p className="mt-3.5 max-w-[480px] text-[13px] leading-[1.85] text-navy-4">
              制度や資金じゃなく、
              <br />
              「なぜこの店を続けるのか」「どうやって回しているのか」
              <br />
              そういう、言葉にならなかったものを言葉にする旅です。
            </p>
            <div className="mt-6 flex gap-2.5">
              <Link
                href="/dashboard/archive"
                className="inline-flex items-center gap-2 rounded-full bg-shu px-5 py-2.5 text-[13px] font-semibold text-white transition hover:brightness-110"
              >
                続きを記録する <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          {/* 進捗 */}
          <div className="relative z-[1] rounded-[14px] bg-white/5 p-6">
            <p className="mb-4 text-[11px] tracking-[0.2em] text-navy-4">継承の進捗</p>
            {PROGRESS.map((p) => (
              <div key={p.label} className="mb-4">
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="font-serif text-sm font-bold">{p.label}</span>
                  <span className="font-mono text-[13px] font-semibold text-shu-2">
                    {p.val}
                    <span className="text-[10px] opacity-70">%</span>
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-white/[0.08]">
                  <div className="h-full rounded-full bg-shu" style={{ width: `${p.val}%` }} />
                </div>
                <p className="mt-1 text-[10px] text-navy-4">{p.note}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 三本柱 */}
        <section>
          <SectionLabel>三つの機能</SectionLabel>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {PILLARS.map((p) => (
              <article
                key={p.romaji}
                className="relative flex cursor-pointer flex-col gap-3.5 overflow-hidden rounded-2xl border border-[var(--line-soft)] bg-paper-4 p-6 transition hover:scale-[1.01]"
              >
                <div
                  className={`absolute right-4 top-4 flex size-14 items-center justify-center rounded-xl font-serif text-[28px] font-bold ${p.color}`}
                >
                  {p.kanji}
                </div>
                <div className="flex items-center gap-2">
                  <p.icon size={16} className={p.colorText} />
                  <span
                    className={`font-mono text-[10px] font-bold tracking-[0.3em] ${p.colorText}`}
                  >
                    {p.romaji}
                  </span>
                </div>
                <p className="font-serif text-[22px] font-bold tracking-[0.06em] text-ink">
                  {p.jp}
                </p>
                <p className="min-h-[60px] text-xs leading-[1.85] text-ink-2">{p.desc}</p>
                <div className="flex items-center justify-between border-t border-dotted border-[var(--line)] pt-3.5">
                  <div>
                    <p className={`font-mono text-base font-bold ${p.colorText}`}>{p.count}</p>
                    <p className="mt-0.5 text-[9px] tracking-[0.15em] text-ink-3">{p.countLabel}</p>
                  </div>
                  <Link
                    href={p.href}
                    className={`flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.1em] ${p.colorText}`}
                  >
                    {p.cta} <ArrowRight size={11} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2.5">
      <span className="h-4 w-[3px] bg-navy" />
      <span className="text-[13px] font-bold tracking-[0.2em] text-ink">{children}</span>
    </div>
  )
}
