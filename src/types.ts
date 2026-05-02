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
  summary: string
  stops: string[]
  focus: string[]
}

export type ChatMessage = {
  role: 'user' | 'assistant'
  text: string
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
}

export type ProviderConfig = {
  type: 'openai-compatible'
  name: string
  baseUrl: string
  apiKey: string
  model: string
  maxTokens?: number
  temperature?: number
  systemPrompt?: string
}

export type RuntimeAIConfig = {
  activeProvider: string
  contextWindowRounds: number
  providers: Record<string, ProviderConfig>
}

export type TTSConfig = {
  enabled: boolean
  baseUrl: string
  speaker: string
  language: string
}

export type TTSStatus = {
  enabled: boolean
  healthy: boolean
  provider: string
  detail?: string
  speakers?: string[]
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
  voiceEnabled?: boolean
  voiceSpeed?: number
  ttsSpeaker?: string
  ttsLanguage?: string
  preferLocalTTS?: boolean
}
