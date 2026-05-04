'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from 'ai/react'
import Button from '@/components/ui/button'
import Card from '@/components/ui/card'
import type { ChatCitation } from '@/types/agent'

type AgentChatProps = {
  shopId: string
}

export default function AgentChat({ shopId }: AgentChatProps) {
  const [citations, setCitations] = useState<ChatCitation[]>([])
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/agent/chat',
    body: {
      shopId,
    },
    onResponse: (response) => {
      // Extract citations from response headers
      const citationsHeader = response.headers.get('X-Citations')
      if (citationsHeader) {
        try {
          const parsedCitations = JSON.parse(citationsHeader)
          setCitations(parsedCitations)
        } catch (error) {
          console.error('Failed to parse citations:', error)
        }
      }
    },
    onFinish: async (message) => {
      // Generate TTS audio for assistant's response
      if (message.role === 'assistant') {
        try {
          const response = await fetch('/api/agent/tts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: message.content,
            }),
          })

          if (response.ok) {
            const audioBlob = await response.blob()
            const url = URL.createObjectURL(audioBlob)
            setAudioUrl(url)

            // Auto-play audio
            if (audioRef.current) {
              audioRef.current.src = url
              audioRef.current.play()
              setIsPlayingAudio(true)
            }
          }
        } catch (error) {
          console.error('Failed to generate audio:', error)
        }
      }
    },
  })

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handlePlayAudio = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play()
      setIsPlayingAudio(true)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlayingAudio(false)}
        onPause={() => setIsPlayingAudio(false)}
      />

      {/* Messages area */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-center">
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-ink">先代女将に相談できます</h3>
              <p className="text-sm text-ink/60">
                困ったことや判断に迷うことがあれば、お気軽にご質問ください。
              </p>
              <div className="mt-4 space-y-2 text-left">
                <p className="text-xs font-medium text-ink/60">サンプル質問:</p>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      handleInputChange({
                        target: { value: '常連の田中様が来られた時の対応は？' },
                      } as React.ChangeEvent<HTMLTextAreaElement>)
                    }}
                    className="block w-full rounded border border-ink/10 p-2 text-left text-xs text-ink/80 hover:bg-washi/50"
                  >
                    • 常連の田中様が来られた時の対応は？
                  </button>
                  <button
                    onClick={() => {
                      handleInputChange({
                        target: { value: '季節の挨拶で気をつけることは？' },
                      } as React.ChangeEvent<HTMLTextAreaElement>)
                    }}
                    className="block w-full rounded border border-ink/10 p-2 text-left text-xs text-ink/80 hover:bg-washi/50"
                  >
                    • 季節の挨拶で気をつけることは？
                  </button>
                  <button
                    onClick={() => {
                      handleInputChange({
                        target: { value: 'お茶の温度はどのくらいが適切？' },
                      } as React.ChangeEvent<HTMLTextAreaElement>)
                    }}
                    className="block w-full rounded border border-ink/10 p-2 text-left text-xs text-ink/80 hover:bg-washi/50"
                  >
                    • お茶の温度はどのくらいが適切？
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <Card
              className={`max-w-[80%] p-4 ${
                message.role === 'user' ? 'bg-shu/10 text-ink' : 'bg-washi text-ink'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm">{message.content}</div>
              {message.role === 'assistant' &&
                audioUrl &&
                messages[messages.length - 1].id === message.id && (
                  <div className="mt-2">
                    <button
                      onClick={handlePlayAudio}
                      disabled={isPlayingAudio}
                      className="text-xs text-shu hover:underline disabled:opacity-50"
                    >
                      {isPlayingAudio ? '再生中...' : '🔊 音声で聞く'}
                    </button>
                  </div>
                )}
            </Card>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start">
            <Card className="max-w-[80%] bg-washi p-4 text-ink">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-ink/60"></div>
                <div className="h-2 w-2 animate-pulse rounded-full bg-ink/60 [animation-delay:0.2s]"></div>
                <div className="h-2 w-2 animate-pulse rounded-full bg-ink/60 [animation-delay:0.4s]"></div>
              </div>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Citations area */}
      {citations.length > 0 && messages[messages.length - 1]?.role === 'assistant' && (
        <div className="border-t border-ink/10 bg-washi/50 p-4">
          <div className="text-xs font-medium text-ink/60">参照した記録:</div>
          <div className="mt-2 space-y-1">
            {citations.map((citation, idx) => (
              <div key={idx} className="text-xs text-ink/80">
                • {citation.title}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <form onSubmit={handleSubmit} className="border-t border-ink/10 p-4">
        <div className="flex space-x-2">
          <textarea
            value={input}
            onChange={handleInputChange}
            placeholder="質問を入力してください..."
            className="flex-1 resize-none rounded-md border border-washi-3 bg-white px-3 py-2 text-base text-ink shadow-xs transition-colors placeholder:text-ink-4 hover:border-ink-4 focus:border-shu focus:outline-2 focus:outline-offset-2 focus:outline-shu disabled:cursor-not-allowed disabled:bg-washi disabled:text-ink-4"
            rows={3}
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            送信
          </Button>
        </div>
      </form>
    </div>
  )
}
