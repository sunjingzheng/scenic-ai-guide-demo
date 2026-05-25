<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Compass, Map, Route, Send } from 'lucide-vue-next'
import { BubbleList, Sender } from 'ant-design-x-vue'
import AvatarGuide from '../../components/AvatarGuide.vue'
import { useGuideStore } from '../../stores/useGuideStore'

const router = useRouter()
const store = useGuideStore()
const input = ref('')
const chatBody = ref<HTMLElement | null>(null)

const quickLinks = [
  { icon: Map, label: '园区总览', path: '/overview' },
  { icon: Compass, label: '景点探索', path: '/spots' },
  { icon: Route, label: '路线推荐', path: '/routes' }
]

const bubbleRoles = {
  assistant: {
    placement: 'start' as const,
    variant: 'shadow' as const,
    avatar: {
      style: { background: '#eaf7ef', color: '#25754f' },
      icon: '灵'
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
  if (store.loading) return '正在思考...'
  if (store.speaking) return '正在讲解...'
  return '在线 · 随时问我任何问题'
})

onMounted(async () => {
  await store.loadBaseData()
})

function submit(text = input.value) {
  const value = text.trim()
  if (!value || store.loading) return
  input.value = ''
  void store.ask(value)
  nextTick(scrollToBottom)
}

function scrollToBottom() {
  if (chatBody.value) {
    chatBody.value.scrollTop = chatBody.value.scrollHeight
  }
}
</script>

<template>
  <div class="home-page">
    <div class="home-layout">
      <!-- 左侧：数字人展示 -->
      <section class="avatar-section">
        <div class="avatar-wrapper">
          <AvatarGuide
            :speaking="store.speaking || store.loading"
            :emotion="store.currentEmotion"
            :outfit="store.avatarConfig.outfit"
            :live2d="store.avatarConfig.live2d"
          />
        </div>
        <div class="avatar-status">
          <span class="status-dot" :class="{ active: !store.loading, thinking: store.loading }"></span>
          {{ statusText }}
        </div>
      </section>

      <!-- 右侧：对话区域 -->
      <section class="chat-section">
        <div class="chat-header">
          <h1>灵山胜境</h1>
          <p>AI 数字人导游 · 智慧导览</p>
        </div>

        <div ref="chatBody" class="chat-messages">
          <BubbleList
            class="chat-bubbles"
            :items="bubbleItems"
            :roles="bubbleRoles"
            :auto-scroll="true"
          />
        </div>

        <div class="chat-input-area">
          <Sender
            v-model:value="input"
            :loading="store.loading"
            placeholder="问我景点历史、路线推荐、演出时间..."
            submit-type="enter"
            @submit="submit"
          >
            <template #suffix>
              <button
                class="send-btn"
                :disabled="!input.trim() || store.loading"
                @click="submit()"
              >
                <Send :size="18" />
              </button>
            </template>
          </Sender>
        </div>

        <div class="quick-links">
          <button
            v-for="link in quickLinks"
            :key="link.path"
            class="quick-link"
            @click="router.push(link.path)"
          >
            <component :is="link.icon" :size="16" />
            {{ link.label }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  height: calc(100vh - 140px);
  min-height: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
}

.home-layout {
  display: grid;
  grid-template-columns: minmax(320px, 1fr) minmax(380px, 520px);
  gap: var(--spacing-2xl);
  width: 100%;
  max-width: 1100px;
  align-items: center;
}

/* 左侧：数字人 */
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-lg);
}

.avatar-wrapper {
  width: 100%;
  max-width: 420px;
  display: grid;
  place-items: center;
}

.avatar-wrapper :deep(.avatar-stage) {
  min-height: 400px;
  width: 100%;
}

.avatar-wrapper :deep(.live2d-avatar) {
  width: 100%;
  height: 100%;
}

.avatar-status {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 14px;
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

@keyframes pulse-dot {
  from { opacity: 0.4; }
  to { opacity: 1; }
}

/* 右侧：对话 */
.chat-section {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 620px;
  background: var(--surface-raised);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.chat-header {
  padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-md);
  border-bottom: 1px solid var(--border-light);
}

.chat-header h1 {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.chat-header p {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
  min-height: 200px;
  max-height: 360px;
}

.chat-bubbles :deep(.ant-bubble-content) {
  line-height: 1.7;
  white-space: pre-wrap;
}

.chat-input-area {
  padding: var(--spacing-md);
  border-top: 1px solid var(--border-light);
}

.chat-input-area :deep(.ant-sender) {
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
}

.send-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: var(--radius-lg);
  background: linear-gradient(145deg, #65b98b, #2f8f62);
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quick-links {
  display: flex;
  gap: var(--spacing-sm);
  padding: 0 var(--spacing-md) var(--spacing-md);
}

.quick-link {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 0;
  border: 1px solid rgba(255, 255, 255, 0.68);
  border-radius: var(--radius-lg);
  background: var(--surface-raised);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
}

.quick-link:hover {
  color: var(--primary-700);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

@media (max-width: 900px) {
  .home-page {
    height: auto;
    padding: var(--spacing-md);
  }

  .home-layout {
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
  }

  .avatar-wrapper {
    max-width: 280px;
  }

  .avatar-wrapper :deep(.avatar-stage) {
    min-height: 300px;
  }

  .chat-section {
    max-height: 500px;
  }

  .chat-messages {
    max-height: 240px;
  }
}
</style>
