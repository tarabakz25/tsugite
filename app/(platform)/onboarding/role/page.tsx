import { redirect } from 'next/navigation'

import Container from '@/components/ui/container'
import RoleForm from '@/features/onboarding/role-form'
import { getCurrentProfileState } from '@/lib/get-profile'
import { homePathForRole, parseUserRole } from '@/lib/roles'

type PageProps = {
  searchParams: Promise<{ error?: string }>
}

export default async function OnboardingRolePage({ searchParams }: PageProps) {
  const sp = await searchParams
  const { profile, user } = await getCurrentProfileState()
  if (!user) redirect('/login')

  const role = parseUserRole(profile)
  const home = role ? homePathForRole(role) : null
  if (home) redirect(home)

  return (
    <main className="flex flex-1 flex-col py-16">
      <Container>
        <h1 className="text-center text-3xl font-semibold tracking-tight text-ink">
          あなたの利用形態を選んでください
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-ink-3">
          後から切り替えはサポートに依頼する必要が出る場合があります。いまの時点で近い方を選んでください。
        </p>
        <div className="mt-12">
          <RoleForm error={sp.error} />
        </div>
      </Container>
    </main>
  )
}
