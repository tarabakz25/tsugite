'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { cn } from '@/lib/cn'
import Button from '@/components/ui/button'
import Badge from '@/components/ui/badge'
import PageContainer from '@/components/layout/page-container'
import type { ChatCitation } from '@/types/agent'

type AgentChatProps = {
  shopId: string
}

type AgentChatMessage = UIMessage<unknown, { citations: ChatCitation[] }>

function getMessageCitations(message: AgentChatMessage): ChatCitation[] {
  return message.parts.find((part) => part.type === 'data-citations')?.data ?? []
}

export default function AgentChat({ shopId }: AgentChatProps) {
  const [input, setInput] = useState('')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const { error, messages, sendMessage, status } = useChat<AgentChatMessage>({
    transport: new DefaultChatTransport<AgentChatMessage>({
      api: '/api/agent/chat',
      body: { shopId },
    }),
    onFinish: async ({ message }) => {
      // Generate TTS audio for assistant's response
      if (message.role === 'assistant') {
        const text = message.parts
          .filter((part) => part.type === 'text')
          .map((part) => part.text)
          .join('')

        if (!text) return

        try {
          const response = await fetch('/api/agent/tts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text,
            }),
          })

          if (response.ok) {
            const audioBlob = await response.blob()
            const url = URL.createObjectURL(audioBlob)
            setAudioUrl(url)

            // Auto-play audio
            if (audioRef.current) {
              audioRef.current.src = url
              void audioRef.current.play()
              setIsPlayingAudio(true)
            }
          }
        } catch (error) {
          console.error('Failed to generate audio:', error)
        }
      }
    },
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handlePlayAudio = () => {
    if (audioRef.current && audioUrl) {
      void audioRef.current.play()
      setIsPlayingAudio(true)
    }
  }

  return (
    <div className="flex h-full flex-col bg-washi-2">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlayingAudio(false)}
        onPause={() => setIsPlayingAudio(false)}
      />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <PageContainer maxWidth="2xl" className="py-8 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <div className="h-16 w-16 rounded-full bg-shu/10 flex items-center justify-center mb-6">
                <span className="text-3xl">👵</span>
              </div>
              <h3 className="text-xl font-bold text-ink mb-2">先代女将に相談できます</h3>
              <p className="text-sm text-ink-3 max-w-sm mb-8">
                困ったことや判断に迷うことがあれば、お気軽にご質問ください。
              </p>

              <div className="w-full space-y-3">
                <p className="text-xs font-bold text-ink-4 uppercase tracking-widest text-left ml-1">
                  よくある質問
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    '常連の田中様が来られた時の対応は？',
                    '季節の挨拶で気をつけることは？',
                    'お茶の温度はどのくらいが適切？',
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="text-left p-4 rounded-xl border border-washi-3 bg-white text-sm text-ink hover:border-shu/30 hover:bg-shu/5 transition-all shadow-sm"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl p-4 shadow-sm',
                  message.role === 'user'
                    ? 'bg-shu text-white rounded-tr-none'
                    : 'bg-white text-ink border border-washi-3 rounded-tl-none',
                )}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.parts.map((part, index) =>
                    part.type === 'text' ? <span key={index}>{part.text}</span> : null,
                  )}
                </div>
                {message.role === 'assistant' &&
                  audioUrl &&
                  messages[messages.length - 1].id === message.id && (
                    <div className="mt-3 pt-3 border-t border-washi-3">
                      <button
                        onClick={handlePlayAudio}
                        disabled={isPlayingAudio}
                        className="flex items-center gap-2 text-xs font-bold text-shu hover:opacity-80 disabled:opacity-50 transition-all"
                      >
                        {isPlayingAudio ? (
                          <span className="flex items-center gap-1">
                            <span className="h-1 w-1 bg-shu animate-bounce"></span>
                            <span className="h-1 w-1 bg-shu animate-bounce [animation-delay:0.2s]"></span>
                            再生中...
                          </span>
                        ) : (
                          '🔊 音声で聞く'
                        )}
                      </button>
                    </div>
                  )}
              </div>
              {message.role === 'assistant' && getMessageCitations(message).length > 0 && (
                <div className="mt-4 border-t border-ink/10 pt-3">
                  <div className="text-xs font-medium text-ink/60">参照した暗黙知タグ</div>
                  <div className="mt-2 space-y-2">
                    {getMessageCitations(message).map((citation) => (
                      <div
                        key={citation.id}
                        className="rounded-md border border-washi-3 bg-white p-2"
                      >
                        <div className="flex items-center gap-2">
                          <p className="min-w-0 flex-1 truncate text-xs font-semibold text-ink">
                            {citation.title}
                          </p>
                          <Badge tone={citation.retrieval === 'vector' ? 'success' : 'neutral'}>
                            {citation.retrieval === 'vector' ? '類似' : '最近'}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-ink/70">{citation.excerpt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex justify-start">
              <div className="bg-white border border-washi-3 rounded-2xl rounded-tl-none p-4 shadow-sm">
                <div className="flex items-center space-x-1.5">
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink/30"></div>
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink/30 [animation-delay:0.2s]"></div>
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink/30 [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-4" />
        </PageContainer>
      </div>

      {error && (
        <div className="border-t border-danger/20 bg-danger-bg px-4 py-3 text-sm text-danger">
          Agent の応答生成に失敗しました。ログイン状態と店舗へのアクセス権を確認してください。
        </div>
      )}

      {/* Input area */}
      <div className="bg-washi-2/80 backdrop-blur-md border-t border-washi-3 pb-6">
        <PageContainer maxWidth="2xl" className="py-4">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              if (!input.trim()) return
              sendMessage({ text: input })
              setInput('')
            }}
            className="relative flex items-end gap-2"
          >
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="質問を入力してください..."
              className="flex-1 min-h-[56px] max-h-[200px] resize-none rounded-2xl border border-washi-3 bg-white pl-4 pr-12 py-4 text-sm text-ink shadow-sm transition-all placeholder:text-ink-4 focus:border-shu focus:ring-4 focus:ring-shu/5 focus:outline-none disabled:bg-washi-3"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  if (input.trim() && !isLoading) {
                    sendMessage({ text: input })
                    setInput('')
                  }
                }
              }}
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 bottom-2 h-10 w-10 rounded-xl p-0 flex items-center justify-center shadow-lg shadow-shu/20"
            >
              <span className="text-xl leading-none">↑</span>
            </Button>
          </form>
          <p className="text-[10px] text-center text-ink-4 mt-2">Shift + Enter で改行できます</p>
        </PageContainer>
      </div>
    </div>
  )
}
