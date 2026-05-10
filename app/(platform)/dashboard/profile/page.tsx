import Container from '@/components/ui/container'
import ShopProfileForm from '@/features/register/shop-profile-form'
import SuccessorProfileForm from '@/features/register/successor-profile-form'
import { getCurrentProfile } from '@/lib/get-profile'
import { parseUserRole } from '@/lib/roles'

export default async function DashboardProfilePage() {
  const profile = await getCurrentProfile()
  const role = parseUserRole(profile)

  if (role === 'shop') {
    const sp = profile?.shop_profile
    return (
      <section className="flex flex-col gap-6 py-10">
        <Container>
          <h1 className="text-2xl font-semibold text-ink">店プロフィール</h1>
          <p className="mt-2 text-sm text-ink-3">
            入力内容は <code className="text-xs">profiles.shop_profile</code> に保持されます。
          </p>
          <div className="mt-8">
            <ShopProfileForm
              defaultDisplayName={sp?.displayName ?? ''}
              defaultRegion={sp?.region ?? ''}
              defaultDescription={sp?.description ?? ''}
            />
          </div>
        </Container>
      </section>
    )
  }

  // successor
  const sp = profile?.successor_profile
  return (
    <section className="flex flex-col gap-6 py-10">
      <Container>
        <h1 className="text-2xl font-semibold text-ink">プロフィール</h1>
        <p className="mt-2 text-sm text-ink-3">
          入力内容は <code className="text-xs">profiles.successor_profile</code> に保持されます。
        </p>
        <div className="mt-8">
          <SuccessorProfileForm
            defaultDisplayName={sp?.displayName ?? ''}
            defaultInterests={sp?.interests ?? ''}
            defaultBio={sp?.bio ?? ''}
          />
        </div>
      </Container>
    </section>
  )
}
