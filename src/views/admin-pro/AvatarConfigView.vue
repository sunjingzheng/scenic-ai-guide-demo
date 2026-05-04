<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useGuideStore } from '../../stores/useGuideStore'
import { UserOutlined, SaveOutlined } from '@ant-design/icons-vue'
import AvatarGuide from '../../components/AvatarGuide.vue'
import type { Live2DConfig, RuntimeAIConfig, TTSConfig } from '../../types'

const store = useGuideStore()

const outfits = ['formal', 'casual', 'traditional']
const emotions = ['neutral', 'happy', 'thinking']
const defaultLive2DConfig: Live2DConfig = {
  enabled: true,
  assetBase: 'https://cdn.jsdelivr.net/gh/luckui/ai-live2d-go@nightly/public',
  modelUrl: '',
  coreUrl: '',
  pixiUrl: 'https://cdn.jsdelivr.net/npm/pixi.js@6.5.10/dist/browser/pixi.min.js',
  runtimeUrl: 'https://cdn.jsdelivr.net/npm/pixi-live2d-display@0.4.0/dist/cubism4.min.js'
}

const config = ref({
  outfit: store.avatarConfig.outfit,
  defaultEmotion: 'neutral',
  voiceEnabled: store.avatarConfig.voiceEnabled ?? true,
  voiceSpeed: store.avatarConfig.voiceSpeed ?? 1.02,
  live2d: structuredClone(store.avatarConfig.live2d || defaultLive2DConfig),
  autoGreeting: true,
  greetingText: '您好！我是灵山胜境的AI导览员，很高兴为您服务。'
})

const aiForm = ref<RuntimeAIConfig | null>(null)
const ttsForm = ref<TTSConfig | null>(null)
const saveState = ref('')

onMounted(async () => {
  await Promise.all([store.loadAvatarConfig(), store.loadAIConfig(), store.loadTTSConfig(), store.refreshTTSStatus()])
  config.value = {
    ...config.value,
    outfit: store.avatarConfig.outfit,
    voiceEnabled: store.avatarConfig.voiceEnabled ?? true,
    voiceSpeed: store.avatarConfig.voiceSpeed ?? 1.02,
    live2d: structuredClone(store.avatarConfig.live2d || defaultLive2DConfig)
  }
  aiForm.value = structuredClone(store.aiConfig)
  ttsForm.value = structuredClone(store.ttsConfig)
})

async function saveConfig() {
  await store.saveAvatar({
    ...store.avatarConfig,
    outfit: config.value.outfit,
    voiceEnabled: config.value.voiceEnabled,
    voiceSpeed: config.value.voiceSpeed,
    ttsSpeaker: ttsForm.value?.speaker || store.avatarConfig.ttsSpeaker,
    ttsLanguage: ttsForm.value?.language || store.avatarConfig.ttsLanguage,
    preferLocalTTS: Boolean(ttsForm.value?.enabled),
    live2d: config.value.live2d
  })

  if (aiForm.value) await store.saveAIConfig(aiForm.value)
  if (ttsForm.value) await store.saveTTSConfig(ttsForm.value)
  await store.refreshTTSStatus()

  saveState.value = '已保存数字人配置'
  window.setTimeout(() => (saveState.value = ''), 2200)
}

function previewVoice() {
  void store.speak(config.value.greetingText)
}

function resetLive2D() {
  config.value.live2d = structuredClone(defaultLive2DConfig)
}
</script>

<template>
  <div class="avatar-config-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <div>
        <h1>数字人配置</h1>
        <p>自定义数字人导员的外观和行为设置</p>
      </div>
      <button class="btn btn-primary" @click="saveConfig">
        <SaveOutlined />
        保存配置
      </button>
    </div>

    <div class="config-grid">
      <!-- 预览区域 -->
      <div class="preview-section">
        <div class="section-card">
          <h3>
            <UserOutlined />
            实时预览
          </h3>
          <div class="avatar-preview">
            <AvatarGuide
              :speaking="false"
              :emotion="config.defaultEmotion"
              :outfit="config.outfit"
              :live2d="config.live2d"
            />
          </div>
          <div class="preview-info">
            <p>当前形象：{{ config.outfit }}</p>
            <p>默认表情：{{ config.defaultEmotion }}</p>
            <p v-if="store.ttsStatus">
              TTS：{{ store.ttsStatus.healthy ? '本地服务已连接' : '未连接，自动回退浏览器语音' }}
            </p>
            <p v-if="saveState">{{ saveState }}</p>
          </div>
        </div>
      </div>

      <!-- 配置区域 -->
      <div class="config-section">
        <!-- 外观设置 -->
        <div class="section-card">
          <h3>外观设置</h3>

          <div class="form-group">
            <label>服装风格</label>
            <div class="outfit-options">
              <button
                v-for="outfit in outfits"
                :key="outfit"
                class="outfit-btn"
                :class="{ active: config.outfit === outfit }"
                @click="config.outfit = outfit"
              >
                <div class="outfit-preview">
                  {{ outfit === 'formal' ? '👔' : outfit === 'casual' ? '👕' : '🥋' }}
                </div>
                <span>{{ outfit === 'formal' ? '正式' : outfit === 'casual' ? '休闲' : '传统' }}</span>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label>默认表情</label>
            <div class="emotion-options">
              <button
                v-for="emotion in emotions"
                :key="emotion"
                class="emotion-btn"
                :class="{ active: config.defaultEmotion === emotion }"
                @click="config.defaultEmotion = emotion"
              >
                {{ emotion === 'neutral' ? '😐 中性' : emotion === 'happy' ? '😊 微笑' : '🤔 思考' }}
              </button>
            </div>
          </div>
        </div>

        <!-- 语音设置 -->
        <div class="section-card">
          <h3>语音设置</h3>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="config.voiceEnabled" />
              <span>启用语音播报</span>
            </label>
          </div>

          <div class="form-group">
            <label>语音速度</label>
            <div class="slider-group">
              <input
                type="range"
                v-model.number="config.voiceSpeed"
                min="0.5"
                max="2"
                step="0.1"
                class="slider"
              />
              <span class="slider-value">{{ config.voiceSpeed }}x</span>
            </div>
          </div>

          <div class="form-group">
            <button class="btn btn-secondary" @click="previewVoice">
              试听语音
            </button>
          </div>
        </div>

        <!-- Live2D 设置 -->
        <div class="section-card">
          <h3>Live2D 模型</h3>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="config.live2d.enabled" />
              <span>启用 Live2D 模型</span>
            </label>
          </div>

          <div class="form-group">
            <label>资源根地址</label>
            <input
              v-model="config.live2d.assetBase"
              class="input"
              placeholder="https://cdn.jsdelivr.net/gh/luckui/ai-live2d-go@nightly/public"
            />
          </div>

          <div class="form-group">
            <label>模型文件地址（留空则使用 Hiyori 默认模型）</label>
            <input
              v-model="config.live2d.modelUrl"
              class="input"
              placeholder="Resources/Hiyori_pro/hiyori_pro_t11.model3.json"
            />
          </div>

          <div class="form-group">
            <label>Cubism Core 脚本（留空则使用资源根地址下的 Core）</label>
            <input v-model="config.live2d.coreUrl" class="input" placeholder="Core/live2dcubismcore.js" />
          </div>

          <div class="form-group">
            <label>Pixi 脚本</label>
            <input v-model="config.live2d.pixiUrl" class="input" />
          </div>

          <div class="form-group">
            <label>Pixi Live2D Cubism4 运行时</label>
            <input v-model="config.live2d.runtimeUrl" class="input" />
          </div>

          <div class="form-group">
            <button class="btn btn-secondary" @click="resetLive2D">
              恢复默认 Hiyori 配置
            </button>
          </div>
        </div>

        <!-- TTS 服务 -->
        <div v-if="ttsForm" class="section-card">
          <h3>GPT-SoVITS TTS（可选）</h3>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="ttsForm.enabled" />
              <span>使用 GPT-SoVITS V2ProPlus zero-shot 生成音频并驱动口型</span>
            </label>
          </div>

          <div v-if="ttsForm.enabled" class="form-group">
            <label>服务地址</label>
            <input v-model="ttsForm.baseUrl" class="input" placeholder="http://localhost:9880" />
          </div>

          <div v-if="ttsForm.enabled" class="form-group">
            <label>音色标记</label>
            <input v-model="ttsForm.speaker" class="input" placeholder="zero-shot" />
          </div>

          <div v-if="ttsForm.enabled" class="form-group">
            <label>合成语言</label>
            <input v-model="ttsForm.language" class="input" placeholder="zh" />
          </div>
        </div>

        <!-- LLM 设置 -->
        <div v-if="aiForm" class="section-card">
          <h3>AI 对话模型</h3>

          <div class="form-group">
            <label>当前服务商</label>
            <select v-model="aiForm.activeProvider" class="select">
              <option v-for="(provider, key) in aiForm.providers" :key="key" :value="key">
                {{ provider.name }}
              </option>
            </select>
          </div>

          <template v-if="aiForm.providers[aiForm.activeProvider]">
            <div class="form-group">
              <label>Base URL</label>
              <input
                v-model="aiForm.providers[aiForm.activeProvider].baseUrl"
                class="input"
                placeholder="https://api.example.com/v1"
              />
            </div>

            <div class="form-group">
              <label>API Key</label>
              <input
                v-model="aiForm.providers[aiForm.activeProvider].apiKey"
                class="input"
                type="password"
                autocomplete="off"
                placeholder="仅保存在当前浏览器 localStorage 中"
              />
            </div>

            <div class="form-group">
              <label>模型</label>
              <input v-model="aiForm.providers[aiForm.activeProvider].model" class="input" />
            </div>

            <div class="form-group">
              <label>系统提示词</label>
              <textarea
                v-model="aiForm.providers[aiForm.activeProvider].systemPrompt"
                class="textarea"
                rows="4"
              ></textarea>
            </div>
          </template>
        </div>

        <!-- 行为设置 -->
        <div class="section-card">
          <h3>行为设置</h3>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="config.autoGreeting" />
              <span>自动欢迎语</span>
            </label>
          </div>

          <div class="form-group">
            <label>欢迎语内容</label>
            <textarea
              v-model="config.greetingText"
              class="textarea"
              rows="3"
              placeholder="输入欢迎语..."
            ></textarea>
          </div>
        </div>
      </div>
    </div>
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
  align-items: flex-start;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.page-header p {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.config-grid {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: var(--spacing-xl);
}

.section-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
}

.section-card h3 {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-light);
}

/* 预览区域 */
.avatar-preview {
  display: flex;
  justify-content: center;
  padding: var(--spacing-2xl) 0;
  background: linear-gradient(135deg, var(--primary-50), var(--primary-100));
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-lg);
}

.preview-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  background: var(--gray-50);
  border-radius: var(--radius-md);
}

.preview-info p {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* 配置区域 */
.config-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

/* 服装选项 */
.outfit-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
}

.outfit-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg);
  border: 2px solid var(--border-light);
  background: white;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.outfit-btn:hover {
  border-color: var(--primary-300);
  background: var(--primary-50);
}

.outfit-btn.active {
  border-color: var(--primary-500);
  background: var(--primary-50);
}

.outfit-preview {
  font-size: 2.5rem;
}

.outfit-btn span {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.outfit-btn.active span {
  color: var(--primary-600);
  font-weight: 500;
}

/* 表情选项 */
.emotion-options {
  display: flex;
  gap: var(--spacing-sm);
}

.emotion-btn {
  flex: 1;
  padding: var(--spacing-md);
  border: 2px solid var(--border-light);
  background: white;
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-size: 0.875rem;
  transition: all var(--transition-fast);
}

.emotion-btn:hover {
  border-color: var(--primary-300);
  background: var(--primary-50);
}

.emotion-btn.active {
  border-color: var(--primary-500);
  background: var(--primary-50);
  color: var(--primary-600);
  font-weight: 500;
}

/* 复选框 */
.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkbox-label span {
  font-size: 0.875rem;
  color: var(--text-primary);
}

/* 滑块 */
.slider-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.slider {
  flex: 1;
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--gray-200);
  outline: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--primary-500);
  cursor: pointer;
}

.slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--primary-500);
  cursor: pointer;
  border: none;
}

.slider-value {
  min-width: 50px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}

/* 文本域 */
.textarea {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-family: inherit;
  resize: vertical;
  transition: all var(--transition-fast);
}

.textarea:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

@media (max-width: 1024px) {
  .config-grid {
    grid-template-columns: 1fr;
  }
}
</style>
