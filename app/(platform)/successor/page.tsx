import Link from 'next/link'
import { redirect } from 'next/navigation'

import Card from '@/components/ui/card'
import Container from '@/components/ui/container'
import { getCurrentProfile } from '@/lib/get-profile'
import { parseUserRole } from '@/lib/roles'

const NEXT_STEPS = [
  {
    title: '先代が残した話を頭にいれる（Archive）',
    description:
      '状況・判断・理由のタグになっている暗黙知をスマホでも読み込み、事前学習の材料にしてください。',
    href: '/dashboard/archive',
    cta: 'Archive を読む',
  },
  {
    title: '所作をカメラで確認（Guide）',
    description: '決められたシーンを選んでカメラに映すだけ。ズレだけを音声でフィードバックします。',
    href: '/dashboard/guide',
    cta: 'Guide を開く',
  },
  {
    title: '迷ったときに先代視点へ相談（Agent）',
    description: '暗黙知を引用しながら、判断のヒントや言い回しの提案をチャットでもらえます。',
    href: '/dashboard/agent',
    cta: 'Agent に相談',
  },
] as const

export default async function SuccessorHomePage() {
  const profile = await getCurrentProfile()
  const role = parseUserRole(profile)
  if (role !== 'successor') redirect('/shop')

  return (
    <section className="flex flex-col gap-10 py-8 md:py-12">
      <Container>
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-shu">
          継ぎ手コンソール
        </p>
        <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-ink md:text-[2rem]">
          現場の前には、準備だけをまとめる
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-2">
          進め順は決まっています。細かい機能名はなくて大丈夫ですので、ひとつずつタップして進んでください。
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {NEXT_STEPS.map(({ title, description, href, cta }, index) => (
            <Card
              key={href}
              className="relative flex flex-col gap-5 border border-washi-3 bg-white p-6 pb-28 shadow-none"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-shu-3 font-serif text-lg font-semibold text-shu ring-1 ring-shu/15">
                {index + 1}
              </span>
              <div>
                <h2 className="text-lg font-semibold leading-snug text-ink">{title}</h2>
                <p className="mt-3 text-base leading-relaxed text-ink-2">{description}</p>
              </div>
              <div className="absolute bottom-6 left-6 right-6">
                <Link
                  href={href}
                  className="flex min-h-12 items-center justify-center rounded-lg bg-ink px-4 text-base font-semibold text-white shadow-sm shadow-ink/20 transition hover:bg-ink-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shu"
                >
                  {cta}
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  )
}
