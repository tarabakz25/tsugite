import { redirect } from 'next/navigation'

import DashboardSideNav from '@/features/dashboard/dashboard-side-nav'
import { SHOP_NAV_ITEMS, SUCCESSOR_NAV_ITEMS } from '@/features/dashboard/nav-items'
import SuccessorMobileNav from '@/features/dashboard/successor-mobile-nav'
import { getCurrentProfileState } from '@/lib/get-profile'
import { parseUserRole } from '@/lib/roles'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { profile, user } = await getCurrentProfileState()
  if (!user) redirect('/login')
  if (!profile) redirect('/onboarding/role')

  const role = parseUserRole(profile)
  if (!role) redirect('/onboarding/role')

  const nav = role === 'shop' ? [...SHOP_NAV_ITEMS] : [...SUCCESSOR_NAV_ITEMS]
  const title = role === 'shop' ? '店主メニュー' : '三つの機能'

  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (role === 'successor') {
    const profileHref = '/successor/profile'
    const settingsHref = '/successor/settings'

    return (
      <>
        <div className="paper-bg flex min-h-[60vh] min-h-0 flex-1 flex-col pb-[calc(5.25rem+env(safe-area-inset-bottom))] md:flex-row md:pb-0">
          <DashboardSideNav
            asideMode="desktop-only"
            title={title}
            items={nav}
            role={role ?? undefined}
            profile={profile}
            email={authUser?.email}
          />
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </div>
        <SuccessorMobileNav profilePath={profileHref} settingsPath={settingsHref} />
      </>
    )
  }

  return (
    <div className="paper-bg flex min-h-[60vh] min-h-0 flex-1 flex-col md:flex-row">
      <DashboardSideNav
        title={title}
        items={nav}
        role={role ?? undefined}
        profile={profile}
        email={authUser?.email}
      />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  )
}
