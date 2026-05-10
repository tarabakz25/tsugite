'use client'

import { useState, type FormEvent } from 'react'

import Button from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

import {
  completeInterviewUpload,
  createInterviewUpload,
  type UploadVideoState,
} from '@/features/archive/actions'
import {
  INTERVIEW_FILE_ACCEPT,
  INTERVIEW_STORAGE_BUCKET,
  isMp3File,
  MAX_INTERVIEW_FILE_SIZE,
} from '@/features/archive/utils/media'

type VideoUploadFormProps = {
  onSuccess?: (interviewId: string) => void
}

function errorMessage(code: UploadVideoState['error']): string | null {
  switch (code) {
    case 'not_authenticated':
      return 'ログインしてください。'
    case 'role_mismatch':
      return '店としてログインされていません。'
    case 'no_shop':
      return '店舗情報が見つかりません。'
    case 'no_file':
      return 'MP3ファイルを選択してください。'
    case 'invalid_type':
      return 'MP3ファイルのみアップロード可能です。'
    case 'file_too_large':
      return 'ファイルサイズは100MB以下にしてください。'
    case 'upload_error':
      return 'アップロードに失敗しました。もう一度お試しください。'
    case 'invalid_upload':
      return 'アップロード情報が一致しません。ファイルを選択し直してください。'
    case 'db_error':
      return 'データベースエラーが発生しました。'
    default:
      return null
  }
}

export default function VideoUploadForm({ onSuccess }: VideoUploadFormProps) {
  const [error, setError] = useState<UploadVideoState['error']>()
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedFile) {
      setError('no_file')
      return
    }

    if (!isMp3File(selectedFile)) {
      setError('invalid_type')
      return
    }

    if (selectedFile.size > MAX_INTERVIEW_FILE_SIZE) {
      setError('file_too_large')
      return
    }

    setError(undefined)
    setIsUploading(true)

    try {
      const upload = await createInterviewUpload({
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
      })

      if (upload.error || !upload.interviewId || !upload.storagePath || !upload.token) {
        setError(upload.error ?? 'upload_error')
        return
      }

      const supabase = createClient()
      const { error: uploadError } = await supabase.storage
        .from(INTERVIEW_STORAGE_BUCKET)
        .uploadToSignedUrl(upload.storagePath, upload.token, selectedFile, {
          cacheControl: '3600',
          contentType: selectedFile.type || undefined,
          upsert: false,
        })

      if (uploadError) {
        setError('upload_error')
        return
      }

      const completed = await completeInterviewUpload({
        interviewId: upload.interviewId,
        storagePath: upload.storagePath,
      })

      if (completed.error || !completed.interviewId) {
        setError(completed.error ?? 'db_error')
        return
      }

      onSuccess?.(completed.interviewId)
    } catch {
      setError('upload_error')
    } finally {
      setIsUploading(false)
    }
  }

  const msg = errorMessage(error)

  return (
    <form aria-busy={isUploading} className="flex flex-col gap-4" onSubmit={handleSubmit}>
      {msg ? (
        <p className="text-sm text-red-600" role="alert">
          {msg}
        </p>
      ) : null}
      <div className="flex flex-col gap-2">
        <label htmlFor="video" className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
          インタビュー音声
        </label>
        <input
          type="file"
          id="video"
          name="video"
          accept={INTERVIEW_FILE_ACCEPT}
          required
          onChange={(e) => {
            setSelectedFile(e.target.files?.[0] || null)
            setError(undefined)
          }}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        {selectedFile && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            選択: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}MB)
          </p>
        )}
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          対応形式: MP3のみ対応（最大100MB）
        </p>
      </div>
      <Button type="submit" disabled={!selectedFile || isUploading} isLoading={isUploading}>
        {isUploading ? 'アップロード中...' : 'アップロード'}
      </Button>
    </form>
  )
}
