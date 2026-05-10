'use server'

import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { parseUserRole } from '@/lib/roles'
import { ensureShopForProfile } from '@/lib/shops'

const MAX_LENGTH = 2000

export type ShopProfileState = {
  error?: string
}

export async function saveShopProfile(
  prev: ShopProfileState,
  formData: FormData,
): Promise<ShopProfileState> {
  void prev
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile, error: readError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (readError || !profile) {
    return { error: 'required' }
  }

  if (parseUserRole(profile) !== 'shop') {
    return { error: 'role_mismatch' }
  }

  const displayName = String(formData.get('displayName') ?? '').trim()
  const region = String(formData.get('region') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()

  if (!displayName || !region) {
    return { error: 'required' }
  }
  if (description.length > MAX_LENGTH) {
    return { error: 'too_long' }
  }

  const shop_profile = {
    displayName,
    region,
    description,
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ shop_profile })
    .eq('id', user.id)

  if (updateError) {
    return { error: 'required' }
  }

  const shop = await ensureShopForProfile(supabase, user.id, shop_profile)
  if (!shop) {
    return { error: 'required' }
  }

  redirect('/shop')
}
