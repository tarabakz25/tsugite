import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/profile'

function getStringMetadata(
  metadata: Record<string, unknown>,
  keys: readonly string[],
): string | null {
  for (const key of keys) {
    const value = metadata[key]
    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }

  return null
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (error) return null
  if (!data) {
    const metadata: Record<string, unknown> = user.user_metadata
    const { data: createdProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        display_name: getStringMetadata(metadata, ['full_name', 'name']) ?? '',
        avatar_url: getStringMetadata(metadata, ['avatar_url', 'picture']),
      })
      .select('*')
      .single()

    if (createError || !createdProfile) return null
    return createdProfile as Profile
  }

  return data as Profile
}
