import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, Archive, Bot, Compass } from 'lucide-react'

import { getCurrentProfile } from '@/lib/get-profile'
import { parseUserRole } from '@/lib/roles'

const NEXT_STEPS = [
  {
    icon: Archive,
    kanji: '蓄',
    romaji: 'ARCHIVE',
    jp: '蓄える',
    color: 'bg-navy text-white',
    colorText: 'text-navy',
    desc: '先代が残した話を頭にいれる。状況・判断・理由のタグになっている暗黙知をスマホでも読み込み、事前学習の材料にしてください。',
    cta: 'Archive を読む',
    href: '/dashboard/archive',
  },
  {
    icon: Compass,
    kanji: '導',
    romaji: 'GUIDE',
    jp: '現場で導く',
    color: 'bg-leaf text-white',
    colorText: 'text-leaf',
    desc: '所作をカメラで確認。決められたシーンを選んでカメラに映すだけ。ズレだけを音声でフィードバックします。',
    cta: 'Guide を開く',
    href: '/dashboard/guide',
  },
  {
    icon: Bot,
    kanji: '談',
    romaji: 'AGENT',
    jp: '相談する',
    color: 'bg-sky text-white',
    colorText: 'text-sky',
    desc: '迷ったときに先代視点へ相談。暗黙知を引用しながら、判断のヒントや言い回しの提案をチャットでもらえます。',
    cta: 'Agent に相談',
    href: '/dashboard/agent',
  },
]

export default async function SuccessorHomePage() {
  const profile = await getCurrentProfile()
  const role = parseUserRole(profile)
  if (role !== 'successor') redirect('/shop')

  const displayName = profile?.display_name || 'ユーザー'

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      {/* ヘッダー */}
      <header className="flex flex-col gap-2 border-b border-[var(--line-soft)] bg-[var(--washi)] px-6 pb-5 pt-6 md:px-8">
        <h1 className="font-serif text-2xl font-bold tracking-[0.06em] text-ink md:text-[26px]">
          お帰りなさい、{displayName}さん
        </h1>
        <p className="text-[13px] leading-relaxed text-ink-3">
          現場の前には、準備だけをまとめる。ひとつずつ進んでください。
        </p>
      </header>

      {/* コンテンツ */}
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-7 px-6 py-7 md:px-8">
        {/* 三本柱カード */}
        <section>
          <SectionLabel>三つの機能</SectionLabel>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {NEXT_STEPS.map((p, index) => (
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
                  <span className="flex size-7 items-center justify-center rounded-lg bg-shu/10 font-serif text-sm font-semibold text-shu">
                    {index + 1}
                  </span>
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
                <div className="border-t border-dotted border-[var(--line)] pt-3.5">
                  <Link
                    href={p.href}
                    className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-[13px] font-semibold text-white shadow-sm transition hover:bg-ink-2"
                  >
                    {p.cta} <ArrowRight size={12} />
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
