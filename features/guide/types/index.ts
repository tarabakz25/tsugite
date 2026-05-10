export type GuideAnalysisStatus = 'ok' | 'needs_fix' | 'unknown'

export type VisionResult = {
  items: string[]
  missingItems: string[]
  extraItems: string[]
  rawDescription: string
  status: GuideAnalysisStatus
}

export type SceneState = {
  id: string
  sceneName: string
  season?: string | null
}

export type GuideFeedback = {
  text: string
  audioUrl?: string
  timestamp: number
}

export type ObservationLog = {
  id: string
  shopId: string
  sceneId: string | null
  observedAt: string
  visionResult: Record<string, unknown>
  llmFeedback: string | null
}

export type GuideStatus = 'idle' | 'initializing' | 'capturing' | 'analyzing' | 'speaking' | 'error'
