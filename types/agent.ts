export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  citations?: ChatCitation[]
  audioUrl?: string
}

export type ChatCitation = {
  type: 'tag' | 'interview'
  id: string
  title: string
  excerpt: string
  relevance?: number
  retrieval?: 'vector' | 'recent'
}

export type RAGContext = {
  tags: Array<{
    id: string
    interviewId: string | null
    situation: string
    judgment: string
    reason: string
    similarity: number
    retrieval: 'vector' | 'recent'
  }>
  interviews: Array<{
    id: string
    transcript: string
    createdAt: string
  }>
}

export type ChatRequest = {
  message: string
  shopId: string
}

export type ChatResponse = {
  message: string
  citations: ChatCitation[]
  audioUrl?: string
}
