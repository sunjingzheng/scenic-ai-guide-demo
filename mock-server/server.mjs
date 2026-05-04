import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import express from 'express'
import { loadEnv } from '../scripts/load-env.mjs'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
loadEnv(rootDir)

const app = express()
const port = Number(process.env.PORT || 8787)
const host = process.env.HOST || 'localhost'
const dataDir = path.join(rootDir, 'data')

app.use(cors())
app.use(express.json({ limit: '2mb' }))

const defaultSystemPrompt =
  '你是灵山胜境 AI 数字人导游。回答要温和、准确、适合景区游客；优先使用提供的本地景区知识库资料，不要编造开放时间、票价或实时活动。'

let runtimeConfig = {
  activeProvider: 'local_rag',
  contextWindowRounds: 6,
  providers: {
    local_rag: {
      type: 'openai-compatible',
      name: '本地知识库模拟',
      baseUrl: '',
      apiKey: '',
      model: 'mock-rag',
      maxTokens: 1024,
      temperature: 0.65,
      systemPrompt: defaultSystemPrompt
    },
    openai_compatible: {
      type: 'openai-compatible',
      name: 'OpenAI Compatible',
      baseUrl: process.env.LLM_BASE_URL || '',
      apiKey: process.env.LLM_API_KEY || '',
      model: process.env.LLM_MODEL || 'gpt-4o-mini',
      maxTokens: Number(process.env.LLM_MAX_TOKENS || 1024),
      temperature: Number(process.env.LLM_TEMPERATURE || 0.7),
      systemPrompt: process.env.LLM_SYSTEM_PROMPT || defaultSystemPrompt
    }
  }
}

if (process.env.LLM_BASE_URL && process.env.LLM_API_KEY) {
  runtimeConfig.activeProvider = 'openai_compatible'
}

let ttsConfig = {
  enabled: String(process.env.TTS_ENABLED || 'false') === 'true',
  baseUrl: process.env.TTS_URL || 'http://localhost:9880',
  speaker: process.env.TTS_SPEAKER || 'xiaoxiao',
  language: process.env.TTS_LANGUAGE || 'Auto'
}

let avatarConfig = {
  outfit: '禅意青绿',
  voice: '温柔讲解女声',
  expressionLevel: 70,
  culturalTheme: '太湖禅境',
  voiceEnabled: true,
  voiceSpeed: 1.02,
  ttsSpeaker: ttsConfig.speaker,
  ttsLanguage: ttsConfig.language,
  preferLocalTTS: ttsConfig.enabled,
  live2d: {
    enabled: true,
    assetBase: 'https://cdn.jsdelivr.net/gh/luckui/ai-live2d-go@nightly/public',
    modelUrl: '',
    coreUrl: '',
    pixiUrl: 'https://cdn.jsdelivr.net/npm/pixi.js@6.5.10/dist/browser/pixi.min.js',
    runtimeUrl: 'https://cdn.jsdelivr.net/npm/pixi-live2d-display@0.4.0/dist/cubism4.min.js'
  }
}

const routes = [
  {
    id: 'history',
    title: '千年佛脉历史文化线',
    interest: '历史文化',
    duration: '约 3.5 小时',
    summary: '从小灵山缘起讲到祥符禅寺与灵山大佛，适合深度文化讲解。',
    stops: ['灵山大照壁', '五明桥', '祥符禅寺', '灵山大佛', '灵山梵宫'],
    focus: ['玄奘命名小灵山', '赵朴初五方五佛理念', '佛教艺术与现代科技融合']
  },
  {
    id: 'pray',
    title: '祈福朝圣经典线',
    interest: '祈福朝圣',
    duration: '约 4 小时',
    summary: '覆盖九龙灌浴、天下第一掌、登云道和抱佛脚体验。',
    stops: ['佛足坛', '九龙灌浴', '百子戏弥勒', '灵山大佛', '五印坛城'],
    focus: ['祈福仪式', '佛教象征', '沉浸式讲解']
  },
  {
    id: 'nature',
    title: '太湖禅境自然观景线',
    interest: '自然风光',
    duration: '约 3 小时',
    summary: '兼顾湖光山色、花海街区和轻松拍照点。',
    stops: ['灵山大照壁', '菩提大道', '曼飞龙塔', '梵天花海', '五灯湖'],
    focus: ['太湖视角', '花海取景', '禅意慢游']
  },
  {
    id: 'family',
    title: '亲子互动研学线',
    interest: '亲子休闲',
    duration: '约 2.5 小时',
    summary: '把知识点拆成互动问答和打卡任务，降低儿童理解门槛。',
    stops: ['百子戏弥勒', '九龙灌浴', '佛教文化博览馆', '香月花街', '鹿鸣谷'],
    focus: ['互动讲解', '轻量研学', '休息补给']
  }
]

async function readJson(file, fallback) {
  try {
    const text = await fs.readFile(path.join(dataDir, file), 'utf8')
    return JSON.parse(text)
  } catch {
    return fallback
  }
}

const fallbackSpots = [
  {
    id: 'LS-011',
    scenicArea: '灵山胜境',
    name: '灵山大佛',
    position: '景区核心轴线终点',
    parameters: '通高 88 米，为露天青铜释迦牟尼立像。',
    coreFunction: '朝圣祈福、文化展示、地标观景',
    culture: '体现赵朴初先生五方五佛理念，是现代灵山胜境的核心文化符号。',
    detail: '灵山大佛右手施无畏印，左手施与愿印，登云道暗合佛教烦恼尽除与愿望圆满的寓意。',
    highlights: '登顶抱佛脚，俯瞰太湖，适合夕阳时段拍摄。',
    opening: '以景区当天公告为准',
    notes: 'fallback demo data',
    tags: ['佛教文化', '历史人文', '观景打卡']
  }
]

function normalize(text) {
  return String(text || '').toLowerCase()
}

function pickEmotion(text) {
  if (/路线|推荐|怎么玩|安排/.test(text)) return 'thinking'
  if (/谢谢|喜欢|好玩|漂亮|震撼/.test(text)) return 'smile'
  return 'calm'
}

function searchSpots(spots, text) {
  const query = normalize(text)
  const scored = spots
    .map((spot) => {
      const blob = normalize(`${spot.name}${spot.detail}${spot.culture}${spot.highlights}${spot.tags?.join('')}`)
      let score = 0
      if (query.includes(normalize(spot.name))) score += 8
      for (const token of ['大佛', '九龙', '梵宫', '拈花', '历史', '亲子', '祈福', '夜游', '太湖', '自然']) {
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

function buildAnswer(text, interest, references, recommendations) {
  const primary = references[0]
  const route = recommendations[0]
  if (/路线|推荐|怎么玩|安排/.test(text)) {
    return `根据你偏好的“${interest}”，我建议走「${route.title}」。这条路线约 ${route.duration}，顺序是 ${route.stops.join(' -> ')}。讲解重点会放在${route.focus.join('、')}，既能控制步行强度，也方便在核心景点停留拍照。`
  }

  return `${primary.name}是${primary.scenicArea}的重要景点。${primary.culture || primary.detail} 游玩时可以重点关注：${primary.highlights || primary.coreFunction} 我已从本地景区知识库中引用相关条目，后续也可以继续问开放时间、拍照点或适合人群。`
}

function sanitizeRuntimeConfig(config) {
  const providers = {}
  for (const [key, provider] of Object.entries(config?.providers || {})) {
    providers[key] = {
      type: 'openai-compatible',
      name: String(provider?.name || key),
      baseUrl: String(provider?.baseUrl || ''),
      apiKey: String(provider?.apiKey || ''),
      model: String(provider?.model || ''),
      maxTokens: Number(provider?.maxTokens || 1024),
      temperature: Number(provider?.temperature ?? 0.7),
      systemPrompt: String(provider?.systemPrompt || defaultSystemPrompt)
    }
  }

  const activeProvider = providers[config?.activeProvider] ? config.activeProvider : Object.keys(providers)[0] || 'local_rag'
  if (!providers.local_rag) {
    providers.local_rag = runtimeConfig.providers.local_rag
  }

  return {
    activeProvider,
    contextWindowRounds: Math.max(1, Math.min(20, Number(config?.contextWindowRounds || 6))),
    providers
  }
}

function buildKnowledgeContext(references, recommendations) {
  const spotsText = references
    .map(
      (spot, index) =>
        `${index + 1}. ${spot.name}：位置 ${spot.position || '未知'}；功能 ${spot.coreFunction || '未标注'}；文化 ${spot.culture || spot.detail || '无'}；亮点 ${spot.highlights || '无'}`
    )
    .join('\n')

  const routesText = recommendations
    .map((route, index) => `${index + 1}. ${route.title}：${route.duration}；${route.summary}；顺序 ${route.stops.join(' -> ')}`)
    .join('\n')

  return `【本地景区知识库】\n${spotsText || '暂无匹配景点'}\n\n【可推荐路线】\n${routesText || '暂无匹配路线'}`
}

async function callOpenAICompatible(provider, { text, interest, location, references, recommendations, history = [] }) {
  if (!provider?.baseUrl || !provider?.apiKey || !provider?.model) return null

  const endpoint = provider.baseUrl.replace(/\/$/, '').endsWith('/chat/completions')
    ? provider.baseUrl.replace(/\/$/, '')
    : `${provider.baseUrl.replace(/\/$/, '')}/chat/completions`

  const context = buildKnowledgeContext(references, recommendations)
  const recentHistory = history
    .slice(-Math.max(0, runtimeConfig.contextWindowRounds * 2))
    .map((message) => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: String(message.text || '').slice(0, 1200)
    }))

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20000)

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify({
        model: provider.model,
        temperature: provider.temperature ?? 0.7,
        max_tokens: provider.maxTokens ?? 1024,
        messages: [
          {
            role: 'system',
            content: `${provider.systemPrompt || defaultSystemPrompt}\n\n用户兴趣：${interest}\n当前位置：${location || '未知'}\n\n${context}`
          },
          ...recentHistory,
          { role: 'user', content: text }
        ]
      })
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      console.warn('[LLM] provider failed:', response.status, body.slice(0, 500))
      return null
    }

    const data = await response.json()
    return String(data?.choices?.[0]?.message?.content || '').trim() || null
  } catch (error) {
    console.warn('[LLM] provider unavailable:', error)
    return null
  } finally {
    clearTimeout(timeout)
  }
}

app.get('/api/knowledge/spots', async (_req, res) => {
  res.json(await readJson('spots.json', fallbackSpots))
})

app.post('/api/chat', async (req, res) => {
  const spots = await readJson('spots.json', fallbackSpots)
  const text = String(req.body?.text || '')
  const interest = String(req.body?.interest || '历史文化')
  const location = String(req.body?.location || '灵山胜境入口')
  const history = Array.isArray(req.body?.history) ? req.body.history : []
  const references = searchSpots(spots, text)
  const recommendations = routes.filter((route) => route.interest === interest)
  const activeRecommendations = recommendations.length ? recommendations : routes.slice(0, 1)
  const provider = runtimeConfig.providers[runtimeConfig.activeProvider]
  const llmAnswer =
    runtimeConfig.activeProvider !== 'local_rag'
      ? await callOpenAICompatible(provider, {
          text,
          interest,
          location,
          references,
          recommendations: activeRecommendations,
          history
        })
      : null
  const answer = llmAnswer || buildAnswer(text, interest, references, activeRecommendations)

  res.json({
    answer,
    emotion: pickEmotion(text),
    speechText: answer.replace(/「|」|->/g, ' '),
    references,
    recommendations: activeRecommendations,
    modelProvider: llmAnswer ? `${provider.name} / ${provider.model}` : 'Mock RAG + local knowledge base'
  })
})

app.get('/api/ai/config', (_req, res) => {
  res.json(runtimeConfig)
})

app.post('/api/ai/config', (req, res) => {
  runtimeConfig = sanitizeRuntimeConfig(req.body)
  res.json({ ok: true, config: runtimeConfig })
})

app.get('/api/tts/config', (_req, res) => {
  res.json(ttsConfig)
})

app.post('/api/tts/config', (req, res) => {
  ttsConfig = {
    enabled: Boolean(req.body?.enabled),
    baseUrl: String(req.body?.baseUrl || ttsConfig.baseUrl),
    speaker: String(req.body?.speaker || ttsConfig.speaker),
    language: String(req.body?.language || ttsConfig.language)
  }
  res.json({ ok: true, config: ttsConfig })
})

app.get('/api/avatar/config', (_req, res) => {
  res.json(avatarConfig)
})

app.get('/api/tts/status', async (_req, res) => {
  if (!ttsConfig.enabled) {
    res.json({ enabled: false, healthy: false, provider: ttsConfig.baseUrl, detail: 'TTS disabled' })
    return
  }

  try {
    const health = await fetch(`${ttsConfig.baseUrl.replace(/\/$/, '')}/health`)
    const speakersRes = await fetch(`${ttsConfig.baseUrl.replace(/\/$/, '')}/speakers`).catch(() => null)
    const speakersData = speakersRes?.ok ? await speakersRes.json() : null
    res.json({
      enabled: true,
      healthy: health.ok,
      provider: ttsConfig.baseUrl,
      detail: health.ok ? 'ready' : `HTTP ${health.status}`,
      speakers: speakersData?.speakers?.map((speaker) => speaker.id || speaker.name || String(speaker)).slice(0, 30) || []
    })
  } catch (error) {
    res.json({
      enabled: true,
      healthy: false,
      provider: ttsConfig.baseUrl,
      detail: error instanceof Error ? error.message : 'TTS service unavailable'
    })
  }
})

app.post('/api/tts/generate', async (req, res) => {
  if (!ttsConfig.enabled) {
    res.status(503).json({ error: 'TTS disabled' })
    return
  }

  const text = String(req.body?.text || '').trim()
  if (!text) {
    res.status(400).json({ error: 'Text is empty' })
    return
  }

  try {
    const response = await fetch(`${ttsConfig.baseUrl.replace(/\/$/, '')}/tts/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        speaker: String(req.body?.speaker || ttsConfig.speaker),
        language: String(req.body?.language || ttsConfig.language)
      })
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      res.status(response.status).json({ error: detail || `TTS failed: ${response.status}` })
      return
    }

    const audio = Buffer.from(await response.arrayBuffer())
    res.setHeader('Content-Type', response.headers.get('content-type') || 'audio/mpeg')
    res.send(audio)
  } catch (error) {
    res.status(503).json({
      error: error instanceof Error ? error.message : 'TTS service unavailable'
    })
  }
})

app.post('/api/routes/recommend', (req, res) => {
  const interest = String(req.body?.interest || '历史文化')
  const matched = routes.filter((route) => route.interest === interest)
  res.json(matched.length ? matched : routes)
})

app.get('/api/dashboard/overview', async (_req, res) => {
  res.json(
    await readJson('dashboard.json', {
      metrics: [
        { label: '资料样本服务人次', value: '777', trend: 'fallback sample' },
        { label: '平均停留时长', value: '5.6h', trend: 'fallback sample' },
        { label: '平均满意度', value: '3.07', trend: '仍有提升空间' },
        { label: '知识库景点数', value: '22', trend: '覆盖灵山与拈花湾' }
      ],
      satisfactionTrend: [],
      hotQuestions: [],
      hotSpots: [],
      focusPoints: [],
      sentiment: [],
      costBreakdown: [],
      suggestions: []
    })
  )
})

app.post('/api/avatar/config', (req, res) => {
  avatarConfig = {
    ...avatarConfig,
    ...req.body,
    live2d: {
      ...avatarConfig.live2d,
      ...(req.body?.live2d || {})
    }
  }
  res.json({ ok: true, config: avatarConfig })
})

app.listen(port, host, () => {
  console.log(`Mock API server running at http://${host}:${port}`)
})
