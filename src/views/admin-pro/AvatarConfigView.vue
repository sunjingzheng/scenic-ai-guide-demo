<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined, SaveOutlined, UndoOutlined, UserOutlined } from '@ant-design/icons-vue'
import AvatarGuide from '../../components/AvatarGuide.vue'
import { useGuideStore } from '../../stores/useGuideStore'
import type { BridgeConfig, Live2DConfig, RuntimeAIConfig, TTSConfig } from '../../types'

const store = useGuideStore()

const outfits = [
  { label: '禅意青绿', value: '禅意青绿' },
  { label: '太湖雅白', value: '太湖雅白' },
  { label: '非遗绛红', value: '非遗绛红' }
]
const emotions = [
  { label: '中性', value: 'neutral' },
  { label: '微笑', value: 'happy' },
  { label: '思考', value: 'thinking' }
]

const defaultLive2DConfig: Live2DConfig = {
  enabled: true,
  assetBase: '/live2d',
  modelUrl: 'Resources/Hiyori_pro/hiyori_pro_t11.model3.json',
  coreUrl: 'Core/live2dcubismcore.js',
  pixiUrl: '/live2d/vendor/pixi-legacy.min.js',
  runtimeUrl: '/live2d/vendor/cubism4.min.js',
  modelPreset: 'hiyori_pro',
  models: [
    {
      id: 'hiyori_pro',
      name: 'Hiyori Pro',
      assetBase: '/live2d',
      modelUrl: 'Resources/Hiyori_pro/hiyori_pro_t11.model3.json',
      coreUrl: 'Core/live2dcubismcore.js'
    },
    {
      id: 'hiyori',
      name: 'Hiyori',
      assetBase: '/live2d',
      modelUrl: 'Resources/Hiyori/Hiyori.model3.json',
      coreUrl: 'Core/live2dcubismcore.js'
    }
  ]
}

const activeTab = ref('basic')
const loading = ref(true)
const loadState = ref('')
const saveState = ref('')

const aiForm = ref<RuntimeAIConfig | null>(null)
const ttsForm = ref<TTSConfig | null>(null)
const bridgeForm = ref<BridgeConfig | null>(null)

function cloneConfig<T>(value: T): T {
  if (value === null || value === undefined) return value
  return JSON.parse(JSON.stringify(value))
}

const config = ref({
  outfit: '禅意青绿',
  defaultEmotion: 'happy',
  voiceEnabled: true,
  voiceSpeed: 1.02,
  live2d: cloneConfig(defaultLive2DConfig),
  autoGreeting: true,
  greetingText: '您好！我是灵山胜境的AI导览员，很高兴为您服务。'
})

const currentLive2DModelName = computed(() => {
  const live2d = config.value.live2d
  return live2d.models?.find((item) => item.id === live2d.modelPreset)?.name || '自定义模型'
})
const currentEmotionLabel = computed(() => {
  return emotions.find((item) => item.value === config.value.defaultEmotion)?.label || config.value.defaultEmotion
})

onMounted(loadAllConfig)

async function loadAllConfig() {
  loading.value = true
  loadState.value = ''

  try {
    const results = await Promise.allSettled([
      store.loadAvatarConfig(),
      store.loadAIConfig(),
      store.loadTTSConfig(),
      store.loadBridgeConfig()
    ])

    loadState.value = results.some((item) => item.status === 'rejected') ? '部分配置读取失败，已使用默认配置' : ''
    config.value = {
      ...config.value,
      outfit: store.avatarConfig.outfit,
      defaultEmotion: store.avatarConfig.defaultEmotion || config.value.defaultEmotion,
      autoGreeting: store.avatarConfig.autoGreeting ?? config.value.autoGreeting,
      greetingText: store.avatarConfig.greetingText || config.value.greetingText,
      voiceEnabled: store.avatarConfig.voiceEnabled ?? true,
      voiceSpeed: store.avatarConfig.voiceSpeed ?? 1.02,
      live2d: cloneConfig({
        ...defaultLive2DConfig,
        ...(store.avatarConfig.live2d || {}),
        models: store.avatarConfig.live2d?.models || defaultLive2DConfig.models
      })
    }
    aiForm.value = cloneConfig(store.aiConfig)
    ttsForm.value = cloneConfig(store.ttsConfig)
    bridgeForm.value = cloneConfig(store.bridgeConfig)
    void store.refreshTTSStatus()
  } catch (error) {
    console.error(error)
    loadState.value = error instanceof Error ? error.message : '配置加载失败，请点恢复默认后重试'
  } finally {
    loading.value = false
  }
}

async function saveConfig() {
  updateActiveTTSProvider()
  await store.saveAvatar({
    ...store.avatarConfig,
    outfit: config.value.outfit,
    defaultEmotion: config.value.defaultEmotion,
    autoGreeting: config.value.autoGreeting,
    greetingText: config.value.greetingText,
    voiceEnabled: config.value.voiceEnabled,
    voiceSpeed: config.value.voiceSpeed,
    ttsSpeaker: ttsForm.value?.speaker || store.avatarConfig.ttsSpeaker,
    ttsLanguage: ttsForm.value?.language || store.avatarConfig.ttsLanguage,
    preferLocalTTS: Boolean(ttsForm.value?.enabled),
    live2d: config.value.live2d
  })

  if (aiForm.value) await store.saveAIConfig(aiForm.value)
  if (ttsForm.value) await store.saveTTSConfig(ttsForm.value)
  if (bridgeForm.value) await store.saveBridgeConfig(bridgeForm.value)
  await store.refreshTTSStatus()

  saveState.value = '已保存'
  message.success('数字人配置已保存')
  window.setTimeout(() => (saveState.value = ''), 2000)
}

function previewVoice() {
  void store.speak(config.value.greetingText)
}

function resetLive2D() {
  config.value.live2d = cloneConfig(defaultLive2DConfig)
}

function resetAllLocalConfig() {
  localStorage.removeItem('scenic.avatar.config')
  localStorage.removeItem('scenic.ai.config')
  localStorage.removeItem('scenic.tts.config')
  localStorage.removeItem('scenic.bridge.config')
  message.success('已恢复默认配置')
  void loadAllConfig()
}

function applyLive2DPreset() {
  const live2d = config.value.live2d
  const preset = live2d.models?.find((item) => item.id === live2d.modelPreset)
  if (!preset) return
  live2d.assetBase = preset.assetBase
  live2d.modelUrl = preset.modelUrl
  live2d.coreUrl = preset.coreUrl
}

function addLive2DModel() {
  config.value.live2d.models = [
    ...(config.value.live2d.models || []),
    {
      id: `custom_${Date.now()}`,
      name: '自定义模型',
      assetBase: config.value.live2d.assetBase || '/live2d',
      modelUrl: config.value.live2d.modelUrl || 'Resources/Hiyori_pro/hiyori_pro_t11.model3.json',
      coreUrl: config.value.live2d.coreUrl || 'Core/live2dcubismcore.js'
    }
  ]
}

function removeLive2DModel(index: number) {
  const models = config.value.live2d.models || []
  const removed = models[index]
  config.value.live2d.models = models.filter((_, itemIndex) => itemIndex !== index)
  if (removed?.id === config.value.live2d.modelPreset) {
    config.value.live2d.modelPreset = config.value.live2d.models[0]?.id || ''
    applyLive2DPreset()
  }
}

function activeTTSProvider() {
  if (!ttsForm.value?.providers || !ttsForm.value.activeProvider) return null
  return ttsForm.value.providers[ttsForm.value.activeProvider] || null
}

function syncActiveTTSProvider() {
  const provider = activeTTSProvider()
  if (!ttsForm.value || !provider) return
  ttsForm.value.provider = provider.engine || ttsForm.value.provider
  ttsForm.value.baseUrl = provider.baseUrl
  ttsForm.value.apiPath = provider.apiPath
  ttsForm.value.apiKey = provider.apiKey
  ttsForm.value.speaker = provider.speaker
  ttsForm.value.language = provider.language
  ttsForm.value.gptSoVits = provider.gptSoVits || ttsForm.value.gptSoVits
}

function updateActiveTTSProvider() {
  const provider = activeTTSProvider()
  if (!ttsForm.value || !provider) return
  provider.engine = ttsForm.value.provider
  provider.baseUrl = ttsForm.value.baseUrl
  provider.apiPath = ttsForm.value.apiPath
  provider.apiKey = ttsForm.value.apiKey
  provider.speaker = ttsForm.value.speaker
  provider.language = ttsForm.value.language
  if (ttsForm.value.provider === 'gpt-sovits-v2-pro-plus') provider.gptSoVits = ttsForm.value.gptSoVits
}

function addTTSProvider() {
  if (!ttsForm.value) return
  const key = `custom_tts_${Date.now()}`
  ttsForm.value.providers = {
    ...(ttsForm.value.providers || {}),
    [key]: {
      type: 'http-tts',
      name: '自定义 TTS',
      engine: 'http-tts',
      baseUrl: 'http://localhost:9880',
      apiPath: '/tts/generate',
      apiKey: '',
      speaker: 'default',
      language: 'zh',
      speakerMode: 'text'
    }
  }
  ttsForm.value.activeProvider = key
  syncActiveTTSProvider()
}

function removeTTSProvider(key: string) {
  if (!ttsForm.value?.providers) return
  const nextProviders = { ...ttsForm.value.providers }
  delete nextProviders[key]
  ttsForm.value.providers = nextProviders
  if (ttsForm.value.activeProvider === key) {
    ttsForm.value.activeProvider = Object.keys(nextProviders)[0] || ''
    syncActiveTTSProvider()
  }
}

function addAIProvider() {
  if (!aiForm.value) return
  const key = `custom_ai_${Date.now()}`
  aiForm.value.providers = {
    ...aiForm.value.providers,
    [key]: {
      type: 'openai-compatible',
      name: '自定义 AI',
      baseUrl: 'https://api.example.com/v1',
      apiPath: '/chat/completions',
      apiKey: '',
      model: 'gpt-4o-mini',
      maxTokens: 1024,
      temperature: 0.7,
      thinkingBudgetTokens: 0,
      enabledToolsets: [],
      systemPrompt: '你是景区 AI 数字人导览员。'
    }
  }
  aiForm.value.activeProvider = key
}

function removeAIProvider(key: string) {
  if (!aiForm.value || key === 'local_rag') return
  const providers = { ...aiForm.value.providers }
  delete providers[key]
  aiForm.value.providers = providers
  if (aiForm.value.activeProvider === key) {
    aiForm.value.activeProvider = Object.keys(providers)[0] || 'local_rag'
  }
}

function keys(value: Record<string, unknown> | undefined) {
  return Object.keys(value || {})
}

function aiProviderValue(key: string) {
  return aiForm.value?.providers?.[key]
}

function ttsProviderValue(key: string) {
  return ttsForm.value?.providers?.[key]
}
</script>

<template>
  <div class="avatar-config-page">
    <div class="page-header glass-card">
      <div>
        <h1>数字人配置</h1>
        <p>不改代码，直接在这里配置模型、AI、TTS、微信桥接和欢迎行为。</p>
      </div>
      <a-space wrap>
        <a-button @click="resetAllLocalConfig">
          <UndoOutlined />
          恢复默认
        </a-button>
        <a-button type="primary" @click="saveConfig">
          <SaveOutlined />
          保存配置
        </a-button>
      </a-space>
    </div>

    <a-row :gutter="[24, 24]">
      <a-col :xs="24" :lg="8">
        <a-card class="neo-card preview-card" :bordered="false">
          <template #title>
            <a-space>
              <UserOutlined />
              实时预览
            </a-space>
          </template>
          <div class="avatar-preview">
            <AvatarGuide
              :speaking="false"
              :emotion="config.defaultEmotion"
              :outfit="config.outfit"
              :live2d="config.live2d"
            />
          </div>
          <a-descriptions :column="1" size="small" class="preview-descriptions">
            <a-descriptions-item label="形象">{{ config.outfit }}</a-descriptions-item>
            <a-descriptions-item label="表情">{{ currentEmotionLabel }}</a-descriptions-item>
            <a-descriptions-item label="模型">{{ currentLive2DModelName }}</a-descriptions-item>
            <a-descriptions-item label="TTS">
              {{ store.ttsStatus?.healthy ? '本地服务已连接' : '浏览器语音回退' }}
            </a-descriptions-item>
          </a-descriptions>
          <a-alert v-if="loadState" type="warning" :message="loadState" show-icon />
          <a-alert v-if="saveState" type="success" :message="saveState" show-icon />
        </a-card>
      </a-col>

      <a-col :xs="24" :lg="16">
        <a-spin :spinning="loading">
          <a-card class="neo-card" :bordered="false">
            <a-tabs v-model:activeKey="activeTab" type="card">
              <a-tab-pane key="basic" tab="基础">
                <a-form layout="vertical">
                  <a-row :gutter="16">
                    <a-col :xs="24" :md="12">
                      <a-form-item label="服装风格">
                        <a-segmented v-model:value="config.outfit" :options="outfits" block />
                      </a-form-item>
                    </a-col>
                    <a-col :xs="24" :md="12">
                      <a-form-item label="默认表情">
                        <a-segmented v-model:value="config.defaultEmotion" :options="emotions" block />
                      </a-form-item>
                    </a-col>
                    <a-col :xs="24" :md="12">
                      <a-form-item label="启用语音播报">
                        <a-switch v-model:checked="config.voiceEnabled" />
                      </a-form-item>
                    </a-col>
                    <a-col :xs="24" :md="12">
                      <a-form-item label="语音速度">
                        <a-slider v-model:value="config.voiceSpeed" :min="0.5" :max="2" :step="0.1" />
                      </a-form-item>
                    </a-col>
                    <a-col :xs="24" :md="12">
                      <a-form-item label="自动欢迎语">
                        <a-switch v-model:checked="config.autoGreeting" />
                      </a-form-item>
                    </a-col>
                    <a-col :span="24">
                      <a-form-item label="欢迎语内容">
                        <a-textarea v-model:value="config.greetingText" :rows="3" />
                      </a-form-item>
                    </a-col>
                  </a-row>
                  <a-button @click="previewVoice">试听语音</a-button>
                </a-form>
              </a-tab-pane>

              <a-tab-pane key="live2d" tab="Live2D">
                <a-form layout="vertical">
                  <a-row :gutter="16">
                    <a-col :xs="24" :md="8">
                      <a-form-item label="启用 Live2D">
                        <a-switch v-model:checked="config.live2d.enabled" />
                      </a-form-item>
                    </a-col>
                    <a-col :xs="24" :md="16">
                      <a-form-item label="模型预设">
                        <a-select v-model:value="config.live2d.modelPreset" @change="applyLive2DPreset">
                          <a-select-option v-for="model in config.live2d.models || []" :key="model.id" :value="model.id">
                            {{ model.name }}
                          </a-select-option>
                        </a-select>
                      </a-form-item>
                    </a-col>
                    <a-col :xs="24" :md="12">
                      <a-form-item label="资源根地址">
                        <a-input v-model:value="config.live2d.assetBase" />
                      </a-form-item>
                    </a-col>
                    <a-col :xs="24" :md="12">
                      <a-form-item label="模型文件 model3.json">
                        <a-input v-model:value="config.live2d.modelUrl" />
                      </a-form-item>
                    </a-col>
                    <a-col :xs="24" :md="12">
                      <a-form-item label="Cubism Core">
                        <a-input v-model:value="config.live2d.coreUrl" />
                      </a-form-item>
                    </a-col>
                    <a-col :xs="24" :md="12">
                      <a-form-item label="Pixi 脚本">
                        <a-input v-model:value="config.live2d.pixiUrl" />
                      </a-form-item>
                    </a-col>
                    <a-col :span="24">
                      <a-form-item label="Pixi Live2D Cubism4 运行时">
                        <a-input v-model:value="config.live2d.runtimeUrl" />
                      </a-form-item>
                    </a-col>
                  </a-row>
                  <a-divider>模型预设管理</a-divider>
                  <a-space direction="vertical" size="middle" class="full-width">
                    <a-card v-for="(model, index) in config.live2d.models || []" :key="model.id" class="inner-card" :bordered="false">
                      <a-row :gutter="12">
                        <a-col :xs="24" :md="8"><a-input v-model:value="model.id" addon-before="ID" /></a-col>
                        <a-col :xs="24" :md="8"><a-input v-model:value="model.name" addon-before="名称" /></a-col>
                        <a-col :xs="24" :md="8"><a-input v-model:value="model.assetBase" addon-before="资源" /></a-col>
                        <a-col :xs="24" :md="12"><a-input v-model:value="model.modelUrl" addon-before="模型" /></a-col>
                        <a-col :xs="24" :md="12"><a-input v-model:value="model.coreUrl" addon-before="Core" /></a-col>
                      </a-row>
                      <a-button danger ghost class="row-action" @click="removeLive2DModel(index)">删除预设</a-button>
                    </a-card>
                    <a-space>
                      <a-button type="dashed" @click="addLive2DModel"><PlusOutlined />添加模型预设</a-button>
                      <a-button @click="resetLive2D">恢复 Hiyori 默认</a-button>
                    </a-space>
                  </a-space>
                </a-form>
              </a-tab-pane>

              <a-tab-pane key="tts" tab="TTS">
                <a-empty v-if="!ttsForm" description="TTS 配置未加载" />
                <a-form v-else layout="vertical">
                  <a-row :gutter="16">
                    <a-col :xs="24" :md="8">
                      <a-form-item label="启用 TTS">
                        <a-switch v-model:checked="ttsForm.enabled" />
                      </a-form-item>
                    </a-col>
                    <a-col :xs="24" :md="16">
                      <a-form-item label="当前 Provider">
                        <a-select v-model:value="ttsForm.activeProvider" @change="syncActiveTTSProvider">
                          <a-select-option v-for="key in keys(ttsForm.providers)" :key="key" :value="key">
                            {{ ttsForm.providers?.[key]?.name || key }}
                          </a-select-option>
                        </a-select>
                      </a-form-item>
                    </a-col>
                    <a-col :xs="24" :md="12"><a-form-item label="服务地址"><a-input v-model:value="ttsForm.baseUrl" /></a-form-item></a-col>
                    <a-col :xs="24" :md="12"><a-form-item label="接口路径"><a-input v-model:value="ttsForm.apiPath" /></a-form-item></a-col>
                    <a-col :xs="24" :md="12">
                      <a-form-item label="TTS 引擎">
                        <a-select v-model:value="ttsForm.provider">
                          <a-select-option value="gpt-sovits-v2-pro-plus">GPT-SoVITS V2ProPlus</a-select-option>
                          <a-select-option value="edge-tts">Edge-TTS</a-select-option>
                          <a-select-option value="moss-tts-nano">MOSS-TTS-Nano</a-select-option>
                          <a-select-option value="http-tts">通用 HTTP TTS</a-select-option>
                        </a-select>
                      </a-form-item>
                    </a-col>
                    <a-col :xs="24" :md="12"><a-form-item label="API Key"><a-input-password v-model:value="ttsForm.apiKey" /></a-form-item></a-col>
                    <a-col :xs="24" :md="12"><a-form-item label="Speaker / 音色"><a-input v-model:value="ttsForm.speaker" /></a-form-item></a-col>
                    <a-col :xs="24" :md="12"><a-form-item label="语言"><a-input v-model:value="ttsForm.language" /></a-form-item></a-col>
                  </a-row>

                  <a-card v-if="ttsForm.provider === 'gpt-sovits-v2-pro-plus' && ttsForm.gptSoVits" class="inner-card" :bordered="false">
                    <template #title>GPT-SoVITS Zero-Shot</template>
                    <a-row :gutter="16">
                      <a-col :span="24"><a-form-item label="参考音频路径"><a-input v-model:value="ttsForm.gptSoVits.refAudioPath" /></a-form-item></a-col>
                      <a-col :span="24"><a-form-item label="参考音频文本"><a-textarea v-model:value="ttsForm.gptSoVits.promptText" :rows="3" /></a-form-item></a-col>
                      <a-col :xs="24" :md="12"><a-form-item label="参考语言"><a-input v-model:value="ttsForm.gptSoVits.promptLang" /></a-form-item></a-col>
                      <a-col :xs="24" :md="12"><a-form-item label="文本切分"><a-input v-model:value="ttsForm.gptSoVits.textSplitMethod" /></a-form-item></a-col>
                    </a-row>
                  </a-card>

                  <a-divider>TTS Provider 管理</a-divider>
                  <a-collapse>
                    <a-collapse-panel v-for="key in keys(ttsForm.providers)" :key="key" :header="ttsForm.providers?.[key]?.name || key">
                      <div v-if="ttsProviderValue(key)">
                        <a-row :gutter="12">
                          <a-col :xs="24" :md="8"><a-form-item label="名称"><a-input v-model:value="ttsProviderValue(key)!.name" /></a-form-item></a-col>
                          <a-col :xs="24" :md="8"><a-form-item label="引擎"><a-input v-model:value="ttsProviderValue(key)!.engine" /></a-form-item></a-col>
                          <a-col :xs="24" :md="8"><a-form-item label="Base URL"><a-input v-model:value="ttsProviderValue(key)!.baseUrl" /></a-form-item></a-col>
                          <a-col :xs="24" :md="8"><a-form-item label="API Path"><a-input v-model:value="ttsProviderValue(key)!.apiPath" /></a-form-item></a-col>
                          <a-col :xs="24" :md="8"><a-form-item label="Speaker"><a-input v-model:value="ttsProviderValue(key)!.speaker" /></a-form-item></a-col>
                          <a-col :xs="24" :md="8"><a-form-item label="Language"><a-input v-model:value="ttsProviderValue(key)!.language" /></a-form-item></a-col>
                        </a-row>
                        <a-button danger ghost @click="removeTTSProvider(key)">删除 Provider</a-button>
                      </div>
                    </a-collapse-panel>
                  </a-collapse>
                  <a-button type="dashed" class="block-action" @click="addTTSProvider"><PlusOutlined />添加 TTS Provider</a-button>
                </a-form>
              </a-tab-pane>

              <a-tab-pane key="ai" tab="AI">
                <a-empty v-if="!aiForm" description="AI 配置未加载" />
                <a-form v-else layout="vertical">
                  <a-row :gutter="16">
                    <a-col :xs="24" :md="16">
                      <a-form-item label="当前 AI Provider">
                        <a-select v-model:value="aiForm.activeProvider">
                          <a-select-option v-for="key in keys(aiForm.providers)" :key="key" :value="key">
                            {{ aiForm.providers[key].name }}
                          </a-select-option>
                        </a-select>
                      </a-form-item>
                    </a-col>
                    <a-col :xs="24" :md="8"><a-form-item label="上下文轮数"><a-input-number v-model:value="aiForm.contextWindowRounds" :min="1" :max="20" class="full-width" /></a-form-item></a-col>
                  </a-row>

                  <a-card v-if="aiForm.ragBackend" class="inner-card" :bordered="false">
                    <template #title>RAG 知识库后端</template>
                    <a-row :gutter="16">
                      <a-col :xs="24" :md="8">
                        <a-form-item label="启用后端知识库">
                          <a-switch v-model:checked="aiForm.ragBackend.enabled" />
                        </a-form-item>
                      </a-col>
                      <a-col :xs="24" :md="16"><a-form-item label="后端地址"><a-input v-model:value="aiForm.ragBackend.baseUrl" /></a-form-item></a-col>
                      <a-col :xs="24" :md="8"><a-form-item label="聊天路径"><a-input v-model:value="aiForm.ragBackend.chatPath" /></a-form-item></a-col>
                      <a-col :xs="24" :md="8"><a-form-item label="流式路径"><a-input v-model:value="aiForm.ragBackend.chatStreamPath" /></a-form-item></a-col>
                      <a-col :xs="24" :md="8"><a-form-item label="后端模型类型"><a-input v-model:value="aiForm.ragBackend.modelType" /></a-form-item></a-col>
                      <a-col :xs="24" :md="8"><a-form-item label="后端访问 Token"><a-input-password v-model:value="aiForm.ragBackend.authToken" /></a-form-item></a-col>
                    </a-row>
                  </a-card>

                  <a-collapse>
                    <a-collapse-panel v-for="key in keys(aiForm.providers)" :key="key" :header="aiForm.providers[key].name">
                      <div v-if="aiProviderValue(key)">
                        <a-row :gutter="12">
                          <a-col :xs="24" :md="8"><a-form-item label="名称"><a-input v-model:value="aiProviderValue(key)!.name" /></a-form-item></a-col>
                          <a-col :xs="24" :md="8"><a-form-item label="Base URL"><a-input v-model:value="aiProviderValue(key)!.baseUrl" /></a-form-item></a-col>
                          <a-col :xs="24" :md="8"><a-form-item label="API Path"><a-input v-model:value="aiProviderValue(key)!.apiPath" /></a-form-item></a-col>
                          <a-col :xs="24" :md="8"><a-form-item label="API Key"><a-input-password v-model:value="aiProviderValue(key)!.apiKey" /></a-form-item></a-col>
                          <a-col :xs="24" :md="8"><a-form-item label="模型"><a-input v-model:value="aiProviderValue(key)!.model" /></a-form-item></a-col>
                          <a-col :xs="24" :md="8"><a-form-item label="最大 Token"><a-input-number v-model:value="aiProviderValue(key)!.maxTokens" :min="1" class="full-width" /></a-form-item></a-col>
                          <a-col :xs="24" :md="8"><a-form-item label="温度"><a-input-number v-model:value="aiProviderValue(key)!.temperature" :min="0" :max="2" :step="0.01" class="full-width" /></a-form-item></a-col>
                          <a-col :xs="24" :md="8"><a-form-item label="Thinking Token"><a-input-number v-model:value="aiProviderValue(key)!.thinkingBudgetTokens" :min="0" class="full-width" /></a-form-item></a-col>
                          <a-col :span="24"><a-form-item label="系统提示词"><a-textarea v-model:value="aiProviderValue(key)!.systemPrompt" :rows="4" /></a-form-item></a-col>
                        </a-row>
                        <a-button v-if="key !== 'local_rag'" danger ghost @click="removeAIProvider(key)">删除 Provider</a-button>
                      </div>
                    </a-collapse-panel>
                  </a-collapse>
                  <a-button type="dashed" class="block-action" @click="addAIProvider"><PlusOutlined />添加 AI Provider</a-button>
                </a-form>
              </a-tab-pane>

              <a-tab-pane key="bridge" tab="微信">
                <a-empty v-if="!bridgeForm" description="微信配置未加载" />
                <a-form v-else layout="vertical">
                  <a-card class="inner-card" :bordered="false">
                    <template #title>微信 iLink</template>
                    <a-row :gutter="16">
                      <a-col :xs="24" :md="8"><a-form-item label="启用微信桥接"><a-switch v-model:checked="bridgeForm.wechat.enabled" /></a-form-item></a-col>
                      <a-col :xs="24" :md="16"><a-form-item label="Base URL"><a-input v-model:value="bridgeForm.wechat.baseUrl" /></a-form-item></a-col>
                      <a-col :xs="24" :md="12"><a-form-item label="Token"><a-input-password v-model:value="bridgeForm.wechat.token" /></a-form-item></a-col>
                      <a-col :xs="24" :md="12"><a-form-item label="Account ID"><a-input v-model:value="bridgeForm.wechat.accountId" /></a-form-item></a-col>
                      <a-col :xs="24" :md="12"><a-form-item label="绑定会话 ID"><a-input v-model:value="bridgeForm.wechat.conversationId" /></a-form-item></a-col>
                      <a-col :xs="24" :md="12"><a-form-item label="消息分片延迟"><a-input-number v-model:value="bridgeForm.wechat.sendChunkDelay" :min="0" :step="0.05" class="full-width" /></a-form-item></a-col>
                    </a-row>
                  </a-card>
                  <a-card class="inner-card" :bordered="false">
                    <template #title>Discord 预留</template>
                    <a-row :gutter="16">
                      <a-col :xs="24" :md="8"><a-form-item label="启用 Discord"><a-switch v-model:checked="bridgeForm.discord.enabled" /></a-form-item></a-col>
                      <a-col :xs="24" :md="8"><a-form-item label="Token"><a-input-password v-model:value="bridgeForm.discord.token" /></a-form-item></a-col>
                      <a-col :xs="24" :md="8"><a-form-item label="代理"><a-input v-model:value="bridgeForm.discord.proxyUrl" /></a-form-item></a-col>
                    </a-row>
                  </a-card>
                </a-form>
              </a-tab-pane>
            </a-tabs>
          </a-card>
        </a-spin>
      </a-col>
    </a-row>
  </div>
</template>

<style scoped>
.avatar-config-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xl);
}

.page-header h1 {
  margin: 0 0 var(--spacing-xs);
  color: var(--text-primary);
  font-size: 1.75rem;
}

.page-header p {
  margin: 0;
  color: var(--text-secondary);
}

.neo-card,
.inner-card {
  background: var(--surface-raised);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
}

.preview-card {
  position: sticky;
  top: 24px;
}

.avatar-preview {
  display: flex;
  justify-content: center;
  min-height: 260px;
  padding: var(--spacing-xl) 0;
  border-radius: var(--radius-xl);
  background: var(--surface);
  box-shadow: var(--shadow-inset-sm);
}

.preview-descriptions {
  margin: var(--spacing-lg) 0;
}

.full-width {
  width: 100%;
}

.block-action {
  margin-top: var(--spacing-md);
}

.row-action {
  margin-top: var(--spacing-md);
}

:deep(.ant-card),
:deep(.ant-tabs-card > .ant-tabs-nav .ant-tabs-tab),
:deep(.ant-collapse),
:deep(.ant-collapse-item),
:deep(.ant-input),
:deep(.ant-input-number),
:deep(.ant-input-number-input),
:deep(.ant-select-selector),
:deep(.ant-segmented),
:deep(.ant-btn) {
  border-radius: var(--radius-lg) !important;
}

:deep(.ant-card),
:deep(.ant-tabs-content-holder),
:deep(.ant-collapse) {
  background: transparent;
}

:deep(.ant-input),
:deep(.ant-input-number),
:deep(.ant-select-selector),
:deep(.ant-segmented) {
  background: var(--surface) !important;
  border-color: rgba(255, 255, 255, 0.72) !important;
  box-shadow: var(--shadow-inset-sm) !important;
}

:deep(.ant-btn) {
  box-shadow: var(--shadow-sm);
}

:deep(.ant-btn-primary) {
  background: linear-gradient(145deg, #65b98b, #2f8f62);
  border-color: transparent;
}

@media (max-width: 1024px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .preview-card {
    position: static;
  }
}
</style>
