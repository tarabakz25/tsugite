'use client'

import { useState } from 'react'

import AppShell from '@/components/ui/app-shell'
import Tabs from '@/components/ui/tabs'
import PageContainer from '@/components/layout/page-container'
import PageHeader from '@/components/layout/page-header'

import VideoUploadForm from '@/features/archive/components/video-upload-form'
import InterviewsList from '@/features/archive/components/interviews-list'
import TacitTagsList from '@/features/archive/components/tacit-tags-list'
import type { Interview, TacitTag } from '@/features/archive/types'

type ArchiveContentProps = {
  interviews: Interview[]
  tags: TacitTag[]
}

export default function ArchiveContent({ interviews, tags }: ArchiveContentProps) {
  const [activeTab, setActiveTab] = useState('upload')

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

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Archive - 暗黙知の蓄積"
          description="インタビュー音声から、言語化されていない判断基準を抽出し、構造化して蓄積します。"
        />

        <Tabs
          activeValue={activeTab}
          className="w-full"
          items={[
            {
              content: (
                <div className="max-w-2xl">
                  <h2 className="mb-4 text-xl font-semibold text-ink">
                    新しいインタビュー音声をアップロード
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
                  <h2 className="mb-4 text-xl font-semibold text-ink">
                    インタビュー一覧 ({interviews.length}件)
                  </h2>
                  <InterviewsList interviews={interviews} onProcess={handleProcess} />
                </>
              ),
              label: 'インタビュー一覧',
              value: 'interviews',
            },
            {
              content: (
                <>
                  <h2 className="mb-4 text-xl font-semibold text-ink">
                    暗黙知タグ ({tags.length}件)
                  </h2>
                  <TacitTagsList tags={tags} />
                </>
              ),
              label: '暗黙知タグ',
              value: 'tags',
            },
          ]}
          onValueChange={setActiveTab}
        />
      </PageContainer>
    </AppShell>
  )
}
