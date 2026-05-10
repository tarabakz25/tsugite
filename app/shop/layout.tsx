import { redirect } from 'next/navigation'

import DashboardSideNav from '@/features/dashboard/dashboard-side-nav'
import { getCurrentProfileState } from '@/lib/get-profile'
import { parseUserRole } from '@/lib/roles'
import { createClient } from '@/lib/supabase/server'

const SHOP_NAV = [
  { href: '/shop', label: '概要' },
  { href: '/dashboard/profile', label: 'プロフィール' },
  { href: '/dashboard/archive', label: 'Archive - 暗黙知' },
  { href: '/dashboard/agent', label: 'Agent - AI相談' },
  { href: '/dashboard/settings', label: '設定' },
] as const

export default async function ShopConsoleLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { profile, user: currentUser } = await getCurrentProfileState()
  if (!currentUser) redirect('/login')
  if (!profile) redirect('/onboarding/role')

  const role = parseUserRole(profile)
  if (!role) redirect('/onboarding/role')
  if (role !== 'shop') redirect('/successor')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-[60vh] flex-1 flex-col md:flex-row">
      <DashboardSideNav
        title="店向けメニュー"
        items={[...SHOP_NAV]}
        role="shop"
        profile={profile}
        email={user?.email}
      />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  )
}
