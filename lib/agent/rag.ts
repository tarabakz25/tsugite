import OpenAI from 'openai'
import { sql } from 'drizzle-orm'
import type { RAGContext } from '@/types/agent'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    encoding_format: 'float',
  })

  return response.data[0].embedding
}

export async function searchSimilarTags(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  embedding: number[],
  shopId: string,
  limit = 5,
): Promise<RAGContext['tags']> {
  // Convert embedding array to pgvector format
  const embeddingStr = `[${embedding.join(',').slice(0, 10000)}]` // Truncate if too long

  // Query using pgvector similarity search
  const result = await db.execute(sql`
    SELECT
      tt.id,
      tt.situation,
      tt.judgment,
      tt.reason,
      1 - (te.embedding <=> ${embeddingStr}::vector) as similarity
    FROM tacit_tags tt
    INNER JOIN tag_embeddings te ON tt.id = te.tag_id
    WHERE tt.shop_id = ${shopId}
    ORDER BY te.embedding <=> ${embeddingStr}::vector
    LIMIT ${limit}
  `)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return result.rows.map((row: any) => ({
    id: row.id,
    situation: row.situation,
    judgment: row.judgment,
    reason: row.reason,
    similarity: row.similarity,
  }))
}

export async function getRelatedInterviews(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  tagIds: string[],
  shopId: string,
): Promise<RAGContext['interviews']> {
  if (tagIds.length === 0) {
    return []
  }

  const result = await db.execute(sql`
    SELECT DISTINCT
      i.id,
      i.transcript,
      i.created_at
    FROM interviews i
    INNER JOIN tacit_tags tt ON i.id = tt.interview_id
    WHERE tt.id = ANY(${tagIds})
      AND i.shop_id = ${shopId}
      AND i.transcript IS NOT NULL
    ORDER BY i.created_at DESC
    LIMIT 3
  `)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return result.rows.map((row: any) => ({
    id: row.id,
    transcript: row.transcript,
    createdAt: row.created_at,
  }))
}

export function buildRAGPrompt(context: RAGContext, _question: string): string {
  const systemPrompt = `あなたは旅館の先代女将です。後継者からの質問に、蓄積された暗黙知と経験をもとに、温かく丁寧に答えてください。

## あなたの役割
- 後継者の質問に対して、先代女将の判断パターンと口調で回答する
- 具体的な状況と判断理由を含めて説明する
- わからないことは正直に「記録にない」と伝える
- 温かく、親しみやすい口調で話す

## 参照可能な暗黙知タグ
${context.tags.map((tag, i) => `${i + 1}. 状況: ${tag.situation}\n   判断: ${tag.judgment}\n   理由: ${tag.reason}`).join('\n\n')}

${context.interviews.length > 0 ? `\n## 関連するインタビュー記録\n${context.interviews.map((interview) => interview.transcript.slice(0, 500)).join('\n\n...\n\n')}` : ''}

## 回答ルール
1. 上記の暗黙知タグとインタビュー記録のみを根拠にして回答する
2. 記録にない内容は推測せず「記録にないですね」と正直に伝える
3. 具体例を交えて、わかりやすく説明する
4. 先代女将らしい温かい言葉遣いで話す`

  return systemPrompt
}
