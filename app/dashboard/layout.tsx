import { redirect } from 'next/navigation'

import DashboardSideNav from '@/features/dashboard/dashboard-side-nav'
import { getCurrentProfile } from '@/lib/get-profile'
import { parseUserRole } from '@/lib/roles'

const SHOP_NAV = [
  { href: '/dashboard', label: '概要' },
  { href: '/dashboard/profile', label: 'プロフィール' },
  { href: '/dashboard/archive', label: 'Archive - 暗黙知' },
  { href: '/dashboard/agent', label: 'Agent - AI相談' },
  { href: '/dashboard/settings', label: '設定' },
] as const

const SUCCESSOR_NAV = [
  { href: '/dashboard', label: '概要' },
  { href: '/dashboard/profile', label: 'プロフィール' },
  { href: '/dashboard/archive', label: 'Archive閲覧' },
  { href: '/dashboard/guide', label: 'Guide (AI弟子)' },
  { href: '/dashboard/agent', label: 'Agent - 先代に相談' },
  { href: '/dashboard/settings', label: '設定' },
] as const

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  const role = parseUserRole(profile)
  if (!role) redirect('/onboarding/role')

  const nav = role === 'shop' ? [...SHOP_NAV] : [...SUCCESSOR_NAV]
  const title = role === 'shop' ? '店向けメニュー' : '継ぎ手向けメニュー'

  return (
    <div className="flex min-h-[60vh] flex-1 flex-col md:flex-row">
      <DashboardSideNav title={title} items={nav} role={role ?? undefined} />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  )
}
