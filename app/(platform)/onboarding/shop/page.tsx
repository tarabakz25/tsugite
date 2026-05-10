import { redirect } from 'next/navigation'

import Container from '@/components/ui/container'
import ShopProfileForm from '@/features/register/shop-profile-form'
import { getCurrentProfileState } from '@/lib/get-profile'
import { parseUserRole } from '@/lib/roles'

export default async function RegisterShopPage() {
  const { profile, user } = await getCurrentProfileState()
  if (!user) redirect('/login')
  if (!profile) redirect('/onboarding/role')

  const role = parseUserRole(profile)
  if (!role) redirect('/onboarding/role')
  if (role !== 'shop') redirect(role === 'successor' ? '/successor' : '/onboarding/role')

  const sp = profile.shop_profile

  return (
    <main className="flex flex-1 flex-col py-12">
      <Container>
        <h1 className="text-center text-2xl font-semibold text-ink">店としてのプロフィール</h1>
        <p className="mx-auto mt-3 max-w-lg text-center text-sm text-ink-3">
          掲載開始前に、この情報がプロフィールの土台になります。あとから店向けページから変更できます。
        </p>
        <div className="mt-10">
          <ShopProfileForm
            defaultDisplayName={sp?.displayName ?? ''}
            defaultRegion={sp?.region ?? ''}
            defaultDescription={sp?.description ?? ''}
          />
        </div>
      </Container>
    </main>
  )
}
