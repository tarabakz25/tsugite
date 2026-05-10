import { redirect } from 'next/navigation'

import SuccessorProfileForm from '@/features/register/successor-profile-form'
import { getCurrentProfile } from '@/lib/get-profile'
import { parseUserRole } from '@/lib/roles'

export default async function DashboardSettingsProfilePage() {
  const profile = await getCurrentProfile()
  const role = parseUserRole(profile)
  if (role !== 'successor') redirect('/dashboard/settings/shop')

  const meta = profile?.successor_profile ?? {}

  return (
    <div className="mx-auto max-w-xl">
      <h2 className="mb-6 text-base font-semibold text-ink">プロフィール</h2>
      <SuccessorProfileForm
        defaultDisplayName={meta.displayName ?? ''}
        defaultInterests={meta.interests ?? ''}
        defaultBio={meta.bio ?? ''}
      />
    </div>
  )
}
