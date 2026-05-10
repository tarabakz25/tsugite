import { redirect } from 'next/navigation'

import Container from '@/components/ui/container'
import { getCurrentProfile } from '@/lib/get-profile'
import { parseUserRole } from '@/lib/roles'

export default async function SuccessorHomePage() {
  const profile = await getCurrentProfile()
  const role = parseUserRole(profile)
  if (role !== 'successor') redirect('/shop')

  return (
    <section className="flex flex-col gap-10 py-10">
      <Container>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">継ぎ手ホーム</h1>
        <p className="mt-2 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
          Archive・Guide・Agent を使って現場の技術を学びましょう。
        </p>
      </Container>
    </section>
  )
}
