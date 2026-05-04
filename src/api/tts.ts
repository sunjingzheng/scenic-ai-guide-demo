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
  const response = await apiPost(endpoint, buildGptSoVitsPayload(text, config), {
    responseType: 'arraybuffer'
  })
  const headerValue = response.headers['content-type'] || response.headers['Content-Type'] || 'audio/wav'
  const contentType = Array.isArray(headerValue) ? headerValue[0] : String(headerValue)

  return {
    buffer: response.data as ArrayBuffer,
    contentType
  }
}
