import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  type UIMessage,
} from 'ai'
import { openai as aiOpenAI } from '@ai-sdk/openai'
import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { canAccessAgentShop } from '@/lib/api/agent-access'
import { getSessionUser } from '@/lib/api/auth'
import { jsonError, parseJsonBody } from '@/lib/api/http'
import { buildRAGPrompt, getRAGContext } from '@/lib/agent/rag'
import type { ChatCitation } from '@/types/agent'

export const runtime = 'nodejs'

const chatSchema = z.object({
  messages: z.array(z.unknown()),
  shopId: z.string().uuid(),
})

type AgentChatMessage = UIMessage<unknown, { citations: ChatCitation[] }>

function getMessageText(message: UIMessage | undefined): string {
  return (
    message?.parts
      ?.filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join('') ?? ''
  ).trim()
}

function createTagCitations(
  tags: Awaited<ReturnType<typeof getRAGContext>>['tags'],
): ChatCitation[] {
  return tags.map((tag) => ({
    type: 'tag',
    id: tag.id,
    title: tag.situation,
    excerpt: `${tag.judgment} - ${tag.reason}`,
    relevance: tag.similarity,
    retrieval: tag.retrieval,
  }))
}

export async function POST(request: NextRequest) {
  const parsed = await parseJsonBody(request, chatSchema)
  if (!parsed.ok) {
    return parsed.response
  }

  const { messages, shopId } = parsed.data
  const uiMessages = messages as UIMessage[]
  const latestMessage = uiMessages[uiMessages.length - 1]
  const messageText = getMessageText(latestMessage)

  if (!messageText) {
    return jsonError('Message is required', 400)
  }

  const { supabase, user } = await getSessionUser()
  if (!user) {
    return jsonError('Unauthorized', 401)
  }

  if (!(await canAccessAgentShop(supabase, user.id, shopId))) {
    return jsonError('Forbidden', 403)
  }

  if (!process.env.OPENAI_API_KEY) {
    return jsonError('OpenAI API key not configured', 500)
  }

  try {
    const ragContext = await getRAGContext(supabase, messageText, shopId)
    const systemPrompt = buildRAGPrompt(ragContext, messageText)
    const citations = createTagCitations(ragContext.tags)

    const result = streamText({
      model: aiOpenAI('gpt-4o'),
      system: systemPrompt,
      messages: await convertToModelMessages(uiMessages),
      temperature: 0.7,
      maxOutputTokens: 800,
    })

    const stream = createUIMessageStream<AgentChatMessage>({
      originalMessages: uiMessages as AgentChatMessage[],
      execute({ writer }) {
        writer.write({
          type: 'data-citations',
          data: citations,
        })
        writer.merge(result.toUIMessageStream<AgentChatMessage>())
      },
    })

    return createUIMessageStreamResponse({ stream })
  } catch (error) {
    console.error('Chat error:', error)
    return jsonError('Failed to generate response', 500)
  }
}
