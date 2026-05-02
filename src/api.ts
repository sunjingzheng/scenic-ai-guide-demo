import type {
  AvatarConfig,
  ChatResponse,
  DashboardOverview,
  RoutePlan,
  RuntimeAIConfig,
  Spot,
  TTSConfig,
  TTSStatus
} from './types'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })

  if (!response.ok) {
    throw new Error(`API ${url} failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}

export const api = {
  getSpots: () => request<Spot[]>('/api/knowledge/spots'),
  chat: (payload: { text: string; interest: string; location?: string; history?: Array<{ role: string; text: string }> }) =>
    request<ChatResponse>('/api/chat', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  recommendRoutes: (interest: string) =>
    request<RoutePlan[]>('/api/routes/recommend', {
      method: 'POST',
      body: JSON.stringify({ interest })
    }),
  getDashboard: () => request<DashboardOverview>('/api/dashboard/overview'),
  getAIConfig: () => request<RuntimeAIConfig>('/api/ai/config'),
  saveAIConfig: (config: RuntimeAIConfig) =>
    request<{ ok: boolean; config: RuntimeAIConfig }>('/api/ai/config', {
      method: 'POST',
      body: JSON.stringify(config)
    }),
  getTTSConfig: () => request<TTSConfig>('/api/tts/config'),
  saveTTSConfig: (config: TTSConfig) =>
    request<{ ok: boolean; config: TTSConfig }>('/api/tts/config', {
      method: 'POST',
      body: JSON.stringify(config)
    }),
  getTTSStatus: () => request<TTSStatus>('/api/tts/status'),
  saveAvatar: (config: AvatarConfig) =>
    request<{ ok: boolean; config: AvatarConfig }>('/api/avatar/config', {
      method: 'POST',
      body: JSON.stringify(config)
    })
}
