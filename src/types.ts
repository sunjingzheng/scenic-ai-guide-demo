export type Spot = {
  id: string
  scenicArea: string
  name: string
  position: string
  parameters: string
  coreFunction: string
  culture: string
  detail: string
  highlights: string
  opening: string
  notes: string
  tags: string[]
}

export type RoutePlan = {
  id: string
  title: string
  interest: string
  duration: string
  difficulty?: string
  summary: string
  bestTime?: string
  tips?: string
  stops: string[]
  focus: string[]
}

export type ChatMessage = {
  role: 'user' | 'assistant'
  text: string
  imageUrls?: string[]
  emotion?: string
  references?: Spot[]
}

export type ChatResponse = {
  answer: string
  emotion: string
  speechText: string
  references: Spot[]
  recommendations: RoutePlan[]
  modelProvider: string
  latencyMs?: number
}

export type FeedbackPayload = {
  sessionId?: string
  interactionId?: number
  rating: number
  category: 'service' | 'route' | 'knowledge' | 'bug' | 'suggestion'
  content: string
}

export type ProviderConfig = {
  type: 'openai-compatible'
  name: string
  baseUrl: string
  apiPath?: string
  apiKey: string
  model: string
  maxTokens?: number
  temperature?: number
  thinkingBudgetTokens?: number
  enabledToolsets?: string[]
  extraParams?: Record<string, unknown>
  systemPrompt?: string
}

export type RuntimeAIConfig = {
  activeProvider: string
  contextWindowRounds: number
  ragBackend?: {
    enabled: boolean
    baseUrl: string
    chatPath: string
    chatStreamPath?: string
    modelType: string
    authToken?: string
  }
  providers: Record<string, ProviderConfig>
}

export type TTSConfig = {
  enabled: boolean
  activeProvider?: string
  provider?: string
  baseUrl: string
  apiPath?: string
  apiKey?: string
  speaker: string
  language: string
  providers?: Record<string, TTSProviderConfig>
  gptSoVits?: {
    textLang: string
    promptLang: string
    refAudioPath: string
    promptText: string
    textSplitMethod?: string
    batchSize?: number
    mediaType?: string
    streamingMode?: boolean
    speedFactor?: number
    topK?: number
    topP?: number
    temperature?: number
    sampleSteps?: number
    ifSr?: boolean
    parallelInfer?: boolean
    repetitionPenalty?: number
    auxRefAudioPaths?: string[]
  }
  emotionTTS?: {
    model?: string
    voice?: string
    responseFormat?: string
    speed?: number
  }
}

export type VoicePresetItem = {
  id: string
  name: string
  description: string
  refAudioFile?: string
}

export type TTSProviderConfig = {
  type: 'http-tts'
  name: string
  engine?: string
  baseUrl: string
  apiPath?: string
  apiKey?: string
  speaker: string
  language: string
  isLocal?: boolean
  localEngine?: string
  speakerMode?: 'text' | 'preset'
  voicePresets?: VoicePresetItem[]
  gptSoVits?: TTSConfig['gptSoVits']
  emotionTTS?: TTSConfig['emotionTTS']
}

export type TTSStatus = {
  enabled: boolean
  healthy: boolean
  provider: string
  detail?: string
  speakers?: string[]
}

export type Live2DConfig = {
  enabled: boolean
  assetBase: string
  modelUrl: string
  coreUrl: string
  pixiUrl: string
  runtimeUrl: string
  modelPreset?: string
  models?: Live2DModelPreset[]
}

export type Live2DModelPreset = {
  id: string
  name: string
  assetBase: string
  modelUrl: string
  coreUrl: string
  motionIdle?: string
  motionTap?: string
  hitBody?: string
}

export type BridgeConfig = {
  wechat: {
    enabled: boolean
    token: string
    accountId: string
    baseUrl: string
    conversationId: string
    sendChunkDelay: number
  }
  discord: {
    enabled: boolean
    token: string
    allowedChannels: string[]
    conversationId: string
    proxyUrl: string
  }
}

export type DashboardOverview = {
  metrics: Array<{ label: string; value: string; trend: string }>
  satisfactionTrend: Array<{ month: string; satisfaction: number; visitors: number }>
  hotQuestions: Array<{ question: string; count: number }>
  hotSpots: Array<{ name: string; count: number }>
  focusPoints: Array<{ name: string; value: number }>
  sentiment: Array<{ name: string; value: number }>
  costBreakdown: Array<{ name: string; value: number }>
  suggestions: string[]
}

export type AvatarConfig = {
  outfit: string
  voice: string
  expressionLevel: number
  culturalTheme: string
  defaultEmotion?: string
  autoGreeting?: boolean
  greetingText?: string
  voiceEnabled?: boolean
  voiceSpeed?: number
  ttsSpeaker?: string
  ttsLanguage?: string
  preferLocalTTS?: boolean
  live2d?: Live2DConfig
}

export type Outfit = {
  id: number
  name: string
  imagePath: string
  imageUrl: string
  modelUrl: string
  description: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}
