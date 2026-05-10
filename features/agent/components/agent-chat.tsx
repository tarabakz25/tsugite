'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { Mic, MicOff, SendHorizontal } from 'lucide-react'
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

type SpeechRecoResultRow = SpeechRecoAlternative[] & {
  readonly length: number
  item(index: number): SpeechRecoAlternative
}

type SpeechRecoAlternative = {
  readonly transcript: string
}

/** DOM の Web Speech が TS DOM lib に無い構成向け最小型 */
type WebSpeechRecognition = {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: SpeechResultEvent) => void) | null
  onerror: ((event: SpeechErrorLike) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}

type SpeechResultEvent = Event & {
  readonly results: SpeechRecoResultRow[]
}

type SpeechErrorLike = Event & {
  readonly error?: string
}

type WebSpeechRecognitionCtor = new () => WebSpeechRecognition

function resolveSpeechRecognition(): WebSpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  type WithWebkitSpeech = Window &
    typeof globalThis & {
      webkitSpeechRecognition?: WebSpeechRecognitionCtor
      SpeechRecognition?: WebSpeechRecognitionCtor
    }
  const w = window as WithWebkitSpeech
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export default function AgentChat({ shopId }: AgentChatProps) {
  const [input, setInput] = useState('')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [speechSupported] = useState(() => !!resolveSpeechRecognition())
  const [speechListening, setSpeechListening] = useState(false)
  const recognitionRef = useRef<WebSpeechRecognition | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const stopSpeechRecognition = useCallback(() => {
    try {
      recognitionRef.current?.stop()
    } catch {
      /** ignore — already stopped */
    }
    recognitionRef.current = null
    setSpeechListening(false)
  }, [])

  useEffect(() => () => stopSpeechRecognition(), [stopSpeechRecognition])

  const toggleSpeechRecognition = useCallback(() => {
    const Ctor = resolveSpeechRecognition()
    if (!Ctor) return

    if (speechListening) {
      stopSpeechRecognition()
      return
    }

    const recognition = new Ctor()
    recognition.lang = 'ja-JP'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      const row = event.results[event.results.length - 1]
      const transcript =
        typeof row.item === 'function' ? row.item(0).transcript : row[0]?.transcript
      const trimmed = transcript?.trim()
      if (trimmed) {
        setInput((prev) => (prev.trim().length > 0 ? `${prev.trim()} ${trimmed}` : trimmed))
      }
    }

    recognition.onerror = (event) => {
      console.error('speech recognition:', event.error ?? 'unknown')
      stopSpeechRecognition()
    }

    recognition.onend = () => stopSpeechRecognition()

    try {
      recognition.start()
      recognitionRef.current = recognition
      setSpeechListening(true)
    } catch (error) {
      console.error('failed to start speech recognition', error)
    }
  }, [speechListening, stopSpeechRecognition])

  const { error, messages, sendMessage, status } = useChat<AgentChatMessage>({
    transport: new DefaultChatTransport<AgentChatMessage>({
      api: '/api/agent/chat',
      body: { shopId },
    }),
    onFinish: async ({ message }) => {
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

            if (audioRef.current) {
              audioRef.current.src = url
              void audioRef.current.play()
              setIsPlayingAudio(true)
            }
          }
        } catch (fetchError) {
          console.error('Failed to generate audio:', fetchError)
        }
      }
    },
  })

  const isLoading = status === 'submitted' || status === 'streaming'

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
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--washi)]">
      <audio
        ref={audioRef}
        onEnded={() => setIsPlayingAudio(false)}
        onPause={() => setIsPlayingAudio(false)}
      />

      <div className="flex-1 overflow-y-auto pb-4">
        <PageContainer maxWidth="2xl" className="space-y-8 py-6 sm:py-8">
          {messages.length === 0 && (
            <div className="flex flex-col items-center px-3 py-8 text-center sm:py-12">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-shu/15 text-5xl shadow-inner shadow-shu/10">
                <span aria-hidden>👵</span>
              </div>
              <h3 className="mb-3 text-[1.375rem] font-bold text-ink">
                先代の判断をひきだすチャットです
              </h3>
              <p className="mb-10 max-w-md text-base leading-relaxed text-ink-2">
                迷ったときの言い換えや、暗黙知に近いヒントが得られます。屋外や移動中は音声入力のアイコンをご利用ください。
              </p>

              <div className="w-full space-y-3">
                <p className="ml-1 text-xs font-semibold uppercase tracking-[0.3em] text-ink-3">
                  はじめる質問
                </p>
                <div className="mx-auto grid w-full gap-3">
                  {[
                    '常連の田中様が来られたときのひとことは？',
                    '季節の挨拶で気をつけていることは？',
                    '仕込み優先順位が割り込んだときどうしていた？',
                  ].map((q) => (
                    <button
                      key={q}
                      type="button"
                      className="min-h-[54px] rounded-2xl border border-washi-3 bg-white p-5 text-left text-base font-medium text-ink shadow-sm transition-colors hover:border-shu/35 hover:bg-shu/10"
                      onClick={() => setInput(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => {
            const isAssistant = message.role === 'assistant'
            const citations = isAssistant ? getMessageCitations(message) : []

            const bubble = (
              <div
                className={cn(
                  'max-w-[94%] rounded-3xl px-5 py-4 shadow-sm ring-1 sm:max-w-[85%]',
                  message.role === 'user'
                    ? 'rounded-br-md bg-shu text-white ring-shu'
                    : 'rounded-bl-md bg-white text-ink ring-washi-3',
                )}
              >
                <div className="whitespace-pre-wrap text-[1rem] leading-[1.7] tracking-tight md:text-[0.965rem]">
                  {message.parts.map((part, index) =>
                    part.type === 'text' ? (
                      <span key={`${message.id}-${index}`}>{part.text}</span>
                    ) : null,
                  )}
                </div>
                {message.role === 'assistant' &&
                  audioUrl &&
                  messages[messages.length - 1].id === message.id && (
                    <div className="mt-4 border-t border-washi-3 pt-3">
                      <button
                        type="button"
                        onClick={() => handlePlayAudio()}
                        disabled={isPlayingAudio}
                        className="flex min-h-11 flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide text-shu underline-offset-4 hover:text-shu-2 hover:underline disabled:pointer-events-none disabled:opacity-50"
                      >
                        {isPlayingAudio ? (
                          <span className="flex items-center gap-2 text-sm normal-case tracking-normal">
                            <span aria-hidden className="flex gap-0.5">
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-shu" />
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-shu [animation-delay:160ms]" />
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-shu [animation-delay:260ms]" />
                            </span>
                            音声を再生しています…
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 normal-case tracking-normal">
                            🔊{' '}
                            <span className="text-sm font-semibold text-shu underline decoration-dashed">
                              音声で聞く
                            </span>
                          </span>
                        )}
                      </button>
                    </div>
                  )}
              </div>
            )

            return (
              <article
                key={message.id}
                className={cn(
                  'flex max-w-[min(100%,42rem)] flex-col gap-3',
                  message.role === 'user' ? 'self-end items-end' : 'self-start items-start',
                )}
              >
                {bubble}
                {isAssistant && citations.length > 0 ? (
                  <div className="w-full rounded-3xl bg-white px-5 py-4 text-left shadow-inner ring-1 ring-washi-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-3">
                      Archive 由来のヒント（引用）
                    </p>
                    <div className="mt-3 space-y-3">
                      {citations.map((citation) => (
                        <div
                          key={citation.id}
                          className="rounded-2xl border border-washi-3 bg-washi px-4 py-3 text-sm shadow-sm"
                        >
                          <div className="flex items-center gap-2">
                            <p className="min-w-0 flex-1 text-sm font-semibold text-ink">
                              {citation.title}
                            </p>
                            <Badge tone={citation.retrieval === 'vector' ? 'success' : 'neutral'}>
                              {citation.retrieval === 'vector' ? '類似' : '最新'}
                            </Badge>
                          </div>
                          <p className="mt-2 text-[0.938rem] leading-relaxed text-ink-2">
                            {citation.excerpt}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            )
          })}

          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex justify-start">
              <div className="rounded-3xl rounded-bl-md border border-washi-3 bg-white px-6 py-4 shadow-md">
                <div className="flex items-center space-x-1.5 py-2">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-ink/35" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-ink/35 [animation-delay:0.2s]" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-ink/35 [animation-delay:0.35s]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-2 sm:h-4" />
        </PageContainer>
      </div>

      {error ? (
        <div className="border-t border-danger/30 bg-danger-bg px-4 py-4 text-[0.938rem] text-danger">
          Agent の応答生成に失敗しました。ログイン状態とアクセス権を確認してください。
        </div>
      ) : null}

      <div className="border-t border-washi-3 bg-paper-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur">
        <PageContainer maxWidth="2xl" className="">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              const text = input.trim()
              if (!text) return
              sendMessage({ text })
              setInput('')
            }}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center gap-3 rounded-[14px] border border-washi-3 bg-white px-4 py-3">
              {speechSupported ? (
                <button
                  aria-pressed={speechListening}
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-lg border transition-colors',
                    speechListening
                      ? 'border-danger bg-danger text-white'
                      : 'border-washi-3 bg-transparent text-ink-3 hover:bg-washi',
                  )}
                  type="button"
                  onClick={() => toggleSpeechRecognition()}
                  disabled={isLoading}
                >
                  {speechListening ? (
                    <MicOff aria-hidden className="size-[18px]" />
                  ) : (
                    <Mic aria-hidden className="size-[18px]" />
                  )}
                  <span className="sr-only">
                    {speechListening ? '音声入力を終了します' : '音声入力'}
                  </span>
                </button>
              ) : null}
              <input
                aria-label="相談内容"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="佐藤さんに聞いてみたいことを書いてみてください…"
                className="min-w-0 flex-1 border-none bg-transparent text-sm text-ink outline-none placeholder:text-ink-3"
                disabled={isLoading}
                onKeyDown={(keydownEvent) => {
                  if (keydownEvent.key === 'Enter' && !keydownEvent.shiftKey) {
                    keydownEvent.preventDefault()
                    const trimmed = input.trim()
                    if (trimmed && !isLoading) {
                      sendMessage({ text: trimmed })
                      setInput('')
                    }
                  }
                }}
              />
              <Button
                aria-label="送信"
                type="submit"
                disabled={isLoading || !input.trim()}
                className="h-9 gap-1.5 rounded-lg px-4 text-sm"
                size="sm"
              >
                聞く
                <SendHorizontal aria-hidden className="size-3.5 shrink-0" />
              </Button>
            </div>
            <div className="flex flex-wrap items-start justify-between gap-2 px-1 text-[11px] text-ink-3">
              {!speechSupported ? (
                <p>この環境ではブラウザ音声入力が使えません。</p>
              ) : speechListening ? (
                <p className="flex items-center gap-2 font-semibold text-shu">
                  <span
                    aria-hidden
                    className="inline-flex size-1.5 animate-pulse rounded-full bg-shu"
                  />
                  聞き取り中です。話してください。
                </p>
              ) : (
                <p className="text-ink-3">マイクから話しかけると自動で入力欄に転記されます。</p>
              )}
              <p>Shift + Enter で改行</p>
            </div>
          </form>
        </PageContainer>
      </div>
    </div>
  )
}
