'use server'

import { createClient } from '@/lib/supabase/server'
import { ensureShopForProfile } from '@/lib/shops'
import {
  getFileExtension,
  getInterviewFileExtension,
  INTERVIEW_STORAGE_BUCKET,
  isSupportedInterviewFile,
  MAX_INTERVIEW_FILE_SIZE,
} from '@/features/archive/utils/media'

type UploadVideoError =
  | 'not_authenticated'
  | 'role_mismatch'
  | 'no_shop'
  | 'no_file'
  | 'invalid_type'
  | 'file_too_large'
  | 'upload_error'
  | 'invalid_upload'
  | 'db_error'

export type UploadVideoState = {
  error?: UploadVideoError
  interviewId?: string
  storagePath?: string
  token?: string
}

type CreateInterviewUploadInput = {
  fileName: string
  fileSize: number
  fileType: string
}

type CompleteInterviewUploadInput = {
  interviewId: string
  storagePath: string
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

async function getCurrentShop() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'not_authenticated' as const, shop: null, supabase }

  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_profile')
    .eq('id', user.id)
    .maybeSingle()

  const shop = await ensureShopForProfile(supabase, user.id, profile?.shop_profile)
  if (!shop) return { error: 'no_shop' as const, shop: null, supabase }

  return { error: null, shop, supabase }
}

function validateUploadInput(input: CreateInterviewUploadInput): UploadVideoError | null {
  if (!input.fileName || !Number.isFinite(input.fileSize) || input.fileSize <= 0) {
    return 'no_file'
  }

  const file = { name: input.fileName, type: input.fileType }
  if (!isSupportedInterviewFile(file)) {
    return 'invalid_type'
  }

  if (input.fileSize > MAX_INTERVIEW_FILE_SIZE) {
    return 'file_too_large'
  }

  return null
}

function isExpectedStoragePath(storagePath: string, shopId: string, interviewId: string): boolean {
  if (!UUID_PATTERN.test(interviewId)) return false

  const expectedPrefix = `${shopId}/${interviewId}.`
  if (!storagePath.startsWith(expectedPrefix)) return false

  const extension = getFileExtension(storagePath)
  return (
    Boolean(extension) &&
    !storagePath.slice(expectedPrefix.length).includes('/') &&
    isSupportedInterviewFile({ name: storagePath, type: '' })
  )
}

export async function createInterviewUpload(
  input: CreateInterviewUploadInput,
): Promise<UploadVideoState> {
  const inputError = validateUploadInput(input)
  if (inputError) return { error: inputError }

  const { error, shop, supabase } = await getCurrentShop()
  if (error) return { error }
  if (!shop) return { error: 'no_shop' }

  const interviewId = crypto.randomUUID()
  const fileExt = getInterviewFileExtension({ name: input.fileName, type: input.fileType })
  const storagePath = `${shop.id}/${interviewId}.${fileExt}`

  const { data, error: signedUrlError } = await supabase.storage
    .from(INTERVIEW_STORAGE_BUCKET)
    .createSignedUploadUrl(storagePath, { upsert: false })

  if (signedUrlError || !data?.token) {
    return { error: 'upload_error' }
  }

  return {
    interviewId,
    storagePath,
    token: data.token,
  }
}

export type DeleteTacitTagState = {
  error?: 'not_authenticated' | 'no_shop' | 'not_found' | 'db_error'
  success?: boolean
}

export async function deleteTacitTag(tagId: string): Promise<DeleteTacitTagState> {
  const { error, shop, supabase } = await getCurrentShop()
  if (error) return { error }
  if (!shop) return { error: 'no_shop' }

  const { data: existing, error: selectError } = await supabase
    .from('tacit_tags')
    .select('id')
    .eq('id', tagId)
    .eq('shop_id', shop.id)
    .maybeSingle()

  if (selectError) return { error: 'db_error' }
  if (!existing) return { error: 'not_found' }

  const { error: deleteError } = await supabase
    .from('tacit_tags')
    .delete()
    .eq('id', tagId)
    .eq('shop_id', shop.id)

  if (deleteError) return { error: 'db_error' }

  return { success: true }
}

export type DeleteInterviewState = {
  error?: 'not_authenticated' | 'no_shop' | 'not_found' | 'db_error'
  success?: boolean
}

export async function deleteInterview(interviewId: string): Promise<DeleteInterviewState> {
  const { error, shop, supabase } = await getCurrentShop()
  if (error) return { error }
  if (!shop) return { error: 'no_shop' }

  const { data: row, error: selectError } = await supabase
    .from('interviews')
    .select('id, storage_path')
    .eq('id', interviewId)
    .eq('shop_id', shop.id)
    .maybeSingle()

  if (selectError) return { error: 'db_error' }
  if (!row) return { error: 'not_found' }

  const { error: storageError } = await supabase.storage
    .from(INTERVIEW_STORAGE_BUCKET)
    .remove([row.storage_path])

  if (storageError) {
    console.warn('Interview storage delete skipped:', storageError.message)
  }

  const { error: deleteError } = await supabase
    .from('interviews')
    .delete()
    .eq('id', interviewId)
    .eq('shop_id', shop.id)

  if (deleteError) return { error: 'db_error' }

  return { success: true }
}

export async function completeInterviewUpload(
  input: CompleteInterviewUploadInput,
): Promise<UploadVideoState> {
  const { error, shop, supabase } = await getCurrentShop()
  if (error) return { error }
  if (!shop) return { error: 'no_shop' }

  if (!isExpectedStoragePath(input.storagePath, shop.id, input.interviewId)) {
    return { error: 'invalid_upload' }
  }

  const { data: objectInfo, error: objectInfoError } = await supabase.storage
    .from(INTERVIEW_STORAGE_BUCKET)
    .info(input.storagePath)

  if (objectInfoError || !objectInfo) {
    return { error: 'upload_error' }
  }

  const { data: interview, error: insertError } = await supabase
    .from('interviews')
    .insert({
      id: input.interviewId,
      shop_id: shop.id,
      storage_path: input.storagePath,
    })
    .select('id')
    .single()

  if (insertError || !interview) {
    return { error: 'db_error' }
  }

  return { interviewId: interview.id }
}
