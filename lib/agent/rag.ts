import type { SupabaseClient } from '@supabase/supabase-js'
import type { RAGContext } from '@/types/agent'
import { openai } from '@/lib/openai'

const DEFAULT_TAG_LIMIT = 5
const RELATED_INTERVIEW_LIMIT = 3

export function buildTagEmbeddingText(tag: {
  situation: string
  judgment: string
  reason: string
}): string {
  return `状況: ${tag.situation}\n判断: ${tag.judgment}\n理由: ${tag.reason}`
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    encoding_format: 'float',
  })

  return response.data[0].embedding
}

export async function searchSimilarTags(
  supabase: SupabaseClient,
  embedding: number[],
  shopId: string,
  limit = DEFAULT_TAG_LIMIT,
): Promise<RAGContext['tags']> {
  const { data, error } = await supabase.rpc('match_tacit_tags_for_agent', {
    match_count: limit,
    query_embedding: embedding,
    target_shop_id: shopId,
  })

  if (error) {
    console.warn('Agent vector search skipped:', error.message)
    return []
  }

  const rows = (data ?? []) as {
    id: string
    interview_id: string | null
    situation: string
    judgment: string
    reason: string
    similarity: number
  }[]

  return rows.map((row) => ({
    id: row.id,
    interviewId: row.interview_id,
    situation: row.situation,
    judgment: row.judgment,
    reason: row.reason,
    similarity: row.similarity,
    retrieval: 'vector',
  }))
}

export async function getRecentTacitTags(
  supabase: SupabaseClient,
  shopId: string,
  excludeTagIds: string[],
  limit: number,
): Promise<RAGContext['tags']> {
  if (limit <= 0) {
    return []
  }

  const readLimit = Math.max(limit + excludeTagIds.length, limit)
  const { data, error } = await supabase
    .from('tacit_tags')
    .select('id, interview_id, situation, judgment, reason')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })
    .limit(readLimit)

  if (error) {
    console.error('Agent recent tag search error:', error)
    return []
  }

  const excluded = new Set(excludeTagIds)
  const rows = (data ?? []).filter((row) => !excluded.has(row.id)).slice(0, limit) as {
    id: string
    interview_id: string | null
    situation: string
    judgment: string
    reason: string
  }[]

  return rows.map((row) => ({
    id: row.id,
    interviewId: row.interview_id,
    situation: row.situation,
    judgment: row.judgment,
    reason: row.reason,
    similarity: 0,
    retrieval: 'recent',
  }))
}

export async function getRelatedInterviews(
  supabase: SupabaseClient,
  tagIds: string[],
  shopId: string,
): Promise<RAGContext['interviews']> {
  if (tagIds.length === 0) {
    return []
  }

  const { data: tagRows, error: tagError } = await supabase
    .from('tacit_tags')
    .select('interview_id')
    .eq('shop_id', shopId)
    .in('id', tagIds)

  if (tagError) {
    console.error('Agent related tag lookup error:', tagError)
    return []
  }

  const interviewIds = Array.from(
    new Set(
      (tagRows ?? []).map((row) => row.interview_id).filter((id): id is string => Boolean(id)),
    ),
  )

  if (interviewIds.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from('interviews')
    .select('id, transcript, created_at')
    .eq('shop_id', shopId)
    .in('id', interviewIds)
    .not('transcript', 'is', null)
    .order('created_at', { ascending: false })
    .limit(RELATED_INTERVIEW_LIMIT)

  if (error) {
    console.error('Agent related interview lookup error:', error)
    return []
  }

  const rows = (data ?? []) as {
    id: string
    transcript: string
    created_at: string
  }[]

  return rows.map((row) => ({
    id: row.id,
    transcript: row.transcript,
    createdAt: row.created_at,
  }))
}

export async function getRAGContext(
  supabase: SupabaseClient,
  question: string,
  shopId: string,
  limit = DEFAULT_TAG_LIMIT,
): Promise<RAGContext> {
  const embedding = await generateEmbedding(question)
  const vectorTags = await searchSimilarTags(supabase, embedding, shopId, limit)
  const fallbackTags = await getRecentTacitTags(
    supabase,
    shopId,
    vectorTags.map((tag) => tag.id),
    Math.max(limit - vectorTags.length, 0),
  )
  const tags = [...vectorTags, ...fallbackTags].slice(0, limit)
  const interviews = await getRelatedInterviews(
    supabase,
    tags.map((tag) => tag.id),
    shopId,
  )

  return { tags, interviews }
}

export function buildRAGPrompt(context: RAGContext, question: string): string {
  const tagsText =
    context.tags.length > 0
      ? context.tags
          .map(
            (tag, i) =>
              `${i + 1}. 状況: ${tag.situation}\n   判断: ${tag.judgment}\n   理由: ${tag.reason}\n   取得方法: ${
                tag.retrieval === 'vector' ? '質問との類似検索' : '最近の記録'
              }`,
          )
          .join('\n\n')
      : '参照可能な暗黙知タグはありません。'

  const interviewsText =
    context.interviews.length > 0
      ? `\n## 関連するインタビュー記録\n${context.interviews
          .map((interview) => interview.transcript.slice(0, 500))
          .join('\n\n...\n\n')}`
      : ''

  const systemPrompt = `あなたは先代店主の判断を伝えるTSUGITEのAgentです。後継者や店主からの質問に、蓄積された暗黙知タグとインタビュー記録を根拠にして、温かく具体的に答えてください。

## あなたの役割
- 質問に対して、先代店主の判断パターンと口調で回答する
- 参照した暗黙知タグの「状況」「判断」「理由」を必ず根拠として扱う
- 記録にないことは推測せず、「記録にないですね」と正直に伝える
- 温かく、親しみやすい口調で話す

## ユーザーの質問
${question}

## 参照可能な暗黙知タグ
${tagsText}
${interviewsText}

## 回答ルール
1. 上記の暗黙知タグとインタビュー記録のみを根拠にして回答する
2. 記録にない内容は推測せず「記録にないですね」と正直に伝える
3. 関連する暗黙知タグがある場合は、どの状況・判断・理由に基づく答えなのかを本文で自然に示す
4. 参照可能な暗黙知タグがない場合は、回答を作らず、Archiveに記録を追加すると答えられることを短く伝える
5. 返答は日本語で、3〜6文を目安に簡潔にまとめる`

  return systemPrompt
}
