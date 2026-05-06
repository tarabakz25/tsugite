export type VisionResult = {
  items: string[]
  missingItems: string[]
  extraItems: string[]
  rawDescription: string
}

export type GuideSourceType = 'scene' | 'tag'

export type GuideTacitTag = {
  id: string
  situation: string
  judgment: string
  reason: string
  isInferred: boolean
  createdAt: string
}

export type GuideSourceTagContext = Pick<GuideTacitTag, 'id' | 'situation' | 'judgment' | 'reason'>

export type SceneState = {
  id: string
  sceneName: string
  correctState: Record<string, unknown>
  season?: string | null
  sourceTagId?: string | null
  sourceTag?: GuideTacitTag | null
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
