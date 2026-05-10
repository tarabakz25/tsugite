'use server'

import { redirect } from 'next/navigation'

import type { UserRole } from '@/lib/roles'
import { createClient } from '@/lib/supabase/server'

function profileSeedForUser(user: {
  id: string
  user_metadata?: {
    avatar_url?: unknown
    full_name?: unknown
    name?: unknown
    picture?: unknown
  }
}) {
  const displayName =
    typeof user.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === 'string'
        ? user.user_metadata.name
        : ''
  const avatarUrl =
    typeof user.user_metadata?.avatar_url === 'string'
      ? user.user_metadata.avatar_url
      : typeof user.user_metadata?.picture === 'string'
        ? user.user_metadata.picture
        : null

  return {
    avatar_url: avatarUrl,
    display_name: displayName,
    id: user.id,
  }
}

export async function setUserRole(role: UserRole): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile, error } = await supabase
    .from('profiles')
    .upsert({ ...profileSeedForUser(user), role }, { onConflict: 'id' })
    .select('id')
    .maybeSingle()

  if (error || !profile) {
    redirect('/onboarding/role?error=failed')
  }

  redirect(role === 'shop' ? '/onboarding/shop' : '/onboarding/successor')
}
