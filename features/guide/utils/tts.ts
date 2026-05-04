import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateSpeech(text: string): Promise<Buffer> {
  try {
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'nova', // Female voice, can be changed to alloy, echo, fable, onyx, nova, shimmer
      input: text,
      speed: 0.95, // Slightly slower for clarity
    })

    const buffer = Buffer.from(await mp3.arrayBuffer())
    return buffer
  } catch (error) {
    console.error('TTS generation error:', error)
    throw new Error('音声の生成に失敗しました')
  }
}
