<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { ChevronDown, Compass, MapPin, Mic, Navigation, Search, Volume2 } from 'lucide-vue-next'

import overlookImage from '../assets/scenic/lingshan-overlook.svg'
import { useGuideStore } from '../stores/useGuideStore'
import type { Spot } from '../types'

type OverlookSpot = {
  id: string
  name: string
  subtitle: string
  x: number
  y: number
  scale: number
  prompt: string
}

const store = useGuideStore()
const stageRef = ref<HTMLElement | null>(null)
const selectedId = ref('LS-011')
const recognitionState = ref<'idle' | 'listening' | 'unsupported'>('idle')
const feedbackRating = ref(5)
const feedbackCategory = ref<'service' | 'route' | 'knowledge' | 'bug' | 'suggestion'>('service')
const feedbackContent = ref('')
const feedbackSent = ref(false)

const overlookSpots: OverlookSpot[] = [
  { id: 'LS-001', name: '灵山大照壁', subtitle: '入口序章', x: 50, y: 88, scale: 1.5, prompt: '从入口照壁开始讲解灵山胜境的文化序章。' },
  { id: 'LS-002', name: '五明桥', subtitle: '进入核心区', x: 50, y: 75, scale: 1.55, prompt: '讲讲五明桥为什么象征开启智慧。' },
  { id: 'LS-004', name: '五智门', subtitle: '核心门户', x: 50, y: 63, scale: 1.55, prompt: '讲讲五智门与五方五佛、六度波罗蜜。' },
  { id: 'LS-006', name: '九龙灌浴', subtitle: '动态演艺', x: 50, y: 47, scale: 1.75, prompt: '讲讲九龙灌浴的表演看点和建议到场时间。' },
  { id: 'LS-008', name: '阿育王柱', subtitle: '佛法东传', x: 50, y: 34, scale: 1.7, prompt: '讲讲阿育王柱的来历和象征意义。' },
  { id: 'LS-010', name: '祥符禅寺', subtitle: '千年古刹', x: 50, y: 24, scale: 1.65, prompt: '讲讲祥符禅寺的历史和礼佛注意事项。' },
  { id: 'LS-011', name: '灵山大佛', subtitle: '最高地标', x: 50, y: 15, scale: 1.72, prompt: '讲讲灵山大佛和抱佛脚的游览重点。' },
  { id: 'LS-013', name: '灵山梵宫', subtitle: '东方卢浮宫', x: 27.5, y: 50, scale: 1.62, prompt: '讲讲灵山梵宫的建筑艺术与演出安排。' },
  { id: 'LS-014', name: '五印坛城', subtitle: '湖心坛城', x: 73, y: 53, scale: 1.62, prompt: '讲讲五印坛城的藏式建筑和祈福体验。' }
]

const selectedSpot = computed(() => overlookSpots.find((spot) => spot.id === selectedId.value) || overlookSpots[0])
const selectedData = computed(() => findSpotData(selectedSpot.value))
const focusStyle = computed(() => ({
  '--focus-x': `${selectedSpot.value.x}%`,
  '--focus-y': `${selectedSpot.value.y}%`,
  '--focus-scale': selectedSpot.value.scale
}))
const guideLine = computed(() => {
  const hasUserMessage = store.messages.some((m) => m.role === 'user')
  if (hasUserMessage) {
    const lastAssistant = [...store.messages]
      .reverse()
      .find((m) => m.role === 'assistant' && m.text)
    if (lastAssistant?.text) return lastAssistant.text
  }
  return buildNarration(selectedSpot.value, selectedData.value)
})
const orderedStops = computed(() => overlookSpots.slice(0, 7))
const sideStops = computed(() => overlookSpots.slice(7))

onMounted(async () => {
  await store.loadBaseData()
  nextTick(() => focusSpot(selectedId.value, false))
})

function findSpotData(spot: OverlookSpot) {
  return store.spots.find((item) => item.id === spot.id || item.name === spot.name)
}

function buildNarration(spot: OverlookSpot, data?: Spot) {
  if (!data) return `${spot.name}位于灵山胜境导览图上的${spot.subtitle}区域。点击其它点位，我会把视角移动过去继续讲解。`
  const opening = data.opening ? `开放/演艺信息：${data.opening}` : ''
  return `${data.name}，${data.position}${data.highlights ? ` 游玩亮点：${data.highlights}` : ''}${opening ? ` ${opening}` : ''}`
}

function focusSpot(id: string, shouldSpeak = true) {
  selectedId.value = id
  const spot = overlookSpots.find((item) => item.id === id)
  if (!spot) return
  if (shouldSpeak) {
    window.setTimeout(() => {
      void store.speak(buildNarration(spot, findSpotData(spot)))
    }, 160)
  }
}

function askSelected() {
  void store.ask(selectedSpot.value.prompt)
}

function startVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) {
    recognitionState.value = 'unsupported'
    return
  }

  const recognition = new SpeechRecognition()
  recognition.lang = 'zh-CN'
  recognition.interimResults = false
  recognitionState.value = 'listening'
  recognition.onresult = (event: SpeechRecognitionEvent) => {
    const text = event.results[0]?.[0]?.transcript ?? ''
    recognitionState.value = 'idle'
    if (text.trim()) void store.ask(text)
  }
  recognition.onerror = () => (recognitionState.value = 'idle')
  recognition.onend = () => {
    if (recognitionState.value === 'listening') recognitionState.value = 'idle'
  }
  recognition.start()
}

async function submitFeedback() {
  await store.submitFeedback(feedbackRating.value, feedbackCategory.value, feedbackContent.value || `正在游览${selectedSpot.value.name}`)
  feedbackSent.value = true
  feedbackContent.value = ''
  window.setTimeout(() => (feedbackSent.value = false), 2200)
}
</script>

<template>
  <section ref="stageRef" class="overlook-guide" :style="focusStyle">
    <div class="overlook-toolbar">
      <div>
        <span class="toolbar-kicker">灵山胜境 · 俯瞰导览</span>
        <h1>点击景点，视角跳转到具体位置</h1>
      </div>
      <button type="button" @click="focusSpot('LS-011')">
        <Compass :size="18" />
        回到全景中轴
      </button>
    </div>

    <div class="overlook-stage">
      <div class="map-viewport" aria-label="灵山胜境俯瞰导览图">
        <div class="map-canvas">
          <img :src="overlookImage" alt="灵山胜境俯瞰导览图" />
          <button
            v-for="spot in overlookSpots"
            :key="spot.id"
            type="button"
            class="hotspot"
            :class="{ active: selectedId === spot.id }"
            :style="{ left: `${spot.x}%`, top: `${spot.y}%` }"
            :aria-label="`跳转到${spot.name}`"
            @click="focusSpot(spot.id)"
          >
            <span class="pin"></span>
            <span class="label">
              <strong>{{ spot.name }}</strong>
              <small>{{ spot.subtitle }}</small>
            </span>
          </button>
        </div>

        <div class="map-meta">
          <span>资料集：景点位置/中轴关系</span>
          <span>底图：本地授权安全俯瞰示意，可替换真实航拍图</span>
        </div>
      </div>

      <aside class="spot-inspector">
        <span class="inspector-kicker">
          <MapPin :size="16" />
          当前定位
        </span>
        <h2>{{ selectedSpot.name }}</h2>
        <p>{{ selectedData?.coreFunction || selectedSpot.subtitle }}</p>
        <dl>
          <div>
            <dt>位置</dt>
            <dd>{{ selectedData?.position || '已定位在俯瞰图热区。' }}</dd>
          </div>
          <div>
            <dt>看点</dt>
            <dd>{{ selectedData?.highlights || selectedSpot.prompt }}</dd>
          </div>
        </dl>
        <button type="button" class="inspector-action" @click="askSelected">
          <Search :size="18" />
          深入讲解这一站
        </button>
      </aside>
    </div>

    <div class="route-ribbon" aria-label="中轴线景点快速跳转">
      <button
        v-for="spot in orderedStops"
        :key="spot.id"
        type="button"
        :class="{ active: selectedId === spot.id }"
        @click="focusSpot(spot.id)"
      >
        {{ spot.name }}
      </button>
      <ChevronDown :size="18" aria-hidden="true" />
      <button
        v-for="spot in sideStops"
        :key="spot.id"
        type="button"
        :class="{ active: selectedId === spot.id }"
        @click="focusSpot(spot.id)"
      >
        {{ spot.name }}
      </button>
    </div>

    <div class="guide-narrator">
      <div class="narrator-copy">
        <span>{{ store.speaking ? '数字人正在讲解' : store.loading ? '正在检索景区知识库' : '点击景点或输入问题开始导览' }}</span>
        <h2>{{ selectedSpot.name }}：{{ selectedSpot.subtitle }}</h2>
        <p>{{ guideLine }}</p>
        <div class="narrator-actions">
          <button type="button" @click="() => store.speak(guideLine)">
            <Volume2 :size="18" />
            重听讲解
          </button>
          <button type="button" :class="{ listening: recognitionState === 'listening' }" @click="startVoice">
            <Mic :size="18" />
            语音提问
          </button>
          <button type="button" @click="askSelected">
            <Navigation :size="18" />
            继续问这一站
          </button>
        </div>
        <small v-if="recognitionState === 'unsupported'">当前浏览器不支持语音识别，可以使用右下角对话输入。</small>
      </div>
    </div>

    <div class="feedback-strip">
      <div>
        <strong>本次讲解体验</strong>
        <span>{{ feedbackSent ? '反馈已同步到管理后台' : '评分和建议会进入游客感受度报告' }}</span>
      </div>
      <select v-model="feedbackCategory" aria-label="反馈类型">
        <option value="service">服务体验</option>
        <option value="route">路线建议</option>
        <option value="knowledge">知识准确性</option>
        <option value="bug">问题反馈</option>
        <option value="suggestion">功能建议</option>
      </select>
      <select v-model.number="feedbackRating" aria-label="评分">
        <option :value="5">5 分</option>
        <option :value="4">4 分</option>
        <option :value="3">3 分</option>
        <option :value="2">2 分</option>
        <option :value="1">1 分</option>
      </select>
      <input v-model="feedbackContent" placeholder="写一句体验建议" />
      <button type="button" @click="submitFeedback">提交反馈</button>
    </div>
  </section>
</template>

<style scoped>
.overlook-guide {
  position: relative;
  padding: var(--spacing-xl) 0;
  color: var(--text-primary);
  background: transparent;
}

.overlook-toolbar {
  position: relative;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: var(--spacing-lg);
}

.toolbar-kicker,
.inspector-kicker,
.narrator-copy span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--primary-600);
  font-size: 13px;
  font-weight: 800;
}

.overlook-toolbar h1 {
  margin: 5px 0 0;
  font-size: clamp(24px, 3.2vw, 44px);
  line-height: 1.05;
  letter-spacing: 0;
}

.overlook-toolbar button,
.inspector-action,
.route-ribbon button,
.narrator-actions button {
  min-height: 44px;
  border: 1px solid rgba(255, 255, 255, 0.68);
  border-radius: var(--radius-lg);
  background: var(--surface-raised);
  color: var(--text-secondary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 800;
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast), color var(--transition-fast);
}

.overlook-toolbar button {
  padding: 0 16px;
  flex: 0 0 auto;
}

.overlook-toolbar button:hover,
.inspector-action:hover,
.route-ribbon button:hover,
.narrator-actions button:hover {
  transform: translateY(-2px);
  color: var(--primary-700);
  box-shadow: var(--shadow-md);
}

.overlook-stage {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(290px, 360px);
  gap: var(--spacing-lg);
  align-items: stretch;
}

.map-viewport {
  position: relative;
  min-height: clamp(330px, 48dvh, 600px);
  overflow: hidden;
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-2xl);
  background: var(--surface);
  box-shadow: var(--shadow-inset);
}

.map-canvas {
  position: absolute;
  inset: 0;
  transform-origin: var(--focus-x) var(--focus-y);
  transform: scale(var(--focus-scale));
  transition: transform 620ms cubic-bezier(0.2, 0.84, 0.22, 1);
}

.map-canvas img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.hotspot {
  position: absolute;
  z-index: 4;
  transform: translate(-50%, -50%) scale(calc(1 / var(--focus-scale)));
  transform-origin: center;
  border: 0;
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 9px;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.18));
  transition: transform 220ms ease;
}

.hotspot:hover,
.hotspot.active {
  transform: translate(-50%, -50%) scale(calc(1.08 / var(--focus-scale)));
}

.pin {
  width: 18px;
  height: 18px;
  border: 4px solid #fff;
  border-radius: 999px;
  background: var(--primary-500);
  box-shadow: 0 0 0 7px rgba(50, 143, 98, 0.22);
}

.hotspot.active .pin {
  background: var(--accent-mint);
  box-shadow: 0 0 0 9px rgba(96, 200, 172, 0.26), 0 0 26px rgba(96, 200, 172, 0.5);
}

.label {
  min-width: 116px;
  padding: 8px 10px;
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  background: var(--surface-raised);
  box-shadow: var(--shadow-sm);
  text-align: left;
}

.label strong,
.label small {
  display: block;
}

.label strong {
  color: var(--text-primary);
}

.label small {
  margin-top: 2px;
  color: var(--text-secondary);
  font-size: 12px;
}

.map-meta {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 16px;
  z-index: 5;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.map-meta span {
  padding: 7px 10px;
  border-radius: var(--radius-full);
  background: var(--surface-raised);
  border: 1px solid var(--glass-border);
  color: var(--text-secondary);
  font-size: 12px;
}

.spot-inspector,
.guide-narrator {
  border: 1px solid var(--glass-border);
  background: var(--surface-raised);
  box-shadow: var(--shadow-md);
  border-radius: var(--radius-2xl);
}

.spot-inspector {
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.spot-inspector h2,
.narrator-copy h2 {
  margin: 8px 0 10px;
  color: var(--text-primary);
  letter-spacing: 0;
}

.spot-inspector p,
.narrator-copy p,
.spot-inspector dd {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.7;
}

.spot-inspector dl {
  display: grid;
  gap: 14px;
  margin: 18px 0;
}

.spot-inspector dt {
  margin-bottom: 4px;
  color: var(--primary-600);
  font-size: 13px;
  font-weight: 800;
}

.inspector-action {
  margin-top: auto;
  width: 100%;
  background: linear-gradient(145deg, #65b98b, #2f8f62);
  border-color: rgba(255, 255, 255, 0.42);
  color: var(--text-inverse);
  box-shadow: var(--shadow-green);
}

.inspector-action:hover {
  color: var(--text-inverse);
  box-shadow: var(--shadow-lg);
}

.route-ribbon {
  position: relative;
  z-index: 4;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: var(--spacing-lg) 0;
}

.route-ribbon button {
  padding: 0 12px;
  min-height: 40px;
  border-radius: var(--radius-full);
  font-size: 13px;
}

.route-ribbon button.active {
  background: linear-gradient(145deg, #65b98b, #2f8f62);
  border-color: rgba(255, 255, 255, 0.42);
  color: var(--text-inverse);
  box-shadow: var(--shadow-green);
}

.guide-narrator {
  position: sticky;
  bottom: 14px;
  z-index: 6;
  padding: 16px 18px;
}

.narrator-copy h2 {
  font-size: clamp(20px, 2vw, 30px);
}

.narrator-copy p {
  max-height: 86px;
  overflow: auto;
}

.narrator-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.narrator-actions button {
  padding: 0 12px;
  min-height: 40px;
}

.narrator-actions button:first-child {
  background: linear-gradient(145deg, #65b98b, #2f8f62);
  border-color: rgba(255, 255, 255, 0.42);
  color: var(--text-inverse);
  box-shadow: var(--shadow-green);
}

.narrator-actions .listening {
  background: var(--error);
  color: #fff;
}

.narrator-copy small {
  display: block;
  margin-top: 8px;
  color: var(--error);
}

.feedback-strip {
  position: relative;
  z-index: 5;
  display: grid;
  grid-template-columns: minmax(190px, 1fr) 140px 88px minmax(180px, 1.2fr) auto;
  gap: 10px;
  align-items: center;
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  background: var(--surface-raised);
  box-shadow: var(--shadow-sm);
}

.feedback-strip strong,
.feedback-strip span {
  display: block;
}

.feedback-strip strong {
  color: var(--text-primary);
}

.feedback-strip span {
  margin-top: 2px;
  color: var(--primary-600);
  font-size: 12px;
}

.feedback-strip select,
.feedback-strip input {
  width: 100%;
  min-height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: var(--radius-lg);
  padding: 0 10px;
  color: var(--text-primary);
  background: var(--surface);
  box-shadow: var(--shadow-inset-sm);
}

.feedback-strip button {
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid rgba(255, 255, 255, 0.68);
  border-radius: var(--radius-lg);
  background: linear-gradient(145deg, #65b98b, #2f8f62);
  color: var(--text-inverse);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  font-weight: 800;
}

@media (max-width: 1080px) {
  .overlook-stage {
    grid-template-columns: 1fr;
  }

  .spot-inspector {
    min-height: auto;
  }
}

@media (max-width: 720px) {
  .overlook-guide {
    padding: var(--spacing-md) 0;
  }

  .overlook-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .map-viewport {
    min-height: 62dvh;
    border-radius: var(--radius-xl);
  }

  .label {
    min-width: 92px;
    max-width: 120px;
    font-size: 12px;
  }

  .guide-narrator {
    border-radius: var(--radius-xl);
  }

  .narrator-copy p {
    max-height: 104px;
  }

  .feedback-strip {
    grid-template-columns: 1fr 1fr;
  }

  .feedback-strip > div,
  .feedback-strip input,
  .feedback-strip button {
    grid-column: 1 / -1;
  }
}
</style>
