import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export type GenerateFeedbackRequest = {
  sceneName: string
  season?: string | null
  observedItems: string[]
  missingItems: string[]
  extraItems: string[]
  correctState: Record<string, unknown>
}

export async function generateGuideFeedback(request: GenerateFeedbackRequest): Promise<string> {
  const { sceneName, season, observedItems, missingItems, extraItems, correctState } = request

  const prompt = `あなたは旅館の先代として、後継者に準備作業を指導する役割です。
現場の状況を見て、優しく、具体的に、改善点をフィードバックしてください。

# 現在のシーン
${sceneName}${season ? `（季節: ${season}）` : ''}

# 正しい状態
${JSON.stringify(correctState, null, 2)}

# 確認された物品
${observedItems.join(', ') || 'なし'}

# 足りないもの
${missingItems.join(', ') || 'なし'}

# 余分なもの/違うこと
${extraItems.join(', ') || 'なし'}

# 指示
- 2-3文で簡潔に
- 足りないものがあれば「〜を添えてください」のように具体的に
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
