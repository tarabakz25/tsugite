'use server'

import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { parseUserRole } from '@/lib/roles'

const MAX_LENGTH = 2000

export type SuccessorProfileState = {
  error?: string
}

export async function saveSuccessorProfile(
  prev: SuccessorProfileState,
  formData: FormData,
): Promise<SuccessorProfileState> {
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

  if (parseUserRole(profile) !== 'successor') {
    return { error: 'role_mismatch' }
  }

  const displayName = String(formData.get('displayName') ?? '').trim()
  const interests = String(formData.get('interests') ?? '').trim()
  const bio = String(formData.get('bio') ?? '').trim()

  if (!displayName) {
    return { error: 'required' }
  }
  if (bio.length > MAX_LENGTH || interests.length > MAX_LENGTH) {
    return { error: 'too_long' }
  }

  const successor_profile = {
    displayName,
    interests,
    bio,
  }

  const { data: updatedProfile, error: updateError } = await supabase
    .from('profiles')
    .update({ successor_profile })
    .eq('id', user.id)
    .select('id')
    .maybeSingle()

  if (updateError || !updatedProfile) {
    return { error: 'required' }
  }

  redirect('/successor')
}
