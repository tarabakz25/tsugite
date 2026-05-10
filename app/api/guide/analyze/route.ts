import type { NextRequest } from 'next/server'

import { jsonError } from '@/lib/api/http'
import { generateGuideFeedback } from '@/features/guide/utils/llm'
import { analyzeSceneWithVision, compareWithCorrectState } from '@/features/guide/utils/vision'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    if (!body || typeof body !== 'object') {
      return jsonError('Invalid JSON body', 400)
    }
    const { imageDataUrl, sceneName, correctState, season } = body as Record<string, unknown>

    if (
      typeof imageDataUrl !== 'string' ||
      typeof sceneName !== 'string' ||
      typeof correctState !== 'object' ||
      correctState === null ||
      Array.isArray(correctState)
    ) {
      return jsonError('Missing required fields', 400)
    }

    const correctStateRecord = correctState as Record<string, unknown>

    const visionResult = await analyzeSceneWithVision(imageDataUrl, sceneName)
    const differences = compareWithCorrectState(visionResult.items, correctStateRecord)

    const feedback = await generateGuideFeedback({
      sceneName,
      season: typeof season === 'string' ? season : undefined,
      observedItems: visionResult.items,
      missingItems: differences.missing,
      extraItems: differences.extra,
      correctState: correctStateRecord,
    })

    return Response.json({
      visionResult: {
        items: visionResult.items,
        rawDescription: visionResult.rawDescription,
      },
      differences,
      feedback,
    })
  } catch (error) {
    console.error('Scene analysis error:', error)
    return jsonError(error instanceof Error ? error.message : 'Scene analysis failed', 500)
  }
}
