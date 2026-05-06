import { redirect } from 'next/navigation'

import Container from '@/components/ui/container'
import ShopProfileForm from '@/features/register/shop-profile-form'
import { getCurrentProfile } from '@/lib/get-profile'
import { parseUserRole } from '@/lib/roles'

export default async function RegisterShopPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  const role = parseUserRole(profile)
  if (!role) redirect('/onboarding/role')
  if (role !== 'shop') redirect('/dashboard')

  const sp = profile.shop_profile

  return (
    <main className="flex flex-1 flex-col bg-zinc-50 py-12 dark:bg-black">
      <Container>
        <h1 className="text-center text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          店としてのプロフィール
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-center text-sm text-zinc-600 dark:text-zinc-400">
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
