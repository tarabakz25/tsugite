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
    <main className="flex flex-1 flex-col bg-zinc-50 py-16 dark:bg-black">
      <Container>
        <h1 className="text-center text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          あなたの利用形態を選んでください
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          後から切り替えはサポートに依頼する必要が出る場合があります。いまの時点で近い方を選んでください。
        </p>
        <div className="mt-12">
          <RoleForm error={sp.error} />
        </div>
      </Container>
    </main>
  )
}
