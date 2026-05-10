const MP3_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/mpeg3',
  'audio/x-mpeg',
  'audio/x-mpeg-3',
])

const VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'avi', 'webm', 'm4v', 'mkv'])

export const INTERVIEW_FILE_ACCEPT = 'audio/mpeg,audio/mp3,.mp3'
export const INTERVIEW_STORAGE_BUCKET = 'interview-videos'
export const MAX_INTERVIEW_FILE_SIZE = 100 * 1024 * 1024

type InterviewFileLike = Pick<File, 'name' | 'type'>

export function getFileExtension(fileName: string): string {
  const fileNameParts = fileName.split('.')
  if (fileNameParts.length < 2) return ''
  return fileNameParts.at(-1)?.toLowerCase() ?? ''
}

export function getInterviewFileExtension(file: InterviewFileLike): string {
  const extension = getFileExtension(file.name)
  if (extension === 'mp3' || VIDEO_EXTENSIONS.has(extension)) return extension
  return MP3_MIME_TYPES.has(file.type) ? 'mp3' : 'mp4'
}

export function getStorageFileName(storagePath: string): string {
  return storagePath.split('/').pop() || `interview.${getFileExtension(storagePath) || 'mp4'}`
}

export function isMp3File(file: InterviewFileLike): boolean {
  const extension = getFileExtension(file.name)
  return extension === 'mp3' || MP3_MIME_TYPES.has(file.type)
}

export function isVideoFile(file: InterviewFileLike): boolean {
  const extension = getFileExtension(file.name)
  return file.type.startsWith('video/') || VIDEO_EXTENSIONS.has(extension)
}

export function isSupportedInterviewFile(file: InterviewFileLike): boolean {
  return isVideoFile(file) || isMp3File(file)
}

export function isAudioStoragePath(storagePath: string | null | undefined): boolean {
  return getFileExtension(storagePath ?? '') === 'mp3'
}
