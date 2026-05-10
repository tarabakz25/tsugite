import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/profile'

export type CurrentProfileState = {
  user: { email?: string; id: string } | null
  profile: Profile | null
}

export async function getCurrentProfileState(): Promise<CurrentProfileState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { user: null, profile: null }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  return {
    user: { email: user.email, id: user.id },
    profile: error || !data ? null : (data as Profile),
  }
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const { profile } = await getCurrentProfileState()
  return profile
}
