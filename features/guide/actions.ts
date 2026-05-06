'use server'

import { createClient } from '@/lib/supabase/server'

export type ReferenceSceneRow = {
  id: string
  scene_name: string
  correct_state: Record<string, unknown>
  season: string | null
  source_tag_id: string | null
}

export type TacitGuideTagRow = {
  id: string
  situation: string
  judgment: string
  reason: string
  is_inferred: boolean
  created_at: string
}

export type SaveObservationLogInput = {
  shopId: string
  sceneId: string | null
  visionResult: Record<string, unknown>
  llmFeedback: string | null
}

export async function saveObservationLog(input: SaveObservationLogInput) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('observation_logs')
      .insert({
        shop_id: input.shopId,
        scene_id: input.sceneId,
        vision_result: input.visionResult,
        llm_feedback: input.llmFeedback,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to save observation log:', error)
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
      .select('id, scene_name, correct_state, season, source_tag_id')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch reference scenes:', error)
      throw new Error('参照シーンの取得に失敗しました')
    }

    return { success: true, data: (data || []) as ReferenceSceneRow[] }
  } catch (error) {
    console.error('Get reference scenes error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '参照シーンの取得に失敗しました',
      data: [],
    }
  }
}

export async function getTacitGuideTags(shopId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('tacit_tags')
      .select('id, situation, judgment, reason, is_inferred, created_at')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch tacit guide tags:', error)
      throw new Error('暗黙知タグの取得に失敗しました')
    }

    return { success: true, data: (data || []) as TacitGuideTagRow[] }
  } catch (error) {
    console.error('Get tacit guide tags error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '暗黙知タグの取得に失敗しました',
      data: [],
    }
  }
}
