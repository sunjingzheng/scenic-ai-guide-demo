import { apiPost } from './http'

function buildGptSoVitsPayload(text: string, config: any) {
  const gptSoVits = config.gptSoVits
  if (!gptSoVits?.refAudioPath || !gptSoVits.promptText) {
    throw new Error('GPT-SoVITS zero-shot 需要在 data/tts-config.json 里配置 refAudioPath 和 promptText')
  }

  return {
    text,
    text_lang: gptSoVits.textLang || config.language || 'zh',
    ref_audio_path: gptSoVits.refAudioPath,
    aux_ref_audio_paths: gptSoVits.auxRefAudioPaths || [],
    prompt_text: gptSoVits.promptText,
    prompt_lang: gptSoVits.promptLang || 'zh',
    top_k: gptSoVits.topK ?? 15,
    top_p: gptSoVits.topP ?? 1,
    temperature: gptSoVits.temperature ?? 1,
    text_split_method: gptSoVits.textSplitMethod || 'cut5',
    batch_size: gptSoVits.batchSize ?? 1,
    speed_factor: gptSoVits.speedFactor ?? 1,
    media_type: gptSoVits.mediaType || 'wav',
    streaming_mode: gptSoVits.streamingMode ?? false,
    parallel_infer: gptSoVits.parallelInfer ?? true,
    repetition_penalty: gptSoVits.repetitionPenalty ?? 1.35,
    sample_steps: gptSoVits.sampleSteps ?? 32,
    super_sampling: gptSoVits.ifSr ?? false
  }
}

export async function requestGptSoVitsTTS(text: string, config: any) {
  const endpoint = `${config.baseUrl.replace(/\/$/, '')}${config.apiPath || '/tts'}`
  const isGptSoVits = config.provider === 'gpt-sovits-v2-pro-plus' || config.provider === 'gpt-sovits'
  const isEmotionTTS = config.provider === 'emotiontts' || config.provider === 'emotion-tts'
  const payload = isGptSoVits
    ? buildGptSoVitsPayload(text, config)
    : isEmotionTTS
      ? {
          model: config.emotionTTS?.model || 'emotionTTS',
          input: text,
          text,
          voice: config.emotionTTS?.voice || config.speaker || '宵宫',
          speaker: config.emotionTTS?.voice || config.speaker || '宵宫',
          response_format: config.emotionTTS?.responseFormat || 'wav',
          speed: config.emotionTTS?.speed ?? 1
        }
    : {
        text,
        speaker: config.speaker,
        language: config.language
      }
  const headers = config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : undefined
  const response = await apiPost(endpoint, payload, {
    responseType: 'arraybuffer',
    headers
  })
  const headerValue = response.headers['content-type'] || response.headers['Content-Type'] || 'audio/wav'
  const contentType = Array.isArray(headerValue) ? headerValue[0] : String(headerValue)

  return {
    buffer: response.data as ArrayBuffer,
    contentType
  }
}
