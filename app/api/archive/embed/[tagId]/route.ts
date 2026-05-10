import type { NextRequest } from 'next/server'

import { getSessionUser } from '@/lib/api/auth'
import { jsonError } from '@/lib/api/http'
import { buildTagEmbeddingText } from '@/lib/agent/rag'
import { openai } from '@/lib/openai'

export const runtime = 'nodejs'

export async function POST(_request: NextRequest, ctx: RouteContext<'/api/archive/embed/[tagId]'>) {
  const { tagId } = await ctx.params

  const { supabase, user } = await getSessionUser()
  if (!user) {
    return jsonError('Unauthorized', 401)
  }

  const { data: tag } = await supabase
    .from('tacit_tags')
    .select('*, shops!inner(owner_profile_id)')
    .eq('id', tagId)
    .maybeSingle()

  if (!tag || tag.shops.owner_profile_id !== user.id) {
    return jsonError('Not found', 404)
  }

  try {
    const text = buildTagEmbeddingText(tag)

    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    })

    const embedding = embeddingResponse.data[0]?.embedding
    if (!embedding) {
      return jsonError('Failed to generate embedding', 500)
    }

    const { error: insertError } = await supabase.from('tag_embeddings').insert({
      tag_id: tagId,
      embedding,
    })

    if (insertError) {
      console.error('Embedding insert error:', insertError)
      return jsonError(`Failed to save embedding: ${insertError.message}`, 500)
    }

    return Response.json({
      success: true,
    })
  } catch (error) {
    console.error('Embedding error:', error)
    return jsonError(
      `Embedding generation failed: ${error instanceof Error ? error.message : String(error)}`,
      500,
    )
  }
}
