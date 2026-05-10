'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import OpenAI from 'openai'
import { z } from 'zod'

import { parseUserRole } from '@/lib/roles'
import { ensureShopForProfile } from '@/lib/shops'
import { createClient } from '@/lib/supabase/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'missing-openai-api-key',
})

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const GuideSceneDraftSchema = z.object({
  sceneName: z.string().min(1).max(120),
  season: z.string().max(40).nullable().optional(),
  correctState: z.record(z.string(), z.unknown()),
})

export type SaveObservationLogInput = {
  shopId: string
  sceneId: string | null
  visionResult: Record<string, unknown>
  llmFeedback: string | null
}

export type CreateReferenceSceneError =
  | 'not_authenticated'
  | 'role_mismatch'
  | 'no_shop'
  | 'required'
  | 'too_long'
  | 'invalid_json'
  | 'invalid_state'
  | 'db_error'

export type CreateReferenceSceneState = {
  error?: CreateReferenceSceneError
}

export type CreateReferenceSceneFromTagResult =
  | { ok: true; sceneId: string; created: boolean }
  | {
      ok: false
      error:
        | 'not_authenticated'
        | 'role_mismatch'
        | 'no_shop'
        | 'not_found'
        | 'ai_not_configured'
        | 'invalid_generation'
        | 'db_error'
    }

export type DeleteReferenceSceneResult =
  | { ok: true }
  | {
      ok: false
      error: 'not_authenticated' | 'role_mismatch' | 'no_shop' | 'not_found' | 'db_error'
    }

async function getCurrentGuideShop() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'not_authenticated' as const, shop: null, supabase }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, shop_profile')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile) {
    return { error: 'not_authenticated' as const, shop: null, supabase }
  }

  if (parseUserRole(profile) !== 'shop') {
    return { error: 'role_mismatch' as const, shop: null, supabase }
  }

  const shop = await ensureShopForProfile(supabase, user.id, profile.shop_profile)
  if (!shop) return { error: 'no_shop' as const, shop: null, supabase }

  return { error: null, shop, supabase }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseCorrectState(input: string): Record<string, unknown> | CreateReferenceSceneError {
  let parsed: unknown
  try {
    parsed = JSON.parse(input)
  } catch {
    return 'invalid_json'
  }

  if (!isRecord(parsed) || Object.keys(parsed).length === 0) {
    return 'invalid_state'
  }

  return parsed
}

export async function createReferenceScene(
  prev: CreateReferenceSceneState,
  formData: FormData,
): Promise<CreateReferenceSceneState> {
  void prev

  const sceneName = String(formData.get('sceneName') ?? '').trim()
  const season = String(formData.get('season') ?? '').trim()
  const correctStateText = String(formData.get('correctState') ?? '').trim()

  if (!sceneName || !correctStateText) {
    return { error: 'required' }
  }

  if (sceneName.length > 120 || season.length > 40 || correctStateText.length > 4000) {
    return { error: 'too_long' }
  }

  const correctState = parseCorrectState(correctStateText)
  if (typeof correctState === 'string') {
    return { error: correctState }
  }

  const { error, shop, supabase } = await getCurrentGuideShop()
  if (error === 'not_authenticated') redirect('/login?returnTo=/shop/guide/scenes/new')
  if (error) return { error }
  if (!shop) return { error: 'no_shop' }

  const { error: insertError } = await supabase.from('reference_scenes').insert({
    shop_id: shop.id,
    scene_name: sceneName,
    season: season || null,
    correct_state: correctState,
  })

  if (insertError) {
    console.error('Failed to create reference scene:', insertError)
    return { error: 'db_error' }
  }

  revalidatePath('/shop/guide')
  revalidatePath('/shop/guide/scenes')
  redirect('/shop/guide')
}

export async function createReferenceSceneFromTag(
  tagId: string,
): Promise<CreateReferenceSceneFromTagResult> {
  if (!UUID_PATTERN.test(tagId)) {
    return { ok: false, error: 'not_found' }
  }

  const { error, shop, supabase } = await getCurrentGuideShop()
  if (error || !shop) {
    return { ok: false, error: error || 'no_shop' }
  }

  const { data: existingScene, error: existingSceneError } = await supabase
    .from('reference_scenes')
    .select('id')
    .eq('shop_id', shop.id)
    .eq('source_tag_id', tagId)
    .maybeSingle()

  if (existingSceneError) {
    console.error('Failed to check existing reference scene:', existingSceneError)
    return { ok: false, error: 'db_error' }
  }

  if (existingScene) {
    return { ok: true, sceneId: existingScene.id, created: false }
  }

  const { data: tag, error: tagError } = await supabase
    .from('tacit_tags')
    .select('id, situation, judgment, reason')
    .eq('id', tagId)
    .eq('shop_id', shop.id)
    .maybeSingle()

  if (tagError) {
    console.error('Failed to load tacit tag for Guide scene:', tagError)
    return { ok: false, error: 'db_error' }
  }

  if (!tag) {
    return { ok: false, error: 'not_found' }
  }

  if (!process.env.OPENAI_API_KEY) {
    return { ok: false, error: 'ai_not_configured' }
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `あなたは旅館や老舗店舗の現場指導を、カメラ判定用の正解シーンへ変換する専門家です。
暗黙知タグの「状況」「判断」「理由」から、Guideでカメラ画像と比較できる正しい状態をJSON化してください。

要件:
- カメラ画像から確認できる物品・配置・状態だけを correctState に入れる
- correctState のキーは短い日本語の名詞または状態名にする
- 値は数量なら number、状態説明なら string、単純な存在確認なら true にする
- 身体の細かい角度や速度など、今の静止画MVPで判定できない要素は入れない
- sceneName は後継者が選びやすい短い名前にする
- 季節が明示されていない場合 season は null にする

必ず次のJSON形式だけで返してください:
{"sceneName":"...","season":null,"correctState":{"...":...}}`,
        },
        {
          role: 'user',
          content: `# 暗黙知タグ
状況: ${tag.situation}
判断: ${tag.judgment}
理由: ${tag.reason}`,
        },
      ],
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      return { ok: false, error: 'invalid_generation' }
    }

    const parsed = GuideSceneDraftSchema.safeParse(JSON.parse(content))
    if (!parsed.success || Object.keys(parsed.data.correctState).length === 0) {
      return { ok: false, error: 'invalid_generation' }
    }

    const { data: scene, error: insertError } = await supabase
      .from('reference_scenes')
      .insert({
        shop_id: shop.id,
        source_tag_id: tag.id,
        scene_name: parsed.data.sceneName,
        season: parsed.data.season || null,
        correct_state: parsed.data.correctState,
      })
      .select('id')
      .single()

    if (insertError || !scene) {
      console.error('Failed to create Guide scene from tag:', insertError)
      return { ok: false, error: 'db_error' }
    }

    revalidatePath('/shop/guide')
    revalidatePath('/shop/guide/scenes')
    revalidatePath('/shop/archive')

    return { ok: true, sceneId: scene.id, created: true }
  } catch (generationError) {
    console.error('Guide scene generation error:', generationError)
    return { ok: false, error: 'invalid_generation' }
  }
}

export async function deleteReferenceScene(sceneId: string): Promise<DeleteReferenceSceneResult> {
  if (!UUID_PATTERN.test(sceneId)) {
    return { ok: false, error: 'not_found' }
  }

  const { error, shop, supabase } = await getCurrentGuideShop()
  if (error || !shop) {
    return { ok: false, error: error || 'no_shop' }
  }

  const { data: scene, error: selectError } = await supabase
    .from('reference_scenes')
    .select('id')
    .eq('id', sceneId)
    .eq('shop_id', shop.id)
    .maybeSingle()

  if (selectError || !scene) {
    return { ok: false, error: 'not_found' }
  }

  const { error: deleteError } = await supabase
    .from('reference_scenes')
    .delete()
    .eq('id', sceneId)
    .eq('shop_id', shop.id)

  if (deleteError) {
    console.error('Failed to delete reference scene:', deleteError)
    return { ok: false, error: 'db_error' }
  }

  revalidatePath('/shop/guide')
  revalidatePath('/shop/guide/scenes')

  return { ok: true }
}

export async function saveObservationLog(input: SaveObservationLogInput) {
  try {
    const { error, shop, supabase } = await getCurrentGuideShop()
    if (error || !shop) {
      return {
        success: false,
        error: '観察ログの保存権限を確認できませんでした',
      }
    }

    if (shop.id !== input.shopId) {
      return {
        success: false,
        error: '別の店舗の観察ログは保存できません',
      }
    }

    if (input.sceneId) {
      const { data: scene, error: sceneError } = await supabase
        .from('reference_scenes')
        .select('id')
        .eq('id', input.sceneId)
        .eq('shop_id', shop.id)
        .maybeSingle()

      if (sceneError || !scene) {
        return {
          success: false,
          error: '参照シーンを確認できませんでした',
        }
      }
    }

    const { data, error: insertError } = await supabase
      .from('observation_logs')
      .insert({
        shop_id: input.shopId,
        scene_id: input.sceneId,
        vision_result: input.visionResult,
        llm_feedback: input.llmFeedback,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to save observation log:', insertError)
      throw new Error('観察ログの保存に失敗しました')
    }

    return { success: true, data }
  } catch (error) {
    console.error('Save observation log error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '観察ログの保存に失敗しました',
    }
  }
}

export async function getReferenceScenes(shopId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('reference_scenes')
      .select('*')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch reference scenes:', error)
      throw new Error('参照シーンの取得に失敗しました')
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Get reference scenes error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '参照シーンの取得に失敗しました',
      data: [],
    }
  }
}
