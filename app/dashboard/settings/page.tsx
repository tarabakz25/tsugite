import { redirect } from 'next/navigation'

import { getCurrentProfile } from '@/lib/get-profile'
import { parseUserRole } from '@/lib/roles'

export default async function DashboardSettingsPage() {
  const profile = await getCurrentProfile()
  const role = parseUserRole(profile)

  if (role === 'shop') redirect('/dashboard/settings/shop')
  redirect('/dashboard/settings/profile')
}
