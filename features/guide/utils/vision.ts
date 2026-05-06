import { GoogleGenerativeAI } from '@google/generative-ai'
import type { GuideSourceTagContext } from '../types'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '')

export type AnalyzeSceneRequest = {
  imageDataUrl: string
  sceneName: string
  correctState: Record<string, unknown>
}

export type AnalyzeSceneResponse = {
  visionResult: {
    items: string[]
    rawDescription: string
  }
  differences: {
    missing: string[]
    extra: string[]
  }
}

export async function analyzeSceneWithVision(
  imageDataUrl: string,
  sceneName: string,
  sourceTag?: GuideSourceTagContext | null,
): Promise<{ items: string[]; rawDescription: string }> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    // Remove data URL prefix
    const base64Image = imageDataUrl.replace(/^data:image\/\w+;base64,/, '')

    const sourceTagContext = sourceTag
      ? `
Archiveから抽出した暗黙知タグ:
- 状況: ${sourceTag.situation}
- 判断: ${sourceTag.judgment}
- 理由: ${sourceTag.reason}

この暗黙知タグに関係する配置、所作、状態、注意点が見える場合は優先して拾ってください。`
      : ''

    const prompt = `この画像を分析し、見える物品や状態を日本語でリスト化してください。
シーン: ${sceneName}
${sourceTagContext}

以下の形式で回答してください:
- 物品1
- 物品2
- 物品3
...

簡潔に、視覚的に確認できる主要な物品のみをリストしてください。`

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image,
        },
      },
      { text: prompt },
    ])

    const response = result.response
    const text = response.text()

    // Parse items from response
    const items = text
      .split('\n')
      .filter((line) => line.trim().startsWith('-'))
      .map((line) => line.replace(/^-\s*/, '').trim())
      .filter((item) => item.length > 0)

    return {
      items,
      rawDescription: text,
    }
  } catch (error) {
    console.error('Vision analysis error:', error)
    throw new Error('画像認識に失敗しました')
  }
}

export function compareWithCorrectState(
  observedItems: string[],
  correctState: Record<string, unknown>,
): { missing: string[]; extra: string[] } {
  // Extract expected items from correctState
  const expectedItems = Object.entries(correctState)
    .filter(([_key, value]) => value !== false && value !== null && value !== 0)
    .map(([key, value]) => {
      if (typeof value === 'number' && value > 1) {
        return `${key}×${value}`
      }
      return key
    })

  // Simple comparison - this is MVP logic
  const missing: string[] = []
  const extra: string[] = []

  // Find missing items
  for (const expected of expectedItems) {
    const found = observedItems.some((obs) =>
      obs.toLowerCase().includes(expected.toLowerCase().split('×')[0]),
    )
    if (!found) {
      missing.push(expected)
    }
  }

  // Find extra items (items observed but not in correct state)
  for (const observed of observedItems) {
    const found = expectedItems.some((exp) =>
      observed.toLowerCase().includes(exp.toLowerCase().split('×')[0]),
    )
    if (!found) {
      extra.push(observed)
    }
  }

  return { missing, extra }
}
