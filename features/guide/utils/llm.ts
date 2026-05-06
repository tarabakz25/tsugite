import OpenAI from 'openai'
import type { GuideSourceTagContext, GuideSourceType } from '../types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'missing-openai-api-key',
})

export type GenerateFeedbackRequest = {
  sceneName: string
  season?: string | null
  observedItems: string[]
  missingItems: string[]
  extraItems: string[]
  correctState: Record<string, unknown> | null
  sourceTag?: GuideSourceTagContext | null
  sourceType?: GuideSourceType
}

export async function generateGuideFeedback(request: GenerateFeedbackRequest): Promise<string> {
  const {
    sceneName,
    season,
    observedItems,
    missingItems,
    extraItems,
    correctState,
    sourceTag,
    sourceType,
  } = request
  const hasCorrectState = correctState && Object.keys(correctState).length > 0
  const correctStateText = hasCorrectState
    ? JSON.stringify(correctState, null, 2)
    : '未設定。Archiveの暗黙知タグを判断基準として使う。'
  const sourceTagText = sourceTag
    ? `
# Archiveから抽出した暗黙知タグ
状況: ${sourceTag.situation}
判断: ${sourceTag.judgment}
理由: ${sourceTag.reason}`
    : ''
  const differenceText = hasCorrectState
    ? `
# 足りないもの
${missingItems.join(', ') || 'なし'}

# 余分なもの/違うこと
${extraItems.join(', ') || 'なし'}`
    : `
# 差分判定
正解状態が構造化されていないため、missing/extra は断定しない。画像で見える状態と暗黙知タグの判断基準を照らして助言する。`

  const prompt = `あなたは旅館の先代として、後継者に準備作業を指導する役割です。
現場の状況を見て、優しく、具体的に、改善点をフィードバックしてください。

# 現在のシーン
${sceneName}${season ? `（季節: ${season}）` : ''}

# Guideソース
${sourceType === 'tag' ? 'Archiveの暗黙知タグ' : '参照シーン'}
${sourceTagText}

# 正しい状態
${correctStateText}

# 確認された物品
${observedItems.join(', ') || 'なし'}

${differenceText}

# 指示
- 2-3文で簡潔に
- 足りないものがあれば「〜を添えてください」のように具体的に
- Archiveタグがある場合は、状況・判断・理由を根拠にして、今の場面で何を見直すべきかを伝える
- 正解状態が未設定の場合は、見えていない物品や作業を断定しすぎない
- 完璧なら「よくできています」と褒める
- 季節感を大切にする視点があれば伝える
- 先代の口調で、優しく指導的に`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'あなたは伝統的な旅館の先代です。後継者を温かく指導し、おもてなしの心を伝えます。',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 200,
    })

    return completion.choices[0]?.message?.content || 'フィードバックの生成に失敗しました。'
  } catch (error) {
    console.error('LLM feedback generation error:', error)
    throw new Error('フィードバックの生成に失敗しました')
  }
}
