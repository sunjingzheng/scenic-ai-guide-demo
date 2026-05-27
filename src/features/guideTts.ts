import { requestGptSoVitsTTS } from '../api/tts'
import { getLive2DHandler, stopLive2DAudio } from './live2dBridge'
import { StreamingWavPlayer } from './streamingWavPlayer'
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
    if (sentences.length === 0) return

    const config = options.ttsConfig as TTSConfig
    // 流水线：先合成第一句，播放的同时后台合成下一句
    let nextPromise: ReturnType<typeof requestGptSoVitsTTS> | null = requestGptSoVitsTTS(sentences[0], config)

    try {
      for (let i = 0; i < sentences.length; i += 1) {
        if (gen !== playGeneration) return

        const audio = await nextPromise!
        nextPromise = null

        // 后台预取下一句
        if (i + 1 < sentences.length) {
          nextPromise = requestGptSoVitsTTS(sentences[i + 1], config)
        }

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

/* ── 整段文本流式播放器:AI 完整生成完毕后,一次性整段送 GPT-SoVITS,
       流式接收 wav,边接边播,实现实时性 ── */

function buildStreamPayload(text: string, config: TTSConfig) {
  const gptSoVits = (config as any).gptSoVits
  // 占位符路径(/absolute/path/to/...)不要传给后端,让后端用默认参考音频
  const rawRef = gptSoVits?.refAudioPath
  const refAudioPath = rawRef && !rawRef.startsWith('/absolute/path/to') ? rawRef : undefined
  const rawPrompt = gptSoVits?.promptText
  const promptText = rawPrompt && !rawPrompt.includes('这里填写参考音频') ? rawPrompt : undefined
  return {
    input: text,
    text,
    text_lang: gptSoVits?.textLang || config.language || 'zh',
    prompt_lang: gptSoVits?.promptLang || 'zh',
    text_split_method: gptSoVits?.textSplitMethod || 'cut5',
    media_type: 'wav',
    speed_factor: gptSoVits?.speedFactor ?? 1,
    top_k: gptSoVits?.topK ?? 15,
    top_p: gptSoVits?.topP ?? 1,
    temperature: gptSoVits?.temperature ?? 1,
    repetition_penalty: gptSoVits?.repetitionPenalty ?? 1.35,
    parallel_infer: gptSoVits?.parallelInfer ?? true,
    ...(refAudioPath ? { ref_audio_path: refAudioPath } : {}),
    ...(promptText ? { prompt_text: promptText } : {}),
  }
}

export class StreamingTTSPlayer {
  private player = new StreamingWavPlayer()
  private config: TTSConfig | null = null
  private buffer = ''
  private stopped = false
  private currentPlay: Promise<void> | null = null
  onPlayingChange: ((playing: boolean) => void) | null = null

  constructor() {
    this.player.onPlayingChange = (v) => this.onPlayingChange?.(v)
  }

  start(config: TTSConfig) {
    this.config = config
    this.buffer = ''
    this.stopped = false
    this.currentPlay = null
    stopLive2DAudio()
  }

  // 兼容旧接口,流式 AI 把 delta 全部累积起来,在 flush 时一次性合成
  addText(delta: string) {
    if (this.stopped) return
    this.buffer += delta
  }

  // 直接整段播放,跳过累积流程(配合 ask 改造后的新调用方式)
  speakAll(text: string) {
    if (!this.config || this.stopped) return
    const cleaned = cleanForTTS(text)
    if (!cleaned) return
    const baseUrl = this.config.baseUrl?.replace(/\/$/, '') || ''
    const url = `${baseUrl}/api/tts/emotion/stream`
    this.currentPlay = this.player.play(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildStreamPayload(cleaned, this.config)),
    }).catch((err) => {
      if ((err as DOMException)?.name === 'AbortError') return
      console.warn('[TTS] streaming play failed', err)
    })
  }

  async flush() {
    const text = this.buffer.trim()
    this.buffer = ''
    if (text && this.config && !this.stopped) {
      this.speakAll(text)
    }
    if (this.currentPlay) {
      await this.currentPlay
      this.currentPlay = null
    }
  }

  stop() {
    this.stopped = true
    this.buffer = ''
    this.player.stop()
    this.currentPlay = null
    stopLive2DAudio()
  }
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
