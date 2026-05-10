'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import type { Profile } from '@/types/profile'

import DashboardUserNav from './dashboard-user-nav'

type NavItem = {
  href: string
  label: string
}

type AsideMode = 'full' | 'desktop-only'

type DashboardSideNavProps = {
  title: string
  items: NavItem[]
  /** `desktop-only`: モバイルはボトムナビ等に任せサイドバーを非表示（継ぎ手） */
  asideMode?: AsideMode
  role?: 'shop' | 'successor'
  profile?: Profile
  email?: string
}

export default function DashboardSideNav({
  title,
  items,
  asideMode = 'full',
  role,
  profile,
  email,
}: DashboardSideNavProps) {
  const pathname = usePathname()

  const titleColor =
    role === 'shop' ? 'text-shu' : role === 'successor' ? 'text-ink-2' : 'text-ink-4'

  const activeClass =
    role === 'shop'
      ? 'bg-shu-3 font-semibold text-shu ring-1 ring-shu/15'
      : role === 'successor'
        ? 'bg-white font-semibold text-ink shadow-sm ring-1 ring-washi-3'
        : 'bg-white font-semibold text-ink shadow-sm ring-1 ring-washi-3'

  const asideResponsive =
    asideMode === 'desktop-only'
      ? 'hidden md:flex md:w-64 md:shrink-0 md:flex-col md:border-b-0 md:border-r md:shadow-none'
      : 'flex w-full shrink-0 flex-col md:sticky md:top-0 md:h-[min(100svh,100dvh)] md:w-64'

  return (
    <aside
      className={`${asideResponsive} border-b border-washi-3 bg-white shadow-[0_1px_0_rgb(221_226_220_/_0.9)] md:border-washi-3 md:bg-surface`}
    >
      <div className="flex flex-1 flex-col overflow-hidden md:overflow-y-auto">
        <div className="px-5 pb-4 pt-6 md:px-6">
          <div className={`text-xs font-semibold uppercase tracking-[0.2em] ${titleColor}`}>
            {title}
          </div>
        </div>
        <nav
          aria-label="コンソール内メニュー"
          className={
            asideMode === 'desktop-only'
              ? 'flex flex-col gap-1 px-2 pb-8'
              : 'flex flex-row gap-1 overflow-x-auto px-3 pb-4 md:flex-col md:px-2 md:pb-8'
          }
        >
          {items.map(({ href, label }) => {
            const active =
              pathname === href || (href !== '/' && href.length > 1 && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`whitespace-nowrap rounded-lg px-3 py-2.5 text-sm leading-snug transition-colors md:min-h-[44px] md:py-3 md:whitespace-normal ${
                  active ? activeClass : 'text-ink-2 hover:bg-washi hover:text-ink'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </nav>
      </div>

      {asideMode === 'desktop-only' ? (
        profile ? (
          <div className="hidden md:block">
            <DashboardUserNav profile={profile} email={email} />
          </div>
        ) : null
      ) : profile ? (
        <DashboardUserNav profile={profile} email={email} />
      ) : null}
    </aside>
  )
}
