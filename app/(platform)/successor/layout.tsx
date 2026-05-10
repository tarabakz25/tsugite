import { redirect } from 'next/navigation'

import DashboardSideNav from '@/features/dashboard/dashboard-side-nav'
import SuccessorMobileNav from '@/features/dashboard/successor-mobile-nav'
import { getCurrentProfileState } from '@/lib/get-profile'
import { parseUserRole } from '@/lib/roles'
import { createClient } from '@/lib/supabase/server'

const SUCCESSOR_NAV = [
  { href: '/successor', label: 'ホーム' },
  { href: '/dashboard/profile', label: 'プロフィール' },
  { href: '/dashboard/archive', label: '暗黙知を見る（Archive）' },
  { href: '/dashboard/guide', label: 'Guide（机上練習）' },
  { href: '/dashboard/agent', label: 'Agent（迷ったら相談）' },
  { href: '/dashboard/settings', label: '設定' },
] as const

export default async function SuccessorConsoleLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { profile, user: currentUser } = await getCurrentProfileState()
  if (!currentUser) redirect('/login')
  if (!profile) redirect('/onboarding/role')

  const role = parseUserRole(profile)
  if (!role) redirect('/onboarding/role')
  if (role !== 'successor') redirect('/shop')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const profileHref = '/successor/profile'
  const settingsHref = '/successor/settings'

  return (
    <>
      <div className="flex min-h-[60vh] min-h-0 flex-1 flex-col pb-[calc(5.25rem+env(safe-area-inset-bottom))] md:flex-row md:pb-0">
        <DashboardSideNav
          asideMode="desktop-only"
          title="継ぎ手コンソール"
          items={[...SUCCESSOR_NAV]}
          role="successor"
          profile={profile}
          email={user?.email}
        />
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
      <SuccessorMobileNav profilePath={profileHref} settingsPath={settingsHref} />
    </>
  )
}
