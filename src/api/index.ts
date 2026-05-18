import { apiGet, apiPost } from './http'
import {
  buildRagChatRequest,
  buildRagStreamRequest,
  mapRagChatResponse,
  mapRagStreamDone,
  shouldUseRagBackend,
  type RagStreamEvent
} from './chatBackend'
import { readStored, writeStored } from './storage'
import type { ChatResponse } from '../types'

const DATA_FILES = {
  spots: 'spots.json',
  dashboard: 'dashboard.json',
  routes: 'routes.json',
  avatar: 'avatar-config.json',
  ai: 'ai-config.json',
  tts: 'tts-config.json',
  bridge: 'bridge-config.json'
}

const STORAGE_KEYS = {
  avatar: 'scenic.avatar.config',
  ai: 'scenic.ai.config',
  tts: 'scenic.tts.config',
  bridge: 'scenic.bridge.config'
}

async function getJson(file: string) {
  const response = await apiGet(`/data/${file}`)
  return response.data
}

function normalize(text: string) {
  return String(text || '').toLowerCase()
}

function mergePlain(defaultValue: any, storedValue: any) {
  if (!storedValue || typeof storedValue !== 'object') return defaultValue
  if (!defaultValue || typeof defaultValue !== 'object') return storedValue

  const result = { ...defaultValue, ...storedValue }
  for (const key of Object.keys(defaultValue)) {
    if (
      defaultValue[key] &&
      storedValue[key] &&
      typeof defaultValue[key] === 'object' &&
      typeof storedValue[key] === 'object' &&
      !Array.isArray(defaultValue[key]) &&
      !Array.isArray(storedValue[key])
    ) {
      result[key] = mergePlain(defaultValue[key], storedValue[key])
    }
  }
  return result
}

function getActiveTTSProvider(config: any) {
  return config.providers?.[config.activeProvider] || null
}

function normalizeTTSConfig(config: any) {
  const provider = getActiveTTSProvider(config)
  if (!provider) return config
  const isEmotionTTS = (provider.engine || config.provider) === 'emotiontts'
  const normalizedProvider = isEmotionTTS && (provider.speaker === '流莹' || provider.emotionTTS?.voice === '流莹')
    ? {
        ...provider,
        speaker: '宵宫',
        emotionTTS: {
          ...(provider.emotionTTS || config.emotionTTS),
          voice: '宵宫'
        }
      }
    : provider

  return {
    ...config,
    provider: normalizedProvider.engine || config.provider,
    baseUrl: normalizedProvider.baseUrl,
    apiPath: normalizedProvider.apiPath || config.apiPath,
    apiKey: normalizedProvider.apiKey || config.apiKey,
    speaker: normalizedProvider.speaker,
    language: normalizedProvider.language,
    gptSoVits: normalizedProvider.gptSoVits || config.gptSoVits,
    emotionTTS: normalizedProvider.emotionTTS || config.emotionTTS
  }
}

function normalizeAvatarConfig(config: any) {
  const live2d = config.live2d || {}
  return {
    ...config,
    live2d: {
      ...live2d,
      assetBase:
        !live2d.assetBase || String(live2d.assetBase).includes('cdn.jsdelivr.net')
          ? '/live2d'
          : live2d.assetBase,
      modelUrl: live2d.modelUrl || 'Resources/Hiyori_pro/hiyori_pro_t11.model3.json',
      coreUrl: live2d.coreUrl || 'Core/live2dcubismcore.js',
      pixiUrl:
        !live2d.pixiUrl || String(live2d.pixiUrl).includes('cdn.jsdelivr.net') || String(live2d.pixiUrl).endsWith('/pixi.min.js')
          ? '/live2d/vendor/pixi-legacy.min.js'
          : live2d.pixiUrl,
      runtimeUrl:
        !live2d.runtimeUrl || String(live2d.runtimeUrl).includes('cdn.jsdelivr.net')
          ? '/live2d/vendor/cubism4.min.js'
          : live2d.runtimeUrl
    }
  }
}

function pickEmotion(text: string) {
  if (/路线|推荐|怎么玩|安排/.test(text)) return 'thinking'
  if (/谢谢|喜欢|好玩|漂亮|震撼/.test(text)) return 'smile'
  return 'calm'
}

function searchSpots(spots: any[], text: string) {
  const query = normalize(text)
  const tokens = ['大佛', '九龙', '梵宫', '拈花', '历史', '亲子', '祈福', '夜游', '太湖', '自然']

  const scored = spots
    .map((spot) => {
      const blob = normalize(`${spot.name}${spot.detail}${spot.culture}${spot.highlights}${spot.tags?.join('')}`)
      let score = 0
      if (query.includes(normalize(spot.name))) score += 8
      for (const token of tokens) {
        if (query.includes(token) && blob.includes(token)) score += 2
      }
      return { spot, score }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.spot)

  return scored.length ? scored : spots.slice(0, 3)
}

function buildAnswer(text: string, interest: string, references: any[], recommendations: any[]) {
  const primary = references[0]
  const route = recommendations[0]

  if (/路线|推荐|怎么玩|安排/.test(text) && route) {
    return `根据你偏好的“${interest}”，我建议走「${route.title}」。这条路线约 ${route.duration}，顺序是 ${route.stops.join(' -> ')}。讲解重点会放在${route.focus.join('、')}，既能控制步行强度，也方便在核心景点停留拍照。`
  }

  return `${primary.name}是${primary.scenicArea}的重要景点。${primary.culture || primary.detail} 游玩时可以重点关注：${primary.highlights || primary.coreFunction} 我已从 data/spots.json 本地知识库中引用相关条目，后续也可以继续问开放时间、拍照点或适合人群。`
}

async function getRoutesByInterest(interest: string) {
  const routes = await getJson(DATA_FILES.routes) as any[]
  const matched = routes.filter((route) => route.interest === interest)
  return matched.length ? matched : routes
}

export const api = {
  getSpots() {
    return getJson(DATA_FILES.spots)
  },

  async chat(payload: any) {
    const aiConfig = await api.getAIConfig()
    if (shouldUseRagBackend(aiConfig)) {
      try {
        const request = buildRagChatRequest(aiConfig, {
          text: payload.text,
          sessionId: payload.sessionId,
          imageUrls: payload.imageUrls
        })
        const response = await apiPost(request.url, request.data, request.config)
        return mapRagChatResponse(response.data)
      } catch (error) {
        console.warn('RAG backend unavailable, fallback to local JSON knowledge base:', error)
      }
    }

    const [spots, recommendations] = await Promise.all([
      api.getSpots(),
      getRoutesByInterest(payload.interest)
    ])
    const references = searchSpots(spots as any[], payload.text)
    const answer = buildAnswer(payload.text, payload.interest, references, recommendations)

    return {
      answer,
      emotion: pickEmotion(payload.text),
      speechText: answer.replace(/「|」|->/g, ' '),
      references,
      recommendations,
      modelProvider: 'Local JSON knowledge base'
    }
  },

  async chatStream(
    payload: any,
    handlers: {
      onDelta?: (delta: string) => void
      onMeta?: (event: RagStreamEvent) => void
    } = {}
  ): Promise<ChatResponse> {
    const aiConfig = await api.getAIConfig()
    if (shouldUseRagBackend(aiConfig)) {
      try {
        const request = buildRagStreamRequest(aiConfig, {
          text: payload.text,
          sessionId: payload.sessionId,
          imageUrls: payload.imageUrls
        })
        const response = await fetch(request.url, {
          method: 'POST',
          headers: request.headers,
          body: JSON.stringify(request.data)
        })
        if (!response.ok || !response.body) throw new Error(`RAG stream failed: ${response.status}`)

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let doneEvent: Extract<RagStreamEvent, { type: 'done' }> | null = null

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const parts = buffer.split('\n\n')
          buffer = parts.pop() || ''

          for (const part of parts) {
            const dataLine = part
              .split('\n')
              .find((line) => line.startsWith('data:'))
              ?.replace(/^data:\s*/, '')
            if (!dataLine) continue

            const event = JSON.parse(dataLine) as RagStreamEvent
            if (event.type === 'delta') handlers.onDelta?.(event.delta)
            if (event.type === 'meta') handlers.onMeta?.(event)
            if (event.type === 'done') doneEvent = event
          }
        }

        if (doneEvent) return mapRagStreamDone(doneEvent)
      } catch (error) {
        console.warn('RAG stream unavailable, fallback to regular chat:', error)
      }
    }

    const result = await api.chat(payload)
    handlers.onDelta?.(result.answer)
    return result
  },

  recommendRoutes(interest: string) {
    return getRoutesByInterest(interest)
  },

  getDashboard() {
    return getJson(DATA_FILES.dashboard)
  },

  async getAIConfig() {
    const defaults = await getJson(DATA_FILES.ai)
    return mergePlain(defaults, readStored(STORAGE_KEYS.ai))
  },

  async saveAIConfig(config: any) {
    writeStored(STORAGE_KEYS.ai, config)
    return { ok: true, config }
  },

  async getTTSConfig() {
    const defaults = await getJson(DATA_FILES.tts)
    return normalizeTTSConfig(mergePlain(defaults, readStored(STORAGE_KEYS.tts)))
  },

  async saveTTSConfig(config: any) {
    writeStored(STORAGE_KEYS.tts, config)
    return { ok: true, config }
  },

  async getTTSStatus() {
    const config = await api.getTTSConfig() as any
    if (!config.enabled) {
      return {
        enabled: false,
        healthy: false,
        provider: config.baseUrl,
        detail: 'TTS disabled'
      }
    }

    try {
      const statusPath = config.provider === 'emotiontts' ? config.apiPath || '/api/tts/emotion/' : '/docs'
      await apiGet(`${config.baseUrl.replace(/\/$/, '')}${statusPath}`, { responseType: 'text', timeout: 2500 })
      return {
        enabled: true,
        healthy: true,
        provider: config.baseUrl,
        detail: `${config.provider || 'TTS'} ready`
      }
    } catch (error) {
      return {
        enabled: true,
        healthy: false,
        provider: config.baseUrl,
        detail: error instanceof Error ? error.message : 'TTS service unavailable'
      }
    }
  },

  async getAvatar() {
    const defaults = await getJson(DATA_FILES.avatar)
    return normalizeAvatarConfig(mergePlain(defaults, readStored(STORAGE_KEYS.avatar)))
  },

  async saveAvatar(config: any) {
    writeStored(STORAGE_KEYS.avatar, config)
    return { ok: true, config }
  },

  async getBridgeConfig() {
    const defaults = await getJson(DATA_FILES.bridge)
    return mergePlain(defaults, readStored(STORAGE_KEYS.bridge))
  },

  async saveBridgeConfig(config: any) {
    writeStored(STORAGE_KEYS.bridge, config)
    return { ok: true, config }
  }
}

export default api
