import { redirect } from 'next/navigation'

import DashboardSideNav from '@/features/dashboard/dashboard-side-nav'
import { getCurrentProfile } from '@/lib/get-profile'
import { parseUserRole } from '@/lib/roles'
import { createClient } from '@/lib/supabase/server'

const SUCCESSOR_NAV = [
  { href: '/successor', label: '概要' },
  { href: '/successor/archive', label: '記録閲覧' },
  { href: '/successor/agent', label: '相談 - 先代に相談' },
] as const

export default async function SuccessorSectionLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

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
