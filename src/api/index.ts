import { apiGet } from './http'
import { readStored, writeStored } from './storage'

const DATA_FILES = {
  spots: 'spots.json',
  dashboard: 'dashboard.json',
  routes: 'routes.json',
  avatar: 'avatar-config.json',
  ai: 'ai-config.json',
  tts: 'tts-config.json'
}

const STORAGE_KEYS = {
  avatar: 'scenic.avatar.config',
  ai: 'scenic.ai.config',
  tts: 'scenic.tts.config'
}

async function getJson(file: string) {
  const response = await apiGet(`/data/${file}`)
  return response.data
}

function normalize(text: string) {
  return String(text || '').toLowerCase()
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

  recommendRoutes(interest: string) {
    return getRoutesByInterest(interest)
  },

  getDashboard() {
    return getJson(DATA_FILES.dashboard)
  },

  async getAIConfig() {
    return readStored(STORAGE_KEYS.ai) || await getJson(DATA_FILES.ai)
  },

  async saveAIConfig(config: any) {
    writeStored(STORAGE_KEYS.ai, config)
    return { ok: true, config }
  },

  async getTTSConfig() {
    return readStored(STORAGE_KEYS.tts) || await getJson(DATA_FILES.tts)
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
      await apiGet(`${config.baseUrl.replace(/\/$/, '')}/docs`, { responseType: 'text' })
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
    return readStored(STORAGE_KEYS.avatar) || await getJson(DATA_FILES.avatar)
  },

  async saveAvatar(config: any) {
    writeStored(STORAGE_KEYS.avatar, config)
    return { ok: true, config }
  }
}

export default api
