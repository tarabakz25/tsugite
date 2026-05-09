import { redirect } from 'next/navigation'

import DashboardSideNav from '@/features/dashboard/dashboard-side-nav'
import { getServerAuthSession } from '@/lib/get-profile'
import { parseUserRole } from '@/lib/roles'

const SUCCESSOR_NAV = [
  { href: '/successor', label: '概要' },
  { href: '/successor/archive', label: 'Archive閲覧' },
  { href: '/successor/agent', label: 'Agent - 先代に相談' },
] as const

export default async function SuccessorSectionLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getServerAuthSession()
  if (!session) redirect('/login')

  const { profile, user } = session
  const role = parseUserRole(profile)
  if (!role) redirect('/onboarding/role')
  if (role !== 'successor') redirect('/shop')

  return (
    <div className="flex min-h-[60vh] flex-1 flex-col md:flex-row">
      <DashboardSideNav
        title="継ぎ手向けメニュー"
        items={[...SUCCESSOR_NAV]}
        role="successor"
        profile={profile}
        email={user.email}
      />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  )
}
