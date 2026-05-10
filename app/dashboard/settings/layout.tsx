import { redirect } from 'next/navigation'

import SettingsTabNav from '@/features/settings/settings-tab-nav'
import { getCurrentProfileState } from '@/lib/get-profile'
import { parseUserRole } from '@/lib/roles'

const SHOP_SETTINGS_TABS = [
  { href: '/dashboard/settings/shop', label: '店舗情報' },
  { href: '/dashboard/settings/members', label: 'メンバー' },
  { href: '/dashboard/settings/account', label: 'アカウント' },
]

const SUCCESSOR_SETTINGS_TABS = [
  { href: '/dashboard/settings/profile', label: 'プロフィール' },
  { href: '/dashboard/settings/account', label: 'アカウント' },
]

export default async function DashboardSettingsLayout({ children }: { children: React.ReactNode }) {
  const { profile, user } = await getCurrentProfileState()
  if (!user) redirect('/login')
  if (!profile) redirect('/onboarding/role')

  const role = parseUserRole(profile)
  if (!role) redirect('/onboarding/role')

  const tabs = role === 'shop' ? SHOP_SETTINGS_TABS : SUCCESSOR_SETTINGS_TABS

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-zinc-200 px-6 pt-6 dark:border-zinc-800">
        <h1 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">設定</h1>
        <SettingsTabNav tabs={tabs} role={role as 'shop' | 'successor'} />
      </div>
      <div className="flex-1 p-6">{children}</div>
    </div>
  )
}
