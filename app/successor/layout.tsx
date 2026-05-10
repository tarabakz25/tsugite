import { redirect } from 'next/navigation'

import DashboardSideNav from '@/features/dashboard/dashboard-side-nav'
import { getCurrentProfileState } from '@/lib/get-profile'
import { parseUserRole } from '@/lib/roles'
import { createClient } from '@/lib/supabase/server'

const SUCCESSOR_NAV = [
  { href: '/successor', label: '概要' },
  { href: '/dashboard/profile', label: 'プロフィール' },
  { href: '/dashboard/archive', label: 'Archive閲覧' },
  { href: '/dashboard/guide', label: 'Guide (AI弟子)' },
  { href: '/dashboard/agent', label: 'Agent - 先代に相談' },
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

  return (
    <div className="flex min-h-[60vh] flex-1 flex-col md:flex-row">
      <DashboardSideNav
        title="継ぎ手向けメニュー"
        items={[...SUCCESSOR_NAV]}
        role="successor"
        profile={profile}
        email={user?.email}
      />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  )
}
