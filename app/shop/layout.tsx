import { redirect } from 'next/navigation'

import DashboardSideNav from '@/features/dashboard/dashboard-side-nav'
import { getServerAuthSession } from '@/lib/get-profile'
import { parseUserRole } from '@/lib/roles'

const SHOP_NAV = [
  { href: '/shop', label: '概要' },
  { href: '/shop/archive', label: 'Archive - 暗黙知' },
  { href: '/shop/guide', label: 'Guide (AI弟子)' },
  { href: '/shop/agent', label: 'Agent - AI相談' },
] as const

export default async function ShopSectionLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getServerAuthSession()
  if (!session) redirect('/login')

  const { profile, user } = session
  const role = parseUserRole(profile)
  if (!role) redirect('/onboarding/role')
  if (role !== 'shop') redirect('/successor')

  return (
    <div className="flex min-h-[60vh] flex-1 flex-col md:flex-row">
      <DashboardSideNav
        title="店向けメニュー"
        items={[...SHOP_NAV]}
        role="shop"
        profile={profile}
        email={user.email}
      />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  )
}
