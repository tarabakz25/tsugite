import Link from 'next/link'
import { redirect } from 'next/navigation'

import Card from '@/components/ui/card'
import Container from '@/components/ui/container'
import { getCurrentProfile } from '@/lib/get-profile'
import { parseUserRole } from '@/lib/roles'

const KPI_MOCK = [
  ['掲載中の募集（モック）', '12'],
  ['今月の応募（モック）', '38'],
  ['未読メッセージ（モック）', '5'],
] as const

const TASKS = [
  {
    title: 'インタビュー動画を登録して暗黙知を資産にする',
    description:
      '先代の話を動画として残します。音声・字幕から「状況・判断・理由」のタグを自動抽出し、Guide / Agent が参照できるようになります。',
    href: '/dashboard/archive',
    cta: 'Archive で登録する',
  },
  {
    title: '後継者の相談（Agent）やチーム構成を確認する',
    description: 'Agent での質問ログや、アカウント情報はこちらから確認・調整してください。',
    href: '/dashboard/agent',
    cta: 'Agent を開く',
  },
  {
    title: '店の情報・権限設定',
    description: '掲載用プロフィール、メンバー、運用単位での設定変更は設定画面へ。',
    href: '/dashboard/settings',
    cta: '設定へ',
  },
] as const

export default async function ShopHomePage() {
  const profile = await getCurrentProfile()
  const role = parseUserRole(profile)
  if (role !== 'shop') redirect('/successor')

  return (
    <section className="flex flex-col gap-12 py-8 md:py-10">
      <Container>
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-ink-3">
          店主コンソール
        </p>
        <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-ink md:text-[2rem]">
          ここから、暗黙知を次へ渡していきます
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-2">
          まずやることをタスク順に並べました。数値 KPI
          は開発中ですが、ワークフローはこのままで進められます。
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-[1.2fr_minmax(0,1fr)]">
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-ink">いまできること（タスク）</h2>
            <ul className="space-y-4">
              {TASKS.map(({ title, description, href, cta }) => (
                <li key={href}>
                  <Card className="border-washi-3 p-6 shadow-none transition-colors hover:bg-white">
                    <h3 className="text-lg font-semibold leading-snug text-ink">{title}</h3>
                    <p className="mt-3 text-base leading-relaxed text-ink-2">{description}</p>
                    <div className="mt-6">
                      <Link
                        href={href}
                        className="inline-flex min-h-11 items-center rounded-lg bg-shu px-5 text-sm font-semibold text-white transition hover:bg-shu-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shu"
                      >
                        {cta}
                      </Link>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-bold text-ink">一覧（モック KPI）</h2>
            <div className="grid gap-4">
              {KPI_MOCK.map(([label, value]) => (
                <Card key={label} className="border border-washi-3 bg-white p-5 shadow-none">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">
                    {label}
                  </div>
                  <div className="mt-2 tabular-nums text-4xl font-semibold text-ink">{value}</div>
                </Card>
              ))}
            </div>

            <Card className="border border-dashed border-washi-3 bg-washi p-6 text-sm leading-relaxed text-ink-2">
              「店のプロフィール」を整えると応募側の一覧画面で情報が伝わりやすくなります。{' '}
              <Link
                href="/dashboard/profile"
                className="font-semibold text-shu underline underline-offset-4 hover:text-shu-2"
              >
                プロフィールを編集
              </Link>
            </Card>
          </div>
        </div>
      </Container>
    </section>
  )
}
