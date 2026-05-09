import { redirect } from 'next/navigation'

import DashboardSideNav from '@/features/dashboard/dashboard-side-nav'
import { getCurrentProfile } from '@/lib/get-profile'
import { parseUserRole } from '@/lib/roles'
import { createClient } from '@/lib/supabase/server'

const SHOP_NAV = [
  { href: '/shop', label: '概要' },
  { href: '/shop/archive', label: '記録 - 暗黙知' },
  { href: '/shop/guide', label: '指南 - AI弟子' },
  { href: '/shop/agent', label: '相談 - AI相談' },
] as const

export default async function ShopSectionLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

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
