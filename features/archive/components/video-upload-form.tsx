'use client'

import { useActionState, useEffect, useState } from 'react'

import Button from '@/components/ui/button'

import { type UploadVideoState, uploadVideo } from '@/features/archive/actions'

type VideoUploadFormProps = {
  onSuccess?: (interviewId: string) => void
}

function errorMessage(code: UploadVideoState['error']): string | null {
  switch (code) {
    case 'role_mismatch':
      return '店としてログインされていません。'
    case 'no_shop':
      return '店舗情報が見つかりません。'
    case 'no_file':
      return '動画ファイルを選択してください。'
    case 'invalid_type':
      return '動画ファイルのみアップロード可能です。'
    case 'file_too_large':
      return 'ファイルサイズは100MB以下にしてください。'
    case 'upload_error':
      return 'アップロードに失敗しました。もう一度お試しください。'
    case 'db_error':
      return 'データベースエラーが発生しました。'
    default:
      return null
  }
}

export default function VideoUploadForm({ onSuccess }: VideoUploadFormProps) {
  const [state, formAction] = useActionState(uploadVideo, {})
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    if (state.interviewId && onSuccess) {
      onSuccess(state.interviewId)
    }
  }, [state.interviewId, onSuccess])

  const msg = errorMessage(state.error)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {msg ? (
        <p className="text-sm text-red-600" role="alert">
          {msg}
        </p>
      ) : null}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="video"
          className="text-sm font-medium text-zinc-800 dark:text-zinc-100"
        >
          インタビュー動画
        </label>
        <input
          type="file"
          id="video"
          name="video"
          accept="video/*"
          required
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        {selectedFile && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            選択: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}MB)
          </p>
        )}
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          対応形式: MP4, MOV, AVI など（最大100MB）
        </p>
      </div>
      <Button type="submit" disabled={!selectedFile}>
        アップロード
      </Button>
    </form>
  )
}
