'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { LogOut, Settings, User } from 'lucide-react'

import type { Profile } from '@/types/profile'
import { createClient } from '@/lib/supabase/client'

import type { NavItem } from './nav-items'

type AsideMode = 'full' | 'desktop-only'

type DashboardSideNavProps = {
  title: string
  items: NavItem[]
  asideMode?: AsideMode
  role?: 'shop' | 'successor'
  profile?: Profile
  email?: string
  shopName?: string
  shopLocation?: string
}

export default function DashboardSideNav({
  title,
  items,
  asideMode = 'full',
  role,
  profile,
  email,
  shopName,
  shopLocation,
}: DashboardSideNavProps) {
  const pathname = usePathname()

  const asideResponsive =
    asideMode === 'desktop-only'
      ? 'hidden md:flex md:w-[232px] md:shrink-0 md:flex-col md:border-b-0 md:border-r md:shadow-none'
      : 'flex w-full shrink-0 flex-col md:sticky md:top-0 md:h-[min(100svh,100dvh)] md:w-[232px]'

  return (
    <aside className={`${asideResponsive} border-b border-washi-3 bg-washi-2 md:border-washi-3`}>
      <div className="flex flex-1 flex-col overflow-hidden md:overflow-y-auto">
        {/* ロゴ */}
        <div className="border-b border-dotted border-washi-3 px-6 pb-4 pt-5">
          <TsugiteLogo size={26} />
          <p className="mt-2 pl-0.5 text-[10px] tracking-[0.2em] text-ink-3">
            つぐ・つたえる・つむぐ
          </p>
        </div>

        {/* ナビ */}
        <nav
          aria-label="コンソール内メニュー"
          className={
            asideMode === 'desktop-only'
              ? 'flex flex-col gap-1 px-4 py-6'
              : 'flex flex-row gap-1 overflow-x-auto px-3 pb-4 md:flex-col md:gap-1 md:px-4 md:py-6'
          }
        >
          <p className="mb-2 hidden px-2.5 text-[10px] font-medium tracking-[0.25em] text-ink-4 md:block">
            {title}
          </p>
          {items.map(({ href, label, sub, icon }) => {
            const active =
              pathname === href || (href !== '/' && href.length > 1 && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 whitespace-nowrap rounded-[10px] px-3 py-3 text-sm leading-snug transition-colors md:whitespace-normal ${
                  active
                    ? 'bg-navy font-bold text-white'
                    : 'text-ink-2 hover:bg-washi hover:text-ink'
                }`}
              >
                <span className={active ? 'text-white' : 'text-ink-2'}>{icon}</span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-[13px] font-bold tracking-[0.06em]">{label}</span>
                  {sub && (
                    <span
                      className={`text-[9px] tracking-[0.15em] ${active ? 'opacity-70' : 'opacity-55'}`}
                    >
                      {sub}
                    </span>
                  )}
                </span>
                {active && <span className="ml-auto size-1 shrink-0 rounded-full bg-shu" />}
              </Link>
            )
          })}
        </nav>

        {/* ユーザーカード（店舗情報 + ユーザーメニュー統合） */}
        {profile && (
          <div className="mt-auto px-4 pb-4">
            <SideNavUserCard
              profile={profile}
              email={email}
              role={role}
              shopName={shopName}
              shopLocation={shopLocation}
            />
          </div>
        )}
      </div>
    </aside>
  )
}

/** 店舗情報 + ユーザーメニュー統合カード */
function SideNavUserCard({
  profile,
  email,
  role,
  shopName,
  shopLocation,
}: {
  profile: Profile
  email?: string
  role?: 'shop' | 'successor'
  shopName?: string
  shopLocation?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  const settingsHref = role === 'shop' ? '/dashboard/settings' : '/dashboard/settings'
  const profileHref = role === 'shop' ? '/shop/profile' : '/successor/profile'

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full rounded-xl border border-washi-3 bg-paper-4 p-3 text-left transition-colors hover:bg-washi"
      >
        {shopName && (
          <>
            <p className="text-[9px] tracking-[0.2em] text-ink-4">現在の店舗</p>
            <p className="mt-1.5 font-serif text-[13px] font-bold leading-snug">{shopName}</p>
            {shopLocation && <p className="mt-0.5 text-[10px] text-ink-3">{shopLocation}</p>}
          </>
        )}
        {!shopName && <p className="text-[9px] tracking-[0.2em] text-ink-4">アカウント</p>}
        <div
          className={`flex items-center gap-2 ${shopName ? 'mt-3 border-t border-dotted border-washi-3 pt-3' : 'mt-1'}`}
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-shu font-serif text-xs font-bold text-white">
            {profile.display_name?.charAt(0) || '?'}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-bold text-ink">
              {profile.display_name || 'ユーザー'}
            </p>
            <p className="text-[9px] text-ink-3">
              {role === 'shop' ? '店主ログイン中' : '後継者ログイン中'}
            </p>
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 z-50 mb-2 overflow-hidden rounded-xl border border-washi-3 bg-white shadow-lg">
          <div className="p-1">
            <Link
              href={profileHref}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-washi"
            >
              <User className="size-4" />
              プロフィール
            </Link>
            <Link
              href={settingsHref}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-washi"
            >
              <Settings className="size-4" />
              設定
            </Link>
            <hr className="my-1 border-washi-2" />
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger-bg"
            >
              <LogOut className="size-4" />
              ログアウト
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/** TSUGITE ロゴ SVG */
function TsugiteLogo({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size * 0.66} viewBox="0 0 60 40" fill="none" aria-hidden>
        <path
          d="M3 28 Q3 22 9 20 L20 17 Q26 15 28 22 L28 32 Q28 36 24 36 L8 36 Q3 36 3 32 Z"
          fill="var(--navy)"
        />
        <path
          d="M57 28 Q57 22 51 20 L40 17 Q34 15 32 22 L32 32 Q32 36 36 36 L52 36 Q57 36 57 32 Z"
          fill="var(--shu)"
        />
        <circle cx="30" cy="14" r="5" fill="var(--shu)" />
        <path
          d="M27 4 Q24 8 27 12 M33 4 Q36 8 33 12"
          stroke="var(--navy)"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
        />
        <path d="M28 9 L32 9" stroke="var(--navy)" strokeWidth="1.4" />
      </svg>
      <span className="font-serif text-lg font-bold tracking-[0.12em] text-navy">TSUGITE</span>
    </div>
  )
}
