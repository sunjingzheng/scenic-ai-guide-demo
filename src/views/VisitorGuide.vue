<script setup lang="ts">
import { Mic, Send, Sparkles, LayoutDashboard, MapPinned, Volume2 } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AvatarGuide from '../components/AvatarGuide.vue'
import { useGuideStore } from '../stores/useGuideStore'

const store = useGuideStore()
const input = ref('')
const recognitionState = ref<'idle' | 'listening' | 'unsupported'>('idle')
const interests = ['历史文化', '祈福朝圣', '自然风光', '亲子休闲']
const quickQuestions = [
  '灵山大佛为什么是核心景点？',
  '九龙灌浴适合什么时间看？',
  '我喜欢历史文化，推荐一条路线',
  '拈花湾晚上怎么玩？'
]

const currentRefs = computed(() => {
  const last = [...store.messages].reverse().find((message) => message.references?.length)
  return last?.references ?? store.featuredSpots
})

onMounted(() => {
  store.loadBaseData()
})

function submit(text = input.value) {
  const value = text.trim()
  if (!value) return
  input.value = ''
  store.ask(value)
}

function startVoice() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition

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
    input.value = text
    submit(text)
  }
  recognition.onerror = () => (recognitionState.value = 'idle')
  recognition.onend = () => {
    if (recognitionState.value === 'listening') recognitionState.value = 'idle'
  }
  recognition.start()
}
</script>

<template>
  <main class="visitor-shell">
    <header class="topbar">
      <div>
        <span class="eyebrow">LINGSHAN AI GUIDE</span>
        <h1>灵山胜境 AI 数字人导览服务</h1>
      </div>
      <RouterLink class="ghost-button" to="/admin/dashboard">
        <LayoutDashboard :size="18" />
        管理后台
      </RouterLink>
    </header>

    <section class="visitor-grid">
      <aside class="avatar-panel glass">
        <AvatarGuide
          :speaking="store.speaking"
          :emotion="store.currentEmotion"
          :outfit="store.avatarConfig.outfit"
        />
        <div class="avatar-caption">
          <span :class="{ pulse: store.speaking }"></span>
          <p>{{ store.speaking ? '正在语音讲解' : '7x24 小时在线导览' }}</p>
        </div>
        <div class="interest-tabs">
          <button
            v-for="interest in interests"
            :key="interest"
            :class="{ active: store.currentInterest === interest }"
            @click="store.updateInterest(interest)"
          >
            {{ interest }}
          </button>
        </div>
      </aside>

      <section class="chat-panel glass">
        <div class="panel-heading">
          <div>
            <span class="eyebrow">MULTIMODAL CHAT</span>
            <h2>智能问答与景点讲解</h2>
          </div>
          <Sparkles :size="24" />
        </div>

        <div class="messages">
          <article v-for="(message, index) in store.messages" :key="index" :class="['message', message.role]">
            <p>{{ message.text }}</p>
            <small v-if="message.references?.length">
              引用：{{ message.references.map((spot) => spot.name).join('、') }}
            </small>
          </article>
          <article v-if="store.loading" class="message assistant">
            <p>正在检索景区知识库并生成导览回答...</p>
          </article>
        </div>

        <div class="quick-row">
          <button v-for="question in quickQuestions" :key="question" @click="submit(question)">
            {{ question }}
          </button>
        </div>

        <form class="chat-input" @submit.prevent="submit()">
          <button type="button" class="icon-button" @click="startVoice" :title="recognitionState === 'listening' ? '聆听中' : '语音输入'">
            <Mic :size="20" />
          </button>
          <input v-model="input" placeholder="输入你想了解的景点、路线或文化问题" />
          <button class="primary-button" type="submit">
            <Send :size="18" />
            发送
          </button>
        </form>
        <p v-if="recognitionState === 'unsupported'" class="hint">当前浏览器不支持语音识别，已切换为文本输入。</p>
      </section>

      <aside class="insight-panel glass">
        <div class="panel-heading compact">
          <h2>知识引用</h2>
          <MapPinned :size="22" />
        </div>
        <div class="spot-list">
          <article v-for="spot in currentRefs" :key="spot.id" class="spot-card">
            <strong>{{ spot.name }}</strong>
            <span>{{ spot.id }} · {{ spot.scenicArea }}</span>
            <p>{{ spot.highlights || spot.detail }}</p>
          </article>
        </div>

        <div class="route-box">
          <div class="panel-heading compact">
            <h2>个性化路线</h2>
            <Volume2 :size="20" />
          </div>
          <article v-for="route in store.routes" :key="route.id" class="route-card">
            <strong>{{ route.title }}</strong>
            <span>{{ route.duration }}</span>
            <p>{{ route.summary }}</p>
            <small>{{ route.stops.join(' -> ') }}</small>
          </article>
        </div>
      </aside>
    </section>
  </main>
</template>
