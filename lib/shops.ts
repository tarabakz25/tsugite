import type { SupabaseClient } from '@supabase/supabase-js'

import type { Profile, ShopProfileMeta, UserRole } from '@/types/profile'

type ShopRow = {
  id: string
}

/**
 * Resolve the shop ID for the current user regardless of role.
 * - shop: returns owned shop via ensureShopForProfile
 * - successor: returns organization_ids[0] (linked shop)
 * Returns null if no shop can be resolved.
 */
export async function resolveShopIdForUser(
  supabase: SupabaseClient,
  userId: string,
  profile: Pick<Profile, 'role' | 'shop_profile' | 'organization_ids'> | null,
  role: UserRole,
): Promise<string | null> {
  if (role === 'shop') {
    const shop = await ensureShopForProfile(supabase, userId, profile?.shop_profile)
    return shop?.id ?? null
  }

  // successor: use linked shop from organization_ids
  const orgIds = profile?.organization_ids
  if (Array.isArray(orgIds) && orgIds.length > 0) {
    // Verify the shop actually exists
    const { data: shop } = await supabase
      .from('shops')
      .select('id')
      .eq('id', orgIds[0])
      .maybeSingle()
    return shop?.id ?? null
  }

  return null
}

export async function ensureShopForProfile(
  supabase: SupabaseClient,
  ownerProfileId: string,
  shopProfile: ShopProfileMeta | null | undefined,
): Promise<ShopRow | null> {
  const { data: existingShop, error: readError } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_profile_id', ownerProfileId)
    .maybeSingle()

  if (readError) return null
  if (existingShop) return existingShop as ShopRow

  const { data: createdShop, error: createError } = await supabase
    .from('shops')
    .insert({
      owner_profile_id: ownerProfileId,
      name: shopProfile?.displayName ?? '',
      profile: shopProfile ?? {},
    })
    .select('id')
    .single()

  if (createError || !createdShop) return null
  return createdShop as ShopRow
}
