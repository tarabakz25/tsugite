import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { getSessionUser } from '@/lib/api/auth'
import { jsonError } from '@/lib/api/http'
import { openai } from '@/lib/openai'

export const runtime = 'nodejs'
export const maxDuration = 300

const TacitKnowledgeSchema = z.object({
  tags: z.array(
    z.object({
      situation: z.string().describe('The specific situation or context'),
      judgment: z.string().describe('The judgment or decision made'),
      reason: z.string().describe('The underlying reason or principle'),
    }),
  ),
})

export async function POST(
  _request: NextRequest,
  ctx: RouteContext<'/api/archive/extract/[interviewId]'>,
) {
  const { interviewId } = await ctx.params

  const { supabase, user } = await getSessionUser()
  if (!user) {
    return jsonError('Unauthorized', 401)
  }

  const { data: interview } = await supabase
    .from('interviews')
    .select('*, shops!inner(id, owner_profile_id)')
    .eq('id', interviewId)
    .maybeSingle()

  if (!interview || interview.shops.owner_profile_id !== user.id) {
    return jsonError('Not found', 404)
  }

  if (!interview.transcript) {
    return jsonError('No transcript available', 400)
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `あなたは日本の伝統工芸や旅館経営における「暗黙知」を抽出する専門家です。
インタビューの文字起こしから、店主や職人が無意識に行っている判断基準を「状況→判断→理由」の3層構造で抽出してください。

抽出基準：
- 明示的に語られていなくても、行動パターンから推測できる判断基準
- 「いつも〜している」「必ず〜する」などの習慣的行動
- 特定の状況での対応方法とその背景にある価値観

結果は必ず以下のJSON形式で返してください：
{"tags": [{"situation": "...", "judgment": "...", "reason": "..."}]}

各タグのフィールド：
- situation: 具体的な状況や文脈（「〜のとき」「〜の場合」）
- judgment: その状況でとる判断や行動
- reason: なぜそうするのか、背景にある理由や価値観`,
        },
        {
          role: 'user',
          content: `以下のインタビュー文字起こしから暗黙知を抽出してください：\n\n${interview.transcript}`,
        },
      ],
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      return jsonError('No response from GPT', 500)
    }

    const parsed = JSON.parse(content) as unknown
    const validated = TacitKnowledgeSchema.parse(parsed)

    const tagsToInsert = validated.tags.map((tag) => ({
      shop_id: interview.shops.id,
      interview_id: interviewId,
      situation: tag.situation,
      judgment: tag.judgment,
      reason: tag.reason,
      is_inferred: true,
    }))

    const { data: insertedTags, error: insertError } = await supabase
      .from('tacit_tags')
      .insert(tagsToInsert)
      .select()

    if (insertError) {
      console.error('DB insert error:', insertError)
      return jsonError(`Failed to save tags: ${insertError.message}`, 500)
    }

    return Response.json({
      success: true,
      tags: insertedTags,
    })
  } catch (error) {
    console.error('Extraction error:', error)
    return jsonError(
      `Extraction failed: ${error instanceof Error ? error.message : String(error)}`,
      500,
    )
  }
}
