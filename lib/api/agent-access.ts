import type { SupabaseClient } from '@supabase/supabase-js'

export async function canAccessAgentShop(
  supabase: SupabaseClient,
  userId: string,
  shopId: string,
): Promise<boolean> {
  const { data: ownedShop, error: ownedShopError } = await supabase
    .from('shops')
    .select('id')
    .eq('id', shopId)
    .maybeSingle()

  if (ownedShopError) {
    console.error('Agent shop ownership check error:', ownedShopError)
    return false
  }

  if (ownedShop) {
    return true
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organization_ids')
    .eq('id', userId)
    .maybeSingle()

  if (profileError) {
    console.error('Agent profile access check error:', profileError)
    return false
  }

  return Array.isArray(profile?.organization_ids) && profile.organization_ids.includes(shopId)
}
