import { redirect } from 'next/navigation'

import DashboardSideNav from '@/features/dashboard/dashboard-side-nav'
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
    <div className="flex min-h-[60vh] min-h-0 flex-1 flex-col md:flex-row">
      <DashboardSideNav
        title="店主コンソール"
        items={[...SHOP_NAV]}
        role="shop"
        profile={profile}
        email={user?.email}
      />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  )
}
