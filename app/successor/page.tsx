import { BookOpen, History, MessageSquare, Video } from 'lucide-react'
import Link from 'next/link'

import Container from '@/components/ui/container'

const features = [
  {
    title: '記録閲覧',
    description: '先代が残した技術の記録を動画とタグで詳しく学びます。',
    href: '/successor/archive',
    icon: Video,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    title: '相談する',
    description: '現場で困ったとき、蓄積されたデータから先代の口調でアドバイスを貰えます。',
    href: '/successor/agent',
    icon: MessageSquare,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    title: '学習履歴',
    description: 'これまでの技術習得状況や、AI弟子のフィードバックを確認します。',
    href: '#',
    icon: History,
    color: 'text-zinc-600',
    bg: 'bg-zinc-50',
  },
]

export default function SuccessorDashboardPage() {
  return (
    <section className="flex flex-col gap-10 py-10">
      <Container>
        <div className="max-w-3xl">
          <h1 className="font-serif text-3xl font-bold text-ink">継ぎ手ホーム</h1>
          <p className="mt-4 text-lg text-ink-3">
            日本各地の伝統技術を、デジタルとAIの力で効率的に継承しましょう。
            まずは先代の記録を見るか、AIに相談してみてください。
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-8 transition-all hover:border-ink/50 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div
                className={`mb-6 inline-flex size-12 items-center justify-center rounded-xl ${feature.bg} ${feature.color}`}
              >
                <feature.icon className="size-7" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {feature.title}
              </h2>
              <p className="mt-3 leading-relaxed text-zinc-500 dark:text-zinc-400">
                {feature.description}
              </p>
              <div className="mt-auto pt-6 text-sm font-bold text-ink group-hover:underline">
                使ってみる →
              </div>
            </Link>
          ))}
        </div>

        {/* Tip Box */}
        <div className="mt-12 rounded-2xl bg-washi-2 p-8 border border-washi-3">
          <div className="flex gap-4">
            <BookOpen className="size-6 shrink-0 text-ink-3" />
            <div>
              <h3 className="font-bold text-ink">今日の学習アドバイス</h3>
              <p className="mt-2 text-sm text-ink-3 leading-relaxed">
                アーカイブの「お茶出し」セクションに新しい暗黙知タグが追加されました。
                所作の「理由」を理解することで、より深い技術の継承が可能になります。
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
