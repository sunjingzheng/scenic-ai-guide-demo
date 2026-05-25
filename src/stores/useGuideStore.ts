import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '../api'
import { playGuideAudioUrl, playGuideTTS, StreamingTTSPlayer } from '../features/guideTts'
import type {
  AvatarConfig,
  ChatMessage,
  RoutePlan,
  RuntimeAIConfig,
  Spot,
  TTSConfig,
} from '../types'

export const useGuideStore = defineStore('guide', () => {
  const sessionId = `scenic-demo-${Date.now()}-${Math.random().toString(16).slice(2)}`
  const spots = ref<Spot[]>([])
  const routes = ref<RoutePlan[]>([])
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
  const chatExpanded = ref(0)
  const aiConfig = ref<RuntimeAIConfig | null>(null)
  const ttsConfig = ref<TTSConfig | null>(null)
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
    ttsSpeaker: '宵宫',
    ttsLanguage: 'zh',
    preferLocalTTS: true,
    live2d: {
      enabled: true,
      assetBase: '/live2d',
      modelUrl: 'Resources/Hiyori_pro/hiyori_pro_t11.model3.json',
      coreUrl: 'Core/live2dcubismcore.js',
      pixiUrl: '/live2d/vendor/pixi-legacy.min.js',
      runtimeUrl: '/live2d/vendor/cubism4.min.js'
    }
  })

  const featuredSpots = computed(() => spots.value.slice(0, 6))

  async function loadBaseData() {
    await loadAvatarConfig()
    await loadTTSConfig()
    if (!spots.value.length) spots.value = await api.getSpots()
    if (!routes.value.length) routes.value = await api.recommendRoutes(currentInterest.value)
  }

  async function loadAvatarConfig() {
    avatarConfig.value = {
      ...avatarConfig.value,
      ...(await api.getAvatar())
    }
  }

  async function loadAIConfig() {
    aiConfig.value = await api.getAIConfig()
  }

  async function loadTTSConfig() {
    const config = await api.getTTSConfig() as TTSConfig
    if (config) {
      ttsConfig.value = config
      avatarConfig.value = {
        ...avatarConfig.value,
        ttsSpeaker: config.speaker,
        ttsLanguage: config.language,
        preferLocalTTS: config.enabled
      }
    }
  }

  const ttsPlayer = new StreamingTTSPlayer()
  ttsPlayer.onPlayingChange = (v: boolean) => { speaking.value = v }

  async function ask(text: string, imageUrls: string[] = []) {
    if (!text.trim() && !imageUrls.length) return
    const displayText = text.trim() || '请看这张图片'
    chatExpanded.value += 1
    messages.value.push({ role: 'user', text: imageUrls.length ? `${displayText}\n（已上传 ${imageUrls.length} 张图片）` : displayText, imageUrls })
    loading.value = true

    // 启动流式 TTS（AI 文字边生成边播）
    if (avatarConfig.value.voiceEnabled !== false && ttsConfig.value?.enabled) {
      ttsPlayer.start(ttsConfig.value)
    }

    try {
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        text: '',
        emotion: 'thinking',
        references: []
      }
      messages.value.push(assistantMessage)

      const result = await api.chatStream({
        text: displayText,
        imageUrls,
        interest: currentInterest.value,
        location: '灵山胜境入口',
        sessionId,
        history: messages.value.slice(-12)
      }, {
        onDelta(delta) {
          assistantMessage.text += delta
          messages.value = [...messages.value]
          ttsPlayer.addText(delta)
        }
      })

      // 播放剩余缓冲文字
      await ttsPlayer.flush()

      currentEmotion.value = result.emotion
      routes.value = result.recommendations
      assistantMessage.text = result.answer
      assistantMessage.emotion = result.emotion
      assistantMessage.references = result.references
      messages.value = [...messages.value]
    } finally {
      loading.value = false
    }
  }

  async function speak(text: string) {
    if (avatarConfig.value.voiceEnabled === false) return
    // 停掉流式播放器，避免冲突
    ttsPlayer.stop()
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

  async function speakAudioUrl(url: string, fallbackText?: string) {
    if (avatarConfig.value.voiceEnabled === false) return
    speaking.value = true
    try {
      await playGuideAudioUrl(url, fallbackText)
    } finally {
      speaking.value = false
    }
  }

  async function updateInterest(interest: string) {
    currentInterest.value = interest
    routes.value = await api.recommendRoutes(interest)
  }

  async function loadAllRoutes() {
    routes.value = await api.getRoutes()
  }

  async function saveAvatar(config: AvatarConfig) {
    const result = await api.saveAvatar(config)
    avatarConfig.value = result.config
  }

  async function submitFeedback(rating: number, category: 'service' | 'route' | 'knowledge' | 'bug' | 'suggestion', content: string) {
    return api.submitFeedback({
      sessionId,
      rating,
      category,
      content
    })
  }

  return {
    sessionId,
    spots,
    routes,
    messages,
    currentInterest,
    currentEmotion,
    speaking,
    loading,
    chatExpanded,
    aiConfig,
    ttsConfig,
    avatarConfig,
    featuredSpots,
    loadBaseData,
    loadAIConfig,
    loadTTSConfig,
    loadAvatarConfig,
    ask,
    speak,
    speakAudioUrl,
    updateInterest,
    loadAllRoutes,
    submitFeedback
  }
})
