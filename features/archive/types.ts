export type Interview = {
  id: string
  shopId: string
  storagePath: string
  transcript: string | null
  durationSec: number | null
  createdAt: Date
}

export type TacitTag = {
  id: string
  shopId: string
  interviewId: string | null
  situation: string
  judgment: string
  reason: string
  isInferred: boolean
  meta: Record<string, unknown>
  createdAt: Date
}

export type TacitTagWithInterview = TacitTag & {
  interview: Interview | null
}
