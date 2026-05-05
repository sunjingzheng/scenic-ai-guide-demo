import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '../api'
import { playGuideTTS } from '../features/guideTts'
import type {
  AvatarConfig,
  BridgeConfig,
  ChatMessage,
  DashboardOverview,
  RoutePlan,
  RuntimeAIConfig,
  Spot,
  TTSConfig,
  TTSStatus
} from '../types'

export const useGuideStore = defineStore('guide', () => {
  const spots = ref<Spot[]>([])
  const routes = ref<RoutePlan[]>([])
  const dashboard = ref<DashboardOverview | null>(null)
  const messages = ref<ChatMessage[]>([
    {
      role: 'assistant',
      text: '您好，我是灵山胜境 AI 数字人导游。可以问我景点历史、祈福路线、亲子玩法或拈花湾夜游安排。',
      emotion: 'smile'
    }
  ])
  const currentInterest = ref('历史文化')
  const currentEmotion = ref('smile')
  const speaking = ref(false)
  const loading = ref(false)
  const aiConfig = ref<RuntimeAIConfig | null>(null)
  const ttsConfig = ref<TTSConfig | null>(null)
  const ttsStatus = ref<TTSStatus | null>(null)
  const bridgeConfig = ref<BridgeConfig | null>(null)
  const avatarConfig = ref<AvatarConfig>({
    outfit: '禅意青绿',
    voice: '温柔讲解女声',
    expressionLevel: 70,
    culturalTheme: '太湖禅境',
    defaultEmotion: 'happy',
    autoGreeting: true,
    greetingText: '您好！我是灵山胜境的AI导览员，很高兴为您服务。',
    voiceEnabled: true,
    voiceSpeed: 1.02,
    ttsSpeaker: 'zero-shot',
    ttsLanguage: 'zh',
    preferLocalTTS: false,
    live2d: {
      enabled: true,
      assetBase: '/live2d',
      modelUrl: 'Resources/Hiyori_pro/hiyori_pro_t11.model3.json',
      coreUrl: 'Core/live2dcubismcore.js',
      pixiUrl: '/live2d/vendor/pixi.min.js',
      runtimeUrl: '/live2d/vendor/cubism4.min.js'
    }
  })

  const featuredSpots = computed(() => spots.value.slice(0, 6))

  async function loadBaseData() {
    await loadAvatarConfig()
    if (!spots.value.length) spots.value = await api.getSpots()
    if (!routes.value.length) routes.value = await api.recommendRoutes(currentInterest.value)
  }

  async function loadAvatarConfig() {
    avatarConfig.value = {
      ...avatarConfig.value,
      ...(await api.getAvatar())
    }
  }

  async function loadDashboard() {
    dashboard.value = await api.getDashboard()
  }

  async function loadAIConfig() {
    aiConfig.value = await api.getAIConfig()
  }

  async function saveAIConfig(config: RuntimeAIConfig) {
    const result = await api.saveAIConfig(config)
    aiConfig.value = result.config
  }

  async function loadTTSConfig() {
    const config = await api.getTTSConfig() as TTSConfig
    ttsConfig.value = config
    avatarConfig.value = {
      ...avatarConfig.value,
      ttsSpeaker: config.speaker,
      ttsLanguage: config.language,
      preferLocalTTS: config.enabled
    }
  }

  async function saveTTSConfig(config: TTSConfig) {
    const result = await api.saveTTSConfig(config)
    ttsConfig.value = result.config
    avatarConfig.value = {
      ...avatarConfig.value,
      ttsSpeaker: result.config.speaker,
      ttsLanguage: result.config.language,
      preferLocalTTS: result.config.enabled
    }
  }

  async function refreshTTSStatus() {
    ttsStatus.value = await api.getTTSStatus()
  }

  async function loadBridgeConfig() {
    bridgeConfig.value = await api.getBridgeConfig()
  }

  async function saveBridgeConfig(config: BridgeConfig) {
    const result = await api.saveBridgeConfig(config)
    bridgeConfig.value = result.config
  }

  async function ask(text: string) {
    if (!text.trim()) return
    messages.value.push({ role: 'user', text })
    loading.value = true

    try {
      const result = await api.chat({
        text,
        interest: currentInterest.value,
        location: '灵山胜境入口',
        history: messages.value.slice(-12)
      })
      currentEmotion.value = result.emotion
      routes.value = result.recommendations
      messages.value.push({
        role: 'assistant',
        text: result.answer,
        emotion: result.emotion,
        references: result.references
      })
      void speak(result.speechText)
    } finally {
      loading.value = false
    }
  }

  async function speak(text: string) {
    if (avatarConfig.value.voiceEnabled === false) return
    speaking.value = true
    try {
      await playGuideTTS(text, {
        speaker: avatarConfig.value.ttsSpeaker,
        language: avatarConfig.value.ttsLanguage,
        rate: avatarConfig.value.voiceSpeed,
        pitch: avatarConfig.value.voice.includes('女声') ? 1.12 : 0.92,
        preferLocalTTS: avatarConfig.value.preferLocalTTS,
        ttsConfig: ttsConfig.value
      })
    } finally {
      speaking.value = false
    }
  }

  async function updateInterest(interest: string) {
    currentInterest.value = interest
    routes.value = await api.recommendRoutes(interest)
  }

  async function saveAvatar(config: AvatarConfig) {
    const result = await api.saveAvatar(config)
    avatarConfig.value = result.config
  }

  return {
    spots,
    routes,
    dashboard,
    messages,
    currentInterest,
    currentEmotion,
    speaking,
    loading,
    aiConfig,
    ttsConfig,
    ttsStatus,
    bridgeConfig,
    avatarConfig,
    featuredSpots,
    loadBaseData,
    loadDashboard,
    loadAIConfig,
    saveAIConfig,
    loadTTSConfig,
    saveTTSConfig,
    refreshTTSStatus,
    loadBridgeConfig,
    saveBridgeConfig,
    loadAvatarConfig,
    ask,
    speak,
    updateInterest,
    saveAvatar
  }
})
