<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Bot,
  Camera,
  Image,
  MapPinned,
  MessageCircle,
  Mic,
  Route,
  Send,
  Upload,
} from 'lucide-vue-next'
import { BubbleList, Sender } from 'ant-design-x-vue'
import AvatarGuide from '../../components/AvatarGuide.vue'
import { useGuideStore } from '../../stores/useGuideStore'

type Mode = 'guide' | 'qa'

type GuideRoute = {
  id: string
  title: string
  interest: string
  duration: string
  image: string
  summary: string
  stops: string[]
  tone: string
}

type UploadPreview = {
  name: string
  url: string
}

const router = useRouter()
const route = useRoute()
const store = useGuideStore()
const input = ref('')
const chatBody = ref<HTMLElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const activeRouteId = ref('family')
const activeStopIndex = ref(0)
const activeMode = ref<Mode>(route.query.mode === 'qa' ? 'qa' : 'guide')
const uploadPreviews = ref<UploadPreview[]>([])

const guideRoutes: GuideRoute[] = [
  {
    id: 'family',
    title: '亲子家庭轻松线',
    interest: '亲子休闲',
    duration: '4 小时轻松游',
    image: '/images/guide-demo/route-family.png',
    summary: '数字人把知识点拆成互动任务，按路线依次讲解，也能随时回答孩子和家长的问题。',
    stops: ['南门入园 / 游客中心', '九龙灌浴', '佛手广场', '百子戏弥勒', '梵宫', '五印坛城', '出口'],
    tone: '轻松、互动、适合亲子'
  },
  {
    id: 'nature',
    title: '自然风光全景线',
    interest: '自然风光',
    duration: '5 小时全景游',
    image: '/images/guide-demo/route-nature.png',
    summary: '围绕太湖、山林、观景平台和慢游动线，数字人以取景建议和文化点穿插讲解。',
    stops: ['南门入园 / 游客中心', '佛足坛', '九龙灌浴', '菩提大道', '灵山大佛', '曼飞龙塔', '灵山精舍', '梵宫广场', '出口'],
    tone: '舒缓、观景、适合拍照'
  },
  {
    id: 'history',
    title: '历史文化深度线',
    interest: '历史文化',
    duration: '6 小时深度游',
    image: '/images/guide-demo/route-history.png',
    summary: '从入口缘起讲到祥符禅寺、灵山大佛和五印坛城，适合需要深度文化解说的游客。',
    stops: ['南门入园 / 游客中心', '灵山大照壁', '胜境广场', '佛手广场', '祥符禅寺', '杏坛广场', '佛前广场', '灵山大佛', '灵山梵宫', '五印坛城', '三圣殿', '出口'],
    tone: '沉浸、文化、适合深度游'
  }
]

const qaCards = [
  { title: '总览图识别', desc: '识别当前位置、服务点和推荐动线', image: '/images/guide-demo/overview-map.png' },
  { title: '景点图问答', desc: '围绕建筑、佛教寓意和最佳体验提问', image: '/images/guide-demo/lingshan-buddha-poster.png' },
  { title: '亲子互动解释', desc: '把文化内容改写成儿童能听懂的讲法', image: '/images/guide-demo/baizi-mile.png' },
  { title: '拍照点建议', desc: '根据上传图片给出角度和游览建议', image: '/images/guide-demo/foshou-square.png' }
]

const scenicGallery = [
  { name: '灵山大佛', image: '/images/guide-demo/lingshan-buddha-poster.png' },
  { name: '灵山梵宫', image: '/images/guide-demo/lingshan-fangong.png' },
  { name: '九龙灌浴', image: '/images/guide-demo/jiulong-bath-poster.png' },
  { name: '五印坛城', image: '/images/guide-demo/wuyin-tancheng.png' },
  { name: '祥符禅寺', image: '/images/guide-demo/xiangfu-temple.png' },
  { name: '曼飞龙塔', image: '/images/guide-demo/manfeilong-tower.png' }
]

const modeTabs = [
  { key: 'guide' as const, label: '导员模式', icon: Bot },
  { key: 'qa' as const, label: '问答模式', icon: MessageCircle }
]

const activeRoute = computed(() => guideRoutes.find(item => item.id === activeRouteId.value) || guideRoutes[0])
const activeStop = computed(() => activeRoute.value.stops[activeStopIndex.value] || activeRoute.value.stops[0])

const bubbleRoles = {
  assistant: {
    placement: 'start' as const,
    variant: 'shadow' as const,
    avatar: {
      style: { background: '#eaf7ef', color: '#25754f' },
      icon: '导'
    }
  },
  user: {
    placement: 'end' as const,
    variant: 'filled' as const,
    avatar: {
      style: { background: '#328f62', color: '#fff' },
      icon: '我'
    }
  }
}

const bubbleItems = computed(() =>
  store.messages.map((message, index) => ({
    key: index,
    role: message.role,
    content: message.text || (message.role === 'assistant' && store.loading ? '正在思考...' : ''),
    loading: message.role === 'assistant' && !message.text && store.loading,
    typing:
      message.role === 'assistant' && index === store.messages.length - 1 && store.loading
        ? { step: 2, interval: 24 }
        : false
  }))
)

const statusText = computed(() => {
  if (store.loading) return '正在理解游客意图'
  if (store.speaking) return '正在语音讲解'
  return activeMode.value === 'guide' ? '导员待命 · 可带路线也可答疑' : '多模态问答待命'
})

onMounted(async () => {
  await store.loadBaseData()
  await store.updateInterest(activeRoute.value.interest)
})

watch(
  () => route.query.mode,
  (mode) => {
    activeMode.value = mode === 'qa' ? 'qa' : 'guide'
  }
)

async function switchMode(mode: Mode) {
  activeMode.value = mode
  await router.replace({ path: '/home', query: { mode } })
}

async function selectGuideRoute(routeId: string) {
  activeRouteId.value = routeId
  activeStopIndex.value = 0
  await store.updateInterest(activeRoute.value.interest)
}

async function startGuiding() {
  activeStopIndex.value = 0
  await submit(
    `请进入导员模式，判断我适合“${activeRoute.value.title}”，并从“${activeStop.value}”开始做第一段现场讲解。讲解风格：${activeRoute.value.tone}。`
  )
}

async function continueGuiding() {
  activeStopIndex.value = Math.min(activeStopIndex.value + 1, activeRoute.value.stops.length - 1)
  await submit(`请继续导员模式，现在讲解“${activeStop.value}”，并自然衔接下一站。`)
}

async function askAboutStop() {
  const value = input.value.trim() || `游客在“${activeStop.value}”提问：这里最值得听的文化故事是什么？`
  await submit(`导员模式游客提问，当前位置是“${activeStop.value}”：${value}`)
}

async function askWithPreset(text: string) {
  input.value = text
  await submit()
}

async function submit(text = input.value) {
  const value = text.trim()
  const imageUrls = uploadPreviews.value.map(item => item.url)
  if ((!value && !imageUrls.length) || store.loading) return

  const modePrefix =
    activeMode.value === 'guide'
      ? `导员模式，当前线路“${activeRoute.value.title}”，当前站点“${activeStop.value}”。`
      : '问答模式，请结合游客上传的图片、语音转写或文字问题做多模态回答。'

  input.value = ''
  uploadPreviews.value = []
  await store.ask(`${modePrefix}${value}`, imageUrls)
  await nextTick()
  scrollToBottom()
}

function scrollToBottom() {
  if (chatBody.value) {
    chatBody.value.scrollTop = chatBody.value.scrollHeight
  }
}

function openUpload() {
  fileInput.value?.click()
}

async function handleUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])
  const previews = await Promise.all(
    files.map(
      file =>
        new Promise<UploadPreview>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve({ name: file.name, url: String(reader.result || '') })
          reader.readAsDataURL(file)
        })
    )
  )
  uploadPreviews.value = [...uploadPreviews.value, ...previews].slice(0, 4)
  target.value = ''
}

function removeUpload(index: number) {
  uploadPreviews.value.splice(index, 1)
}
</script>

<template>
  <div class="home-page">
    <section class="guide-console">
      <aside class="avatar-panel">
        <div class="mode-switch" aria-label="模式切换">
          <button
            v-for="tab in modeTabs"
            :key="tab.key"
            class="mode-button"
            :class="{ active: activeMode === tab.key }"
            @click="switchMode(tab.key)"
          >
            <component :is="tab.icon" :size="18" />
            <span>{{ tab.label }}</span>
          </button>
        </div>

        <div class="avatar-frame">
          <AvatarGuide
            :speaking="store.speaking || store.loading"
            :emotion="store.currentEmotion"
            :outfit="store.avatarConfig.outfit"
            :live2d="store.avatarConfig.live2d"
          />
        </div>

        <div class="avatar-caption">
          <span class="status-dot" :class="{ thinking: store.loading }"></span>
          <strong>灵山数字人导游</strong>
          <small>{{ statusText }}</small>
        </div>

        <div class="operator-card">
          <div>
            <Mic :size="18" />
            <span>语音讲解</span>
          </div>
          <div>
            <Camera :size="18" />
            <span>图像识别</span>
          </div>
          <div>
            <Route :size="18" />
            <span>路线带游</span>
          </div>
        </div>
      </aside>

      <main class="mode-panel">
        <section v-if="activeMode === 'guide'" class="guide-mode">
          <div class="panel-heading">
            <div>
              <p>Digital Human Tour</p>
              <h1>导员模式</h1>
            </div>
            <button class="compact-action" @click="startGuiding">
              <Route :size="18" />
              开始带游
            </button>
          </div>

          <div class="route-chooser">
            <button
              v-for="item in guideRoutes"
              :key="item.id"
              class="route-option"
              :class="{ active: item.id === activeRouteId }"
              @click="selectGuideRoute(item.id)"
            >
              <img :src="item.image" :alt="item.title" />
              <span>{{ item.duration }}</span>
              <strong>{{ item.title }}</strong>
            </button>
          </div>

          <div class="guide-grid">
            <article class="route-map">
              <img :src="activeRoute.image" :alt="activeRoute.title" />
              <div class="route-map-label">
                <MapPinned :size="18" />
                <span>{{ activeRoute.title }}</span>
              </div>
            </article>

            <article class="route-script">
              <div class="route-summary">
                <span>{{ activeRoute.duration }}</span>
                <h2>{{ activeRoute.title }}</h2>
                <p>{{ activeRoute.summary }}</p>
              </div>

              <div class="stop-strip" aria-label="线路站点">
                <button
                  v-for="(stop, index) in activeRoute.stops"
                  :key="`${activeRoute.id}-${stop}`"
                  class="stop-pill"
                  :class="{ current: index === activeStopIndex, passed: index < activeStopIndex }"
                  @click="activeStopIndex = index"
                >
                  <span>{{ index + 1 }}</span>
                  {{ stop }}
                </button>
              </div>

              <div class="guide-actions">
                <button @click="startGuiding">
                  <Bot :size="18" />
                  从当前线路开讲
                </button>
                <button @click="continueGuiding">
                  <Route :size="18" />
                  讲下一站
                </button>
                <button @click="askAboutStop">
                  <MessageCircle :size="18" />
                  回答游客提问
                </button>
              </div>
            </article>
          </div>
        </section>

        <section v-else class="qa-mode">
          <div class="panel-heading">
            <div>
              <p>Multimodal Q&A</p>
              <h1>问答模式</h1>
            </div>
            <button class="compact-action" @click="openUpload">
              <Upload :size="18" />
              上传图片
            </button>
          </div>

          <div class="qa-grid">
            <button
              v-for="card in qaCards"
              :key="card.title"
              class="qa-card"
              @click="askWithPreset(`请围绕“${card.title}”回答游客问题：${card.desc}`)"
            >
              <img :src="card.image" :alt="card.title" />
              <span>{{ card.title }}</span>
              <small>{{ card.desc }}</small>
            </button>
          </div>

          <div class="gallery-strip">
            <button
              v-for="item in scenicGallery"
              :key="item.name"
              class="gallery-item"
              @click="askWithPreset(`请介绍${item.name}，并告诉我游客到现场最应该注意什么。`)"
            >
              <img :src="item.image" :alt="item.name" />
              <span>{{ item.name }}</span>
            </button>
          </div>
        </section>

        <section class="chat-workbench">
          <div ref="chatBody" class="chat-messages">
            <BubbleList
              class="chat-bubbles"
              :items="bubbleItems"
              :roles="bubbleRoles"
              :auto-scroll="true"
            />
          </div>

          <div v-if="uploadPreviews.length" class="upload-preview">
            <button
              v-for="(item, index) in uploadPreviews"
              :key="`${item.name}-${index}`"
              @click="removeUpload(index)"
            >
              <img :src="item.url" :alt="item.name" />
              <span>{{ item.name }}</span>
            </button>
          </div>

          <div class="prompt-row">
            <button class="tool-button" title="上传图片" @click="openUpload">
              <Image :size="19" />
            </button>
            <input
              ref="fileInput"
              class="hidden-input"
              type="file"
              accept="image/*"
              multiple
              @change="handleUpload"
            />
            <Sender
              v-model:value="input"
              :loading="store.loading"
              :placeholder="activeMode === 'guide' ? '告诉数字人你的同行人、兴趣或现场问题...' : '输入问题，或上传图片后直接发送...'"
              submit-type="enter"
              @submit="submit"
            >
              <template #suffix>
                <button
                  class="send-btn"
                  :disabled="(!input.trim() && !uploadPreviews.length) || store.loading"
                  @click="submit()"
                >
                  <Send :size="18" />
                </button>
              </template>
            </Sender>
          </div>

          <div class="quick-prompts">
            <button @click="askWithPreset('我带老人和孩子一起游览，请自动选择一条轻松线路。')">
              自动选线
            </button>
            <button @click="askWithPreset('请用 1 分钟讲解当前景点，并留一个互动问题。')">
              1 分钟讲解
            </button>
            <button @click="askWithPreset('我上传了图片，请识别这是哪里，并说明典故。')">
              看图讲解
            </button>
          </div>
        </section>
      </main>
    </section>
  </div>
</template>

<style scoped>
.home-page {
  min-height: calc(100vh - 116px);
  padding: 16px 24px 28px;
}

.guide-console {
  display: grid;
  grid-template-columns: minmax(260px, 360px) minmax(0, 1fr);
  gap: 18px;
  max-width: 1420px;
  margin: 0 auto;
}

.avatar-panel,
.mode-panel,
.route-script,
.route-map,
.chat-workbench {
  border: 1px solid rgba(255, 255, 255, 0.74);
  border-radius: 8px;
  background: rgba(246, 250, 247, 0.92);
  box-shadow: var(--shadow-md);
}

.avatar-panel {
  position: sticky;
  top: 94px;
  align-self: start;
  display: grid;
  gap: 14px;
  padding: 14px;
}

.mode-switch {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  padding: 6px;
  border-radius: 8px;
  background: var(--surface);
  box-shadow: var(--shadow-inset-sm);
}

.mode-button,
.compact-action,
.guide-actions button,
.tool-button,
.send-btn,
.quick-prompts button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  background: var(--surface-raised);
  color: var(--text-secondary);
  font-weight: 700;
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast), color var(--transition-fast);
}

.mode-button.active,
.compact-action,
.guide-actions button:first-child,
.send-btn {
  background: linear-gradient(145deg, #66bb8e, #2f8f62);
  color: #fff;
}

.avatar-frame {
  min-height: 430px;
  overflow: hidden;
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(234, 247, 239, 0.86), rgba(246, 250, 247, 0.44)),
    url('/images/guide-demo/lingshan-jingshe.png') center / cover;
}

.avatar-frame :deep(.avatar-stage) {
  min-height: 430px;
}

.avatar-caption {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 8px;
  align-items: center;
  color: var(--text-primary);
}

.avatar-caption small {
  grid-column: 2;
  color: var(--text-secondary);
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--accent-mint);
  box-shadow: 0 0 12px var(--accent-mint);
}

.status-dot.thinking {
  background: var(--warning);
  box-shadow: 0 0 12px var(--warning);
  animation: pulse-dot 0.8s infinite alternate;
}

.operator-card {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.operator-card div {
  display: grid;
  place-items: center;
  gap: 6px;
  min-height: 78px;
  padding: 10px 6px;
  border-radius: 8px;
  background: var(--surface);
  color: var(--primary-700);
  box-shadow: var(--shadow-inset-sm);
  text-align: center;
  font-size: 12px;
  font-weight: 700;
}

.mode-panel {
  display: grid;
  gap: 14px;
  padding: 16px;
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.panel-heading p {
  margin: 0 0 4px;
  color: var(--primary-600);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.panel-heading h1 {
  margin: 0;
  font-size: clamp(26px, 4vw, 44px);
  line-height: 1.05;
  color: var(--text-primary);
}

.compact-action {
  padding: 0 14px;
}

.route-chooser {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.route-option,
.qa-card,
.gallery-item,
.upload-preview button,
.stop-pill {
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  background: var(--surface-raised);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast);
}

.route-option {
  position: relative;
  min-height: 140px;
  overflow: hidden;
  padding: 0;
  text-align: left;
}

.route-option img,
.route-map img,
.qa-card img,
.gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.route-option::after,
.route-map::after,
.qa-card::after,
.gallery-item::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 34%, rgba(20, 42, 31, 0.76));
}

.route-option span,
.route-option strong {
  position: absolute;
  z-index: 1;
  left: 12px;
  right: 12px;
  color: #fff;
}

.route-option span {
  bottom: 42px;
  font-size: 12px;
}

.route-option strong {
  bottom: 14px;
  font-size: 16px;
}

.route-option.active {
  border-color: rgba(50, 143, 98, 0.7);
  box-shadow: 0 0 0 3px rgba(50, 143, 98, 0.14), var(--shadow-md);
}

.guide-grid {
  display: grid;
  grid-template-columns: minmax(320px, 0.95fr) minmax(360px, 1.05fr);
  gap: 14px;
}

.route-map {
  position: relative;
  min-height: 520px;
  overflow: hidden;
}

.route-map-label {
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 14px;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 46px;
  padding: 0 14px;
  border-radius: 8px;
  background: rgba(246, 250, 247, 0.92);
  color: var(--primary-700);
  font-weight: 900;
}

.route-script {
  display: grid;
  align-content: start;
  gap: 14px;
  padding: 16px;
}

.route-summary span {
  display: inline-flex;
  margin-bottom: 8px;
  padding: 5px 10px;
  border-radius: 999px;
  background: var(--surface);
  color: var(--primary-700);
  font-size: 12px;
  font-weight: 900;
  box-shadow: var(--shadow-inset-sm);
}

.route-summary h2 {
  margin: 0 0 8px;
  font-size: 24px;
}

.route-summary p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.7;
}

.stop-strip {
  display: grid;
  gap: 8px;
  max-height: 310px;
  overflow: auto;
  padding-right: 4px;
}

.stop-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 0 12px;
  text-align: left;
  color: var(--text-secondary);
}

.stop-pill span {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--surface);
  color: var(--primary-700);
  font-size: 12px;
  font-weight: 900;
  box-shadow: var(--shadow-inset-sm);
}

.stop-pill.current {
  border-color: rgba(50, 143, 98, 0.5);
  color: var(--primary-800);
}

.stop-pill.passed {
  color: var(--text-tertiary);
}

.guide-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.qa-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.qa-card {
  position: relative;
  min-height: 180px;
  overflow: hidden;
  padding: 0;
  text-align: left;
}

.qa-card span,
.qa-card small {
  position: absolute;
  z-index: 1;
  left: 12px;
  right: 12px;
  color: #fff;
}

.qa-card span {
  bottom: 44px;
  font-size: 17px;
  font-weight: 900;
}

.qa-card small {
  bottom: 14px;
  line-height: 1.45;
}

.gallery-strip {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
}

.gallery-item {
  position: relative;
  min-height: 150px;
  overflow: hidden;
  padding: 0;
}

.gallery-item span {
  position: absolute;
  z-index: 1;
  left: 10px;
  right: 10px;
  bottom: 10px;
  color: #fff;
  font-weight: 900;
}

.chat-workbench {
  display: grid;
  gap: 10px;
  padding: 12px;
}

.chat-messages {
  min-height: 220px;
  max-height: 320px;
  overflow-y: auto;
  padding-right: 4px;
}

.chat-bubbles :deep(.ant-bubble-content) {
  line-height: 1.7;
  white-space: pre-wrap;
}

.upload-preview {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 2px 0;
}

.upload-preview button {
  display: grid;
  grid-template-columns: 54px 120px;
  align-items: center;
  gap: 8px;
  min-width: 190px;
  padding: 6px;
  text-align: left;
  color: var(--text-secondary);
}

.upload-preview img {
  width: 54px;
  height: 44px;
  border-radius: 6px;
  object-fit: cover;
}

.upload-preview span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.prompt-row {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
}

.hidden-input {
  display: none;
}

.tool-button,
.send-btn {
  width: 42px;
  height: 42px;
  min-height: 42px;
  padding: 0;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.prompt-row :deep(.ant-sender) {
  border-radius: 8px;
  background: var(--surface);
  box-shadow: var(--shadow-inset-sm);
}

.quick-prompts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-prompts button {
  min-height: 34px;
  padding: 0 12px;
  font-size: 13px;
}

.route-option:hover,
.qa-card:hover,
.gallery-item:hover,
.guide-actions button:hover,
.compact-action:hover,
.tool-button:hover,
.quick-prompts button:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

@keyframes pulse-dot {
  from {
    opacity: 0.45;
  }
  to {
    opacity: 1;
  }
}

@media (max-width: 1180px) {
  .guide-console,
  .guide-grid {
    grid-template-columns: 1fr;
  }

  .avatar-panel {
    position: static;
  }

  .avatar-frame,
  .avatar-frame :deep(.avatar-stage) {
    min-height: 340px;
  }

  .qa-grid,
  .gallery-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .home-page {
    padding: 8px 10px 82px;
  }

  .mode-panel,
  .avatar-panel {
    padding: 10px;
  }

  .panel-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .compact-action {
    width: 100%;
  }

  .route-chooser,
  .guide-actions,
  .operator-card {
    grid-template-columns: 1fr;
  }

  .qa-grid {
    grid-template-columns: 1fr;
  }

  .gallery-strip {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .gallery-item {
    flex: 0 0 154px;
    min-height: 190px;
  }

  .qa-card {
    min-height: 210px;
  }

  .route-map {
    min-height: 420px;
  }

  .chat-messages {
    max-height: 360px;
  }
}
</style>
