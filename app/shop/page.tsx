import { Activity, BookOpen, MessageSquare, Video } from 'lucide-react'
import Link from 'next/link'

import Container from '@/components/ui/container'

const stats = [
  { label: '登録済みの暗黙知', value: '12', icon: Video, color: 'text-blue-600' },
  { label: 'AI弟子の学習状況', value: '85%', icon: Activity, color: 'text-green-600' },
  { label: '先代への相談回数', value: '24', icon: MessageSquare, color: 'text-purple-600' },
]

const quickActions = [
  {
    title: 'Archive - 暗黙知を記録',
    href: '/shop/archive',
    icon: Video,
  },
  {
    title: 'Guide - AI弟子で確認',
    href: '/shop/guide',
    icon: BookOpen,
  },
  {
    title: 'Agent - AIに相談',
    href: '/shop/agent',
    icon: MessageSquare,
  },
]

export default function ShopDashboardPage() {
  return (
    <section className="flex flex-col gap-10 py-10">
      <Container>
        <div>
          <h1 className="font-serif text-3xl font-bold text-ink">店ダッシュボード</h1>
          <p className="mt-2 text-ink-3">
            伝統技術の継承状況を確認し、現場の暗黙知をデジタル資産化しましょう。
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {stats.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {item.label}
                </div>
                <item.icon className={`size-5 ${item.color}`} />
              </div>
              <div className="mt-2 text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-12">
          <h2 className="font-serif text-xl font-bold text-ink">クイックアクセス</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="group rounded-xl border border-zinc-200 bg-white p-6 transition-all hover:border-shu/50 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-zinc-50 text-zinc-600 group-hover:bg-shu/10 group-hover:text-shu dark:bg-zinc-900">
                  <action.icon className="size-6" />
                </div>
                <h3 className="font-bold text-zinc-900 group-hover:text-shu dark:text-zinc-100">
                  {action.title}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
