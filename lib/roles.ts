import type { Profile, UserRole } from '@/types/profile'

export type { UserRole } from '@/types/profile'

export function parseUserRole(profile: Pick<Profile, 'role'> | null | undefined): UserRole | null {
  const r = profile?.role
  if (r === 'shop' || r === 'successor') return r
  return null
}

/** Post-login hub per role (`AUTH-03`). `null` means role not chosen yet. */
export function homePathForRole(role: unknown): '/shop' | '/successor' | null {
  if (role === 'shop') return '/shop'
  if (role === 'successor') return '/successor'
  return null
}
