export async function getCameraStream(): Promise<MediaStream> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment', // Prefer back camera on mobile
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    })
    return stream
  } catch (error) {
    console.error('Failed to get camera stream:', error)
    throw new Error('カメラへのアクセスに失敗しました。権限を確認してください。')
  }
}

export function stopCameraStream(stream: MediaStream): void {
  stream.getTracks().forEach((track) => track.stop())
}

export function captureImageFromVideo(videoElement: HTMLVideoElement): string {
  const canvas = document.createElement('canvas')
  canvas.width = videoElement.videoWidth
  canvas.height = videoElement.videoHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas context not available')
  }

  ctx.drawImage(videoElement, 0, 0)
  return canvas.toDataURL('image/jpeg', 0.8)
}
