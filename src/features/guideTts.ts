let playGeneration = 0

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

function stopLive2DAudio() {
  window.__live2dGetModel?.()?._wavFileHandler?.stop()
}

async function playWithLive2D(buffer: ArrayBuffer) {
  const handler = window.__live2dGetModel?.()?._wavFileHandler
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

async function requestTTS(text: string, speaker: string, language: string) {
  const response = await fetch('/api/tts/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, speaker, language })
  })

  if (!response.ok) {
    throw new Error(`TTS 服务不可用：${response.status}`)
  }

  return {
    buffer: await response.arrayBuffer(),
    contentType: response.headers.get('Content-Type') || 'audio/mpeg'
  }
}

export async function playGuideTTS(
  text: string,
  options: { speaker?: string; language?: string; rate?: number; pitch?: number; preferLocalTTS?: boolean } = {}
) {
  const cleaned = cleanForTTS(text)
  if (!cleaned) return

  const gen = ++playGeneration
  stopLive2DAudio()

  if (options.preferLocalTTS !== false) {
    const sentences = splitSentences(cleaned)
    const requests = sentences.map((sentence) =>
      requestTTS(sentence, options.speaker || 'xiaoxiao', options.language || 'Auto')
    )

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
