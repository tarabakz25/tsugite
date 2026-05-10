import { redirect } from 'next/navigation'

import { getCurrentProfile } from '@/lib/get-profile'
import { parseUserRole } from '@/lib/roles'

/** 共通 `/dashboard` はロールごとのコンソール先頭へ統一してナビのアクティブ状態を単純化する */
export default async function DashboardPage() {
  const profile = await getCurrentProfile()
  const role = parseUserRole(profile)
  if (role === 'shop') redirect('/shop')
  if (role === 'successor') redirect('/successor')
  redirect('/login')
}
