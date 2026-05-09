import { cache } from 'react'
import type { User } from '@supabase/supabase-js'

import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/profile'

/**
 * 同一 RSC リクエスト内で createClient + getUser + profiles を一度だけ実行する。
 * レイアウトと子ページの二重取得を防ぎ、画面遷移時の DB / 認証往復を減らす。
 */
export type ServerAuthSession = {
  supabase: Awaited<ReturnType<typeof createClient>>
  user: User
  profile: Profile
}

export const getServerAuthSession = cache(async (): Promise<ServerAuthSession | null> => {
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

  if (error || !data) return null
  return { supabase, user, profile: data as Profile }
})

export async function getCurrentProfile(): Promise<Profile | null> {
  const session = await getServerAuthSession()
  return session?.profile ?? null
}
