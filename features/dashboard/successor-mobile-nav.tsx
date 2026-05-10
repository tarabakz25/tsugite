'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FolderArchive, Home, MessagesSquare, MoreHorizontal, Scan } from 'lucide-react'
import { useState } from 'react'

import Sheet from '@/components/ui/sheet'
import { cn } from '@/lib/cn'

type NavGlyph = typeof Home

const primaryItems: {
  href: string
  label: string
  Icon: NavGlyph
  match: (path: string) => boolean
}[] = [
  {
    href: '/successor',
    label: 'ホーム',
    Icon: Home,
    match: (path) =>
      path === '/successor' ||
      path.startsWith('/successor/') ||
      path === '/dashboard' ||
      path.startsWith('/dashboard/profile') ||
      path.startsWith('/dashboard/settings'),
  },
  {
    href: '/dashboard/archive',
    label: 'Archive',
    Icon: FolderArchive,
    match: (path) => path.startsWith('/dashboard/archive'),
  },
  {
    href: '/dashboard/guide',
    label: 'Guide',
    Icon: Scan,
    match: (path) => path.startsWith('/dashboard/guide'),
  },
  {
    href: '/dashboard/agent',
    label: 'Agent',
    Icon: MessagesSquare,
    match: (path) => path.startsWith('/dashboard/agent'),
  },
]

type SuccessorMobileNavProps = {
  profilePath: string
  settingsPath: string
}

export default function SuccessorMobileNav({ profilePath, settingsPath }: SuccessorMobileNavProps) {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <>
      <nav
        aria-label="継ぎ手向けモバイルナビゲーション"
        className={cn(
          'fixed inset-x-0 bottom-0 z-[35] md:hidden',
          'border-t border-washi-3 bg-white/92 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur',
        )}
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5 gap-1 px-2">
          {primaryItems.map(({ href, label, Icon, match }) => {
            const active = match(pathname)
            return (
              <li key={href} className="flex justify-center">
                <Link
                  href={href}
                  className={cn(
                    'flex min-h-12 min-w-12 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[10px] font-semibold text-ink-3 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shu',
                    active && 'bg-shu-3 text-shu ring-1 ring-shu/20',
                  )}
                >
                  <Icon aria-hidden className="size-[22px] shrink-0" strokeWidth={2} />
                  <span>{label}</span>
                </Link>
              </li>
            )
          })}
          <li className="flex justify-center">
            <button
              type="button"
              className="flex min-h-12 min-w-12 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[10px] font-semibold text-ink-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shu"
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen(true)}
            >
              <MoreHorizontal aria-hidden className="size-[22px] shrink-0" strokeWidth={2} />
              <span>その他</span>
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={moreOpen} title="メニュー" description="プロフィールと設定へのリンクです。">
        <div className="flex flex-col gap-2 pb-[env(safe-area-inset-bottom)]">
          <Link
            className="min-h-[48px] rounded-lg px-4 py-3 text-base font-semibold text-ink hover:bg-washi-2 active:bg-washi-3"
            href={profilePath}
            onClick={() => setMoreOpen(false)}
          >
            プロフィール
          </Link>
          <Link
            className="min-h-[48px] rounded-lg px-4 py-3 text-base font-semibold text-ink hover:bg-washi-2 active:bg-washi-3"
            href={settingsPath}
            onClick={() => setMoreOpen(false)}
          >
            設定
          </Link>
          <button
            type="button"
            className="mt-4 min-h-[48px] w-full rounded-lg border border-washi-3 py-3 text-base font-semibold text-ink-2 hover:bg-washi active:bg-washi-2"
            onClick={() => setMoreOpen(false)}
          >
            閉じる
          </button>
        </div>
      </Sheet>
    </>
  )
}
