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

export type DeleteInterviewResult =
  | { ok: true }
  | { ok: false; error: 'not_authenticated' | 'no_shop' | 'not_found' | 'db_error' }

export type DeleteTacitTagResult =
  | { ok: true }
  | { ok: false; error: 'not_authenticated' | 'no_shop' | 'not_found' | 'db_error' }

export async function deleteInterview(interviewId: string): Promise<DeleteInterviewResult> {
  if (!UUID_PATTERN.test(interviewId)) {
    return { ok: false, error: 'not_found' }
  }

  const { error, shop, supabase } = await getCurrentShop()
  if (error === 'not_authenticated') {
    return { ok: false, error: 'not_authenticated' }
  }
  if (error === 'no_shop' || !shop) {
    return { ok: false, error: 'no_shop' }
  }

  const { data: row, error: selectError } = await supabase
    .from('interviews')
    .select('id, storage_path')
    .eq('id', interviewId)
    .eq('shop_id', shop.id)
    .maybeSingle()

  if (selectError || !row) {
    return { ok: false, error: 'not_found' }
  }

  const { error: storageError } = await supabase.storage
    .from(INTERVIEW_STORAGE_BUCKET)
    .remove([row.storage_path])

  if (storageError) {
    console.error('deleteInterview: storage remove failed', storageError)
  }

  const { error: deleteError } = await supabase
    .from('interviews')
    .delete()
    .eq('id', interviewId)
    .eq('shop_id', shop.id)

  if (deleteError) {
    console.error('deleteInterview: db delete failed', deleteError)
    return { ok: false, error: 'db_error' }
  }

  return { ok: true }
}

export async function deleteTacitTag(tagId: string): Promise<DeleteTacitTagResult> {
  if (!UUID_PATTERN.test(tagId)) {
    return { ok: false, error: 'not_found' }
  }

  const { error, shop, supabase } = await getCurrentShop()
  if (error === 'not_authenticated') {
    return { ok: false, error: 'not_authenticated' }
  }
  if (error === 'no_shop' || !shop) {
    return { ok: false, error: 'no_shop' }
  }

  const { data: tagRow, error: selectError } = await supabase
    .from('tacit_tags')
    .select('id')
    .eq('id', tagId)
    .eq('shop_id', shop.id)
    .maybeSingle()

  if (selectError || !tagRow) {
    return { ok: false, error: 'not_found' }
  }

  const { error: embedDeleteError } = await supabase
    .from('tag_embeddings')
    .delete()
    .eq('tag_id', tagId)

  if (embedDeleteError) {
    console.error('deleteTacitTag: tag_embeddings delete failed', embedDeleteError)
    return { ok: false, error: 'db_error' }
  }

  const { error: deleteError } = await supabase
    .from('tacit_tags')
    .delete()
    .eq('id', tagId)
    .eq('shop_id', shop.id)

  if (deleteError) {
    console.error('deleteTacitTag: tacit_tags delete failed', deleteError)
    return { ok: false, error: 'db_error' }
  }

  return { ok: true }
}
