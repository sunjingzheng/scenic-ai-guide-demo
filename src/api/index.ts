import { apiGet, apiPost, apiPut } from './http'
import { readStored, writeStored } from './storage'
import type { ChatResponse, FeedbackPayload } from '../types'

export const api = {
  getSpots() {
    return apiGet('/api/spots').then((r) => r.data)
  },

  getRoutes() {
    return apiGet('/api/routes').then((r) => r.data)
  },

  async recommendRoutes(interest: string) {
    const routes = await apiGet('/api/routes', { params: { interest } }).then((r) => r.data)
    return routes.length ? routes : apiGet('/api/routes').then((r) => r.data)
  },

  async chatStream(
    payload: any,
    handlers: {
      onDelta?: (delta: string) => void
    } = {}
  ): Promise<ChatResponse> {
    const response = await fetch('http://localhost:8000/api/guide/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: payload.sessionId,
        text: payload.text,
        interest: payload.interest,
        inputType: payload.imageUrls?.length ? 'image' : 'text',
        location: payload.location,
        imageUrls: payload.imageUrls || []
      })
    })

    if (!response.ok || !response.body) {
      throw new Error(`Stream request failed: ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let result: ChatResponse = {
      answer: '',
      emotion: 'calm',
      speechText: '',
      references: [],
      recommendations: [],
      modelProvider: 'AI Stream'
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      let hasDelta = false
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const dataStr = line.slice(6).trim()
        if (!dataStr) continue

        try {
          const event = JSON.parse(dataStr)

          if (event.type === 'delta') {
            handlers.onDelta?.(event.delta)
            result.answer += event.delta
            hasDelta = true
          } else if (event.type === 'meta') {
            result.emotion = event.emotion || 'calm'
            result.references = event.references || []
            result.recommendations = event.recommendations || []
            result.modelProvider = event.modelProvider || 'AI Stream'
          } else if (event.type === 'done') {
            result.answer = event.answer || result.answer
            result.emotion = event.emotion || result.emotion
            result.speechText = event.speechText || result.answer
            result.references = event.references || result.references
            result.recommendations = event.recommendations || result.recommendations
          }
        } catch {
          // 跳过解析失败的行
        }
      }

      if (hasDelta) {
        // 每个网络包的 delta 处理完让出主线程，给浏览器渲染一帧
        await new Promise(r => setTimeout(r, 0))
      }
    }

    return result
  },

  async getAIConfig() {
    try {
      const stored = readStored('scenic.ai.config')
      const remote = await apiGet('/api/config/ai').then((r) => r.data)
      return { ...stored, ...remote }
    } catch {
      return readStored('scenic.ai.config') || null
    }
  },

  async getTTSConfig() {
    try {
      const stored = readStored('scenic.tts.config')
      const remote = await apiGet('/api/config/tts').then((r) => r.data)
      return { ...stored, ...remote }
    } catch {
      return readStored('scenic.tts.config') || null
    }
  },

  async getAvatar() {
    try {
      const stored = readStored('scenic.avatar.config')
      const remote = await apiGet('/api/config/avatar').then((r) => r.data)
      return { ...stored, ...remote }
    } catch {
      return readStored('scenic.avatar.config') || null
    }
  },

  saveAvatar(config: any) {
    writeStored('scenic.avatar.config', config)
    return apiPut('/api/config/avatar', { value: config })
      .then((r) => ({ ok: true, config: r.data }))
      .catch(() => ({ ok: true, config }))
  },

  saveAIConfig(config: any) {
    writeStored('scenic.ai.config', config)
    return apiPut('/api/config/ai', { value: config })
      .then((r) => ({ ok: true, config: r.data }))
      .catch(() => ({ ok: true, config }))
  },

  saveTTSConfig(config: any) {
    writeStored('scenic.tts.config', config)
    return apiPut('/api/config/tts', { value: config })
      .then((r) => ({ ok: true, config: r.data }))
      .catch(() => ({ ok: true, config }))
  },

  submitFeedback(payload: FeedbackPayload) {
    return apiPost('/api/feedback', payload).then((r) => r.data)
  },

  getOutfits(): Promise<any[]> {
    return apiGet('/api/outfits').then((r) => r.data)
  }
}

export default api
