'use client'

import { useState } from 'react'

import AppShell from '@/components/ui/app-shell'
import Tabs from '@/components/ui/tabs'

import VideoUploadForm from '@/features/archive/components/video-upload-form'
import InterviewsList from '@/features/archive/components/interviews-list'
import TacitTagsList from '@/features/archive/components/tacit-tags-list'
import { deleteInterview, deleteTacitTag } from '@/features/archive/actions'
import type { Interview, TacitTag } from '@/features/archive/types'

type ArchiveContentProps = {
  interviews: Interview[]
  tags: TacitTag[]
}

export default function ArchiveContent({
  interviews: initialInterviews,
  tags: initialTags,
}: ArchiveContentProps) {
  const [activeTab, setActiveTab] = useState('upload')
  const [interviews, setInterviews] = useState(initialInterviews)
  const [tags, setTags] = useState(initialTags)

  const handleProcess = async (interviewId: string) => {
    try {
      // Call transcription API
      const transcribeRes = await fetch(`/api/archive/transcribe/${interviewId}`, {
        method: 'POST',
      })
      if (!transcribeRes.ok) {
        const body = await transcribeRes.json().catch(() => ({}))
        alert(`文字起こしに失敗しました (${transcribeRes.status}): ${body.error ?? '不明なエラー'}`)
        return
      }

      // Call extraction API
      const extractRes = await fetch(`/api/archive/extract/${interviewId}`, {
        method: 'POST',
      })
      if (!extractRes.ok) {
        const body = await extractRes.json().catch(() => ({}))
        alert(`暗黙知抽出に失敗しました (${extractRes.status}): ${body.error ?? '不明なエラー'}`)
        return
      }

      const extractData = await extractRes.json()

      // Generate embeddings for each tag
      if (extractData.tags) {
        for (const tag of extractData.tags) {
          await fetch(`/api/archive/embed/${tag.id}`, {
            method: 'POST',
          })
        }
      }

      window.location.reload()
    } catch (err) {
      console.error('handleProcess error:', err)
      alert(`処理中にエラーが発生しました: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const handleDeleteTag = async (tagId: string) => {
    const result = await deleteTacitTag(tagId)
    if (result.error) {
      const errorMessages: Record<string, string> = {
        not_authenticated: 'ログインが必要です',
        no_shop: '店舗情報が見つかりません',
        not_found: 'タグが見つかりません',
        db_error: 'データベースエラーが発生しました',
      }
      alert(errorMessages[result.error] ?? '削除に失敗しました')
      return
    }
    setTags((prev) => prev.filter((tag) => tag.id !== tagId))
  }

  const handleDeleteInterview = async (interviewId: string) => {
    const result = await deleteInterview(interviewId)
    if (result.error) {
      const errorMessages: Record<string, string> = {
        not_authenticated: 'ログインが必要です',
        no_shop: '店舗情報が見つかりません',
        not_found: 'インタビューが見つかりません',
        db_error: 'データベースエラーが発生しました',
      }
      alert(errorMessages[result.error] ?? '削除に失敗しました')
      return
    }
    setInterviews((prev) => prev.filter((row) => row.id !== interviewId))
    setTags((prev) =>
      prev.map((tag) => {
        if (tag.interviewId !== interviewId) {
          return tag
        }
        return { ...tag, interviewId: null }
      }),
    )
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Archive - 暗黙知の蓄積
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            インタビュー動画・音声から、言語化されていない判断基準を抽出し、構造化して蓄積します。
          </p>
        </div>

        <Tabs
          activeValue={activeTab}
          className="w-full"
          items={[
            {
              content: (
                <div className="max-w-2xl">
                  <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                    新しいインタビュー動画・音声をアップロード
                  </h2>
                  <VideoUploadForm onSuccess={() => window.location.reload()} />
                </div>
              ),
              label: 'アップロード',
              value: 'upload',
            },
            {
              content: (
                <>
                  <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                    インタビュー一覧 ({interviews.length}件)
                  </h2>
                  <InterviewsList
                    interviews={interviews}
                    onProcess={handleProcess}
                    onDelete={handleDeleteInterview}
                  />
                </>
              ),
              label: 'インタビュー一覧',
              value: 'interviews',
            },
            {
              content: (
                <>
                  <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                    暗黙知タグ ({tags.length}件)
                  </h2>
                  <TacitTagsList tags={tags} onDelete={handleDeleteTag} />
                </>
              ),
              label: '暗黙知タグ',
              value: 'tags',
            },
          ]}
          onValueChange={setActiveTab}
        />
      </div>
    </AppShell>
  )
}
