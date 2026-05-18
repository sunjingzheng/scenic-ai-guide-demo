import type { ChatResponse, RuntimeAIConfig } from '../types'

type RagChatPayload = {
  text: string
  sessionId?: string
  imageUrls?: string[]
}

type RagSource = {
  title?: string
  category?: string
  score?: number
  type?: string
}

type RagBackendResponse = {
  code?: number
  data?: {
    response_text?: string
    emotion?: string
    model_used?: string
    sources?: RagSource[]
  }
  message?: string
}

export type RagStreamEvent =
  | { type: 'meta'; emotion?: string; model_used?: string; sources?: RagSource[] }
  | { type: 'delta'; delta: string }
  | { type: 'done'; answer?: string; emotion?: string; model_used?: string; sources?: RagSource[] }

function joinUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}

export function shouldUseRagBackend(config: RuntimeAIConfig | null | undefined) {
  return Boolean(config?.ragBackend?.enabled && config.ragBackend.baseUrl && config.ragBackend.chatPath)
}

export function buildRagChatRequest(config: RuntimeAIConfig, payload: RagChatPayload) {
  const backend = config.ragBackend
  if (!backend) throw new Error('RAG backend config is missing')

  const headers = backend.authToken ? { Authorization: `Bearer ${backend.authToken}` } : undefined

  return {
    url: joinUrl(backend.baseUrl, backend.chatPath),
    data: {
      message: payload.text,
      session_id: payload.sessionId || 'scenic-guide-demo',
      model_type: backend.modelType || config.activeProvider,
      image_urls: payload.imageUrls || []
    },
    config: headers ? { headers } : {}
  }
}

export function buildRagStreamRequest(config: RuntimeAIConfig, payload: RagChatPayload) {
  const backend = config.ragBackend
  if (!backend) throw new Error('RAG backend config is missing')

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (backend.authToken) headers.Authorization = `Bearer ${backend.authToken}`

  return {
    url: joinUrl(backend.baseUrl, backend.chatStreamPath || backend.chatPath),
    data: {
      message: payload.text,
      session_id: payload.sessionId || 'scenic-guide-demo',
      model_type: backend.modelType || config.activeProvider,
      image_urls: payload.imageUrls || []
    },
    headers
  }
}

export function mapRagChatResponse(response: RagBackendResponse): ChatResponse {
  const data = response.data
  const answer = data?.response_text?.trim()
  if (!answer) {
    throw new Error(response.message || 'RAG backend returned an empty answer')
  }

  return {
    answer,
    emotion: data?.emotion || 'calm',
    speechText: answer.replace(/「|」|->/g, ' '),
    references: (data?.sources || []).map((source, index) => ({
      id: `rag-${index + 1}`,
      name: source.title || `知识来源 ${index + 1}`,
      scenicArea: source.category || 'RAG 知识库',
      position: '',
      parameters: '',
      coreFunction: source.type || '',
      culture: '',
      detail: source.title || '',
      highlights: source.score === undefined ? '' : `相似度 ${source.score.toFixed(2)}`,
      opening: '',
      notes: '',
      tags: [source.category || 'knowledge']
    })),
    recommendations: [],
    modelProvider: `RAG Backend ${data?.model_used || 'AI'}`
  }
}

export function mapRagStreamDone(event: Extract<RagStreamEvent, { type: 'done' }>): ChatResponse {
  const answer = event.answer?.trim()
  if (!answer) throw new Error('RAG backend returned an empty streamed answer')

  return {
    answer,
    emotion: event.emotion || 'calm',
    speechText: answer.replace(/「|」|->/g, ' '),
    references: (event.sources || []).map((source, index) => ({
      id: `rag-${index + 1}`,
      name: source.title || `知识来源 ${index + 1}`,
      scenicArea: source.category || 'RAG 知识库',
      position: '',
      parameters: '',
      coreFunction: source.type || '',
      culture: '',
      detail: source.title || '',
      highlights: source.score === undefined ? '' : `相似度 ${source.score.toFixed(2)}`,
      opening: '',
      notes: '',
      tags: [source.category || 'knowledge']
    })),
    recommendations: [],
    modelProvider: `RAG Backend ${event.model_used || 'AI'}`
  }
}
