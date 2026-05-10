import { redirect } from 'next/navigation'

import DashboardSideNav from '@/features/dashboard/dashboard-side-nav'
import SuccessorMobileNav from '@/features/dashboard/successor-mobile-nav'
import { getCurrentProfileState } from '@/lib/get-profile'
import { parseUserRole } from '@/lib/roles'
import { createClient } from '@/lib/supabase/server'

const SHOP_NAV = [
  { href: '/shop', label: '今日の作業場' },
  { href: '/dashboard/profile', label: '店のプロフィール' },
  { href: '/dashboard/archive', label: '暗黙知をためる（Archive）' },
  { href: '/dashboard/agent', label: '後継者の相談（Agent）' },
  { href: '/dashboard/settings', label: '設定・メンバー' },
] as const

const SUCCESSOR_NAV = [
  { href: '/successor', label: 'ホーム' },
  { href: '/dashboard/profile', label: 'プロフィール' },
  { href: '/dashboard/archive', label: '暗黙知を見る（Archive）' },
  { href: '/dashboard/guide', label: 'Guide（机上練習）' },
  { href: '/dashboard/agent', label: 'Agent（迷ったら相談）' },
  { href: '/dashboard/settings', label: '設定' },
] as const

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { profile, user } = await getCurrentProfileState()
  if (!user) redirect('/login')
  if (!profile) redirect('/onboarding/role')

  const role = parseUserRole(profile)
  if (!role) redirect('/onboarding/role')

  const nav = role === 'shop' ? [...SHOP_NAV] : [...SUCCESSOR_NAV]
  const title = role === 'shop' ? '店主コンソール' : '継ぎ手コンソール'

  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (role === 'successor') {
    const profileHref = '/successor/profile'
    const settingsHref = '/successor/settings'

    return (
      <>
        <div className="flex min-h-[60vh] min-h-0 flex-1 flex-col pb-[calc(5.25rem+env(safe-area-inset-bottom))] md:flex-row md:pb-0">
          <DashboardSideNav
            asideMode="desktop-only"
            title={title}
            items={nav}
            role={role ?? undefined}
            profile={profile}
            email={authUser?.email}
          />
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </div>
        <SuccessorMobileNav profilePath={profileHref} settingsPath={settingsHref} />
      </>
    )
  }

  return (
    <div className="flex min-h-[60vh] min-h-0 flex-1 flex-col md:flex-row">
      <DashboardSideNav
        title={title}
        items={nav}
        role={role ?? undefined}
        profile={profile}
        email={authUser?.email}
      />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  )
}
