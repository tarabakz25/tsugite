'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Demo seed data for testing Guide feature
 * Scenario: 客室のお茶出し準備 (Guest room tea preparation)
 */
export async function seedDemoReferenceScene(shopId: string) {
  const supabase = await createClient()

  // Check if demo scene already exists
  const { data: existing } = await supabase
    .from('reference_scenes')
    .select('id')
    .eq('shop_id', shopId)
    .eq('scene_name', '客室のお茶出し準備')
    .single()

  if (existing) {
    return { success: true, message: 'Demo scene already exists', sceneId: existing.id }
  }

  // Create demo reference scene
  const { data, error } = await supabase
    .from('reference_scenes')
    .insert({
      shop_id: shopId,
      scene_name: '客室のお茶出し準備',
      correct_state: {
        湯呑: 2,
        茶托: 2,
        急須: 1,
        茶葉: 1,
        花: '季節の一輪',
        お盆: 1,
      },
      season: '5月',
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to seed demo scene:', error)
    return { success: false, message: 'Failed to seed demo scene' }
  }

  return { success: true, message: 'Demo scene created', sceneId: data.id }
}
