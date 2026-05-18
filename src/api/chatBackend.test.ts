import { describe, expect, it } from 'vitest'
import { buildRagChatRequest, buildRagStreamRequest, mapRagChatResponse, shouldUseRagBackend } from './chatBackend'
import type { RuntimeAIConfig } from '../types'

const ragConfig: RuntimeAIConfig = {
  activeProvider: 'doubao_ark_rag',
  contextWindowRounds: 6,
  ragBackend: {
    enabled: true,
    baseUrl: 'http://localhost:8000',
    chatPath: '/api/chat/',
    chatStreamPath: '/api/chat-stream/',
    modelType: 'doubao'
  },
  providers: {
    doubao_ark_rag: {
      type: 'openai-compatible',
      name: '豆包 RAG 知识库',
      baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
      apiPath: '/responses',
      apiKey: 'test-key',
      model: 'doubao-seed-2-0-pro-260215'
    }
  }
}

describe('chatBackend', () => {
  it('uses the RAG backend only when it is enabled and configured', () => {
    expect(shouldUseRagBackend(ragConfig)).toBe(true)
    expect(shouldUseRagBackend({ ...ragConfig, ragBackend: { ...ragConfig.ragBackend!, enabled: false } })).toBe(false)
    expect(shouldUseRagBackend({ ...ragConfig, ragBackend: { ...ragConfig.ragBackend!, baseUrl: '' } })).toBe(false)
  })

  it('builds a Django RAG chat request from the current message', () => {
    const request = buildRagChatRequest(ragConfig, {
      text: '灵山大佛多高？',
      sessionId: 'demo-session'
    })

    expect(request.url).toBe('http://localhost:8000/api/chat/')
    expect(request.data).toEqual({
      message: '灵山大佛多高？',
      session_id: 'demo-session',
      model_type: 'doubao',
      image_urls: []
    })
    expect(request.config).toEqual({})
  })

  it('builds a streaming Django RAG chat request from the current message', () => {
    const request = buildRagStreamRequest(ragConfig, {
      text: '九龙灌浴几点表演？',
      sessionId: 'demo-session'
    })

    expect(request.url).toBe('http://localhost:8000/api/chat-stream/')
    expect(request.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(request.data.message).toBe('九龙灌浴几点表演？')
    expect(request.data.image_urls).toEqual([])
  })

  it('maps Django RAG answers into the existing guide chat response shape', () => {
    const mapped = mapRagChatResponse({
      code: 200,
      data: {
        response_text: '灵山大佛佛像高88米。',
        emotion: 'smile',
        model_used: 'doubao',
        sources: [
          { title: '灵山大佛', category: 'history', score: 0.87, type: 'vector' }
        ]
      }
    })

    expect(mapped.answer).toBe('灵山大佛佛像高88米。')
    expect(mapped.emotion).toBe('smile')
    expect(mapped.speechText).toBe('灵山大佛佛像高88米。')
    expect(mapped.modelProvider).toBe('RAG Backend doubao')
    expect(mapped.references.map((item) => item.name)).toEqual(['灵山大佛'])
  })
})
