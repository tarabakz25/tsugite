'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/button'

type TranscribeButtonProps = {
  interviewId: string
}

export default function TranscribeButton({ interviewId }: TranscribeButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()

  const handleProcess = async () => {
    setIsProcessing(true)
    try {
      const transcribeRes = await fetch(`/api/archive/transcribe/${interviewId}`, {
        method: 'POST',
      })
      if (!transcribeRes.ok) {
        const body = await transcribeRes.json().catch(() => ({}))
        alert(`文字起こしに失敗しました (${transcribeRes.status}): ${body.error ?? '不明なエラー'}`)
        return
      }

      const extractRes = await fetch(`/api/archive/extract/${interviewId}`, {
        method: 'POST',
      })
      if (!extractRes.ok) {
        const body = await extractRes.json().catch(() => ({}))
        alert(`暗黙知抽出に失敗しました (${extractRes.status}): ${body.error ?? '不明なエラー'}`)
        return
      }

      const extractData = await extractRes.json()
      if (extractData.tags) {
        for (const tag of extractData.tags) {
          await fetch(`/api/archive/embed/${tag.id}`, { method: 'POST' })
        }
      }

      router.refresh()
    } catch (err) {
      console.error('TranscribeButton error:', err)
      alert(`処理中にエラーが発生しました: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Button onClick={handleProcess} disabled={isProcessing} className="w-full">
      {isProcessing ? '処理中... (数分かかります)' : '文字起こし・暗黙知抽出を開始'}
    </Button>
  )
}
