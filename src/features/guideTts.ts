import { requestGptSoVitsTTS } from '../api/tts'
import { getLive2DHandler, stopLive2DAudio } from './live2dBridge'
import type { TTSConfig } from '../types'

let playGeneration = 0
const LIVE2D_READY_TIMEOUT = 1200

const RE_EMOJI = /\p{Extended_Pictographic}[\u{FE0F}\u{FE0E}\u{200D}\u{20E3}\p{Extended_Pictographic}]*/gu
const RE_KAOMOJI = /[（()）≧≦∇OwO><;:XDd^_=+\-~·°▽○●□■♡♥★☆♪♫◇◆]{3,}/g

export function cleanForTTS(text: string) {
  return text
    .replace(/（[^（）]*）/g, '')
    .replace(/\([^()]*\)/g, '')
    .replace(/【[^【】]*】/g, '')
    .replace(/「[^「」]*」/g, '')
    .replace(/『[^『』]*』/g, '')
    .replace(/〈[^〈〉]*〉/g, '')
    .replace(/《[^《》]*》/g, '')
    .replace(/\*[^*\n]{1,30}\*/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`{1,3}[\s\S]*?`{1,3}/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s/gm, '')
    .replace(/^[-*+]\s/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/[_~|]/g, '')
    .replace(RE_EMOJI, '，')
    .replace(RE_KAOMOJI, '，')
    .replace(/[♪♫♬♩★☆✦✧❤♡♥❥◇◆○●□■△▽→←↑↓↔]/g, '')
    .replace(/[，,]{2,}/g, '，')
    .replace(/([。！？!?…])，/g, '$1')
    .replace(/，([。！？!?…])/g, '$1')
    .replace(/^\s*[，,]\s*/g, '')
    .replace(/\s*[，,]\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function splitSentences(text: string, maxSegments = 8) {
  const raw = text.split(/(?<=[。！？!?…]+\s*)/)
  const result: string[] = []
  let buffer = ''

  for (const part of raw) {
    buffer += part
    if (buffer.trim().length >= 6) {
      result.push(buffer.trim())
      buffer = ''
    }
  }
  if (buffer.trim()) result.push(buffer.trim())

  if (result.length > maxSegments) {
    return [...result.slice(0, maxSegments - 1), result.slice(maxSegments - 1).join('')]
  }
  return result.filter(Boolean)
}

async function waitForLive2DHandler() {
  const startedAt = performance.now()
  while (performance.now() - startedAt < LIVE2D_READY_TIMEOUT) {
    const handler = getLive2DHandler()?._wavFileHandler
    if (handler) return handler
    await new Promise((resolve) => window.setTimeout(resolve, 40))
  }
  return getLive2DHandler()?._wavFileHandler
}

async function playWithLive2D(buffer: ArrayBuffer) {
  const handler = await waitForLive2DHandler()
  if (!handler) return false
  await handler.startFromBuffer(buffer)
  await handler.waitUntilEnd()
  return true
}

function playWithAudioElement(buffer: ArrayBuffer, contentType = 'audio/mpeg') {
  return new Promise<void>((resolve, reject) => {
    const blob = new Blob([buffer], { type: contentType })
    const audio = new Audio(URL.createObjectURL(blob))
    audio.onended = () => {
      URL.revokeObjectURL(audio.src)
      resolve()
    }
    audio.onerror = () => {
      URL.revokeObjectURL(audio.src)
      reject(new Error('音频播放失败'))
    }
    void audio.play().catch(reject)
  })
}

function speakWithBrowser(text: string, rate = 1.02, pitch = 1.08) {
  return new Promise<void>((resolve) => {
    const synth = window.speechSynthesis
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
      window.setTimeout(resolve, Math.min(4200, 900 + text.length * 45))
      return
    }

    synth.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'
    utterance.rate = rate
    utterance.pitch = pitch
    utterance.onend = () => resolve()
    utterance.onerror = () => resolve()
    synth.speak(utterance)
  })
}

export async function playGuideTTS(
  text: string,
  options: {
    speaker?: string
    language?: string
    rate?: number
    pitch?: number
    preferLocalTTS?: boolean
    ttsConfig?: TTSConfig | null
  } = {}
) {
  const cleaned = cleanForTTS(text)
  if (!cleaned) return

  const gen = ++playGeneration
  stopLive2DAudio()

  if (options.preferLocalTTS !== false && options.ttsConfig?.enabled) {
    const sentences = splitSentences(cleaned)
    const requests = sentences.map((sentence) => requestGptSoVitsTTS(sentence, options.ttsConfig as TTSConfig))

    try {
      for (let i = 0; i < requests.length; i += 1) {
        if (gen !== playGeneration) return
        const audio = await requests[i]
        if (gen !== playGeneration) return
        const synced = await playWithLive2D(audio.buffer)
        if (!synced) {
          await playWithAudioElement(audio.buffer, audio.contentType)
        }
      }
      return
    } catch (error) {
      console.warn('[TTS] 本地 TTS 不可用，回退浏览器语音：', error)
    }
  }

  if (gen !== playGeneration) return
  await speakWithBrowser(cleaned, options.rate, options.pitch)
}

export async function playGuideAudioUrl(url: string, fallbackText?: string) {
  const gen = ++playGeneration
  stopLive2DAudio()

  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`音频加载失败：${response.status}`)
    const contentType = response.headers.get('content-type') || 'audio/wav'
    const buffer = await response.arrayBuffer()
    if (gen !== playGeneration) return

    const synced = await playWithLive2D(buffer)
    if (!synced) {
      await playWithAudioElement(buffer, contentType)
    }
  } catch (error) {
    console.warn('[TTS] 本地讲解音频不可用，回退浏览器语音：', error)
    if (fallbackText && gen === playGeneration) {
      await speakWithBrowser(cleanForTTS(fallbackText))
    }
  }
}
