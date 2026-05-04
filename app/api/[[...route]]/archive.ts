import { Hono } from 'hono'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai'

const archive = new Hono()

// Transcribe interview video using Whisper API
archive.post('/transcribe/:interviewId', async (c) => {
  const interviewId = c.req.param('interviewId')

  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Get interview and verify ownership
  const { data: interview } = await supabase
    .from('interviews')
    .select('*, shops!inner(owner_profile_id)')
    .eq('id', interviewId)
    .maybeSingle()

  if (!interview || interview.shops.owner_profile_id !== user.id) {
    return c.json({ error: 'Not found' }, 404)
  }

  if (interview.transcript) {
    return c.json({ error: 'Already transcribed' }, 400)
  }

  try {
    // Download video from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('interview-videos')
      .download(interview.storage_path)

    if (downloadError || !fileData) {
      return c.json({ error: 'Failed to download video' }, 500)
    }

    // Convert Blob to File for OpenAI API
    const file = new File([fileData], 'video.mp4', { type: fileData.type })

    // Call Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'ja',
    })

    // Save transcript to database
    const { error: updateError } = await supabase
      .from('interviews')
      .update({ transcript: transcription.text })
      .eq('id', interviewId)

    if (updateError) {
      return c.json({ error: 'Failed to save transcript' }, 500)
    }

    return c.json({
      success: true,
      transcript: transcription.text,
    })
  } catch (error) {
    console.error('Transcription error:', error)
    return c.json({ error: 'Transcription failed' }, 500)
  }
})

// Extract tacit knowledge from transcript using GPT-4
archive.post('/extract/:interviewId', async (c) => {
  const interviewId = c.req.param('interviewId')

  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Get interview and verify ownership
  const { data: interview } = await supabase
    .from('interviews')
    .select('*, shops!inner(id, owner_profile_id)')
    .eq('id', interviewId)
    .maybeSingle()

  if (!interview || interview.shops.owner_profile_id !== user.id) {
    return c.json({ error: 'Not found' }, 404)
  }

  if (!interview.transcript) {
    return c.json({ error: 'No transcript available' }, 400)
  }

  try {
    // Define schema for tacit knowledge extraction
    const TacitKnowledgeSchema = z.object({
      tags: z.array(
        z.object({
          situation: z.string().describe('The specific situation or context'),
          judgment: z.string().describe('The judgment or decision made'),
          reason: z.string().describe('The underlying reason or principle'),
        }),
      ),
    })

    // Call GPT-4 for extraction
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `あなたは日本の伝統工芸や旅館経営における「暗黙知」を抽出する専門家です。
インタビューの文字起こしから、店主や職人が無意識に行っている判断基準を「状況→判断→理由」の3層構造で抽出してください。

抽出基準：
- 明示的に語られていなくても、行動パターンから推測できる判断基準
- 「いつも〜している」「必ず〜する」などの習慣的行動
- 特定の状況での対応方法とその背景にある価値観

各タグは以下の形式で構造化してください：
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
      return c.json({ error: 'No response from GPT' }, 500)
    }

    const parsed = JSON.parse(content)
    const validated = TacitKnowledgeSchema.parse(parsed)

    // Save tags to database
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
      return c.json({ error: 'Failed to save tags' }, 500)
    }

    return c.json({
      success: true,
      tags: insertedTags,
    })
  } catch (error) {
    console.error('Extraction error:', error)
    return c.json({ error: 'Extraction failed' }, 500)
  }
})

// Generate embeddings for tacit tags
archive.post('/embed/:tagId', async (c) => {
  const tagId = c.req.param('tagId')

  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Get tag and verify ownership
  const { data: tag } = await supabase
    .from('tacit_tags')
    .select('*, shops!inner(owner_profile_id)')
    .eq('id', tagId)
    .maybeSingle()

  if (!tag || tag.shops.owner_profile_id !== user.id) {
    return c.json({ error: 'Not found' }, 404)
  }

  try {
    // Create combined text for embedding
    const text = `状況: ${tag.situation}\n判断: ${tag.judgment}\n理由: ${tag.reason}`

    // Generate embedding
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    })

    const embedding = embeddingResponse.data[0]?.embedding
    if (!embedding) {
      return c.json({ error: 'Failed to generate embedding' }, 500)
    }

    // Save embedding to database
    const { error: insertError } = await supabase.from('tag_embeddings').insert({
      tag_id: tagId,
      embedding: embedding,
    })

    if (insertError) {
      return c.json({ error: 'Failed to save embedding' }, 500)
    }

    return c.json({
      success: true,
    })
  } catch (error) {
    console.error('Embedding error:', error)
    return c.json({ error: 'Embedding generation failed' }, 500)
  }
})

export default archive
