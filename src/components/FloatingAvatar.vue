<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { Mic, Send, X, Minimize2, Maximize2, Bot } from 'lucide-vue-next'
import { useGuideStore } from '../stores/useGuideStore'
import AvatarGuide from './AvatarGuide.vue'

const store = useGuideStore()
const input = ref('')
const isExpanded = ref(false)
const isMinimized = ref(false)
const recognitionState = ref<'idle' | 'listening' | 'unsupported'>('idle')
const messagesContainer = ref<HTMLElement | null>(null)

const quickQuestions = [
  '灵山大佛有什么特色？',
  '九龙灌浴什么时间表演？',
  '推荐一条半日游路线',
  '拈花湾晚上有什么活动？'
]

onMounted(() => {
  store.loadBaseData()
})

function submit(text = input.value) {
  const value = text.trim()
  if (!value) return
  input.value = ''
  store.ask(value)
  if (!isExpanded.value) {
    isExpanded.value = true
  }
  nextTick(() => scrollToBottom())
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
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
    input.value = text
    submit(text)
  }

  recognition.onerror = () => (recognitionState.value = 'idle')
  recognition.onend = () => {
    if (recognitionState.value === 'listening') recognitionState.value = 'idle'
  }

  recognition.start()
}

function toggleExpand() {
  isExpanded.value = !isExpanded.value
  if (isExpanded.value) {
    nextTick(() => scrollToBottom())
  }
}

function toggleMinimize() {
  isMinimized.value = !isMinimized.value
}
</script>

<template>
  <!-- 浮动数字人助手 -->
  <div class="floating-assistant" :class="{ expanded: isExpanded, minimized: isMinimized }">
    <!-- 最小化状态 -->
    <div v-if="isMinimized" class="minimized-avatar" @click="toggleMinimize">
      <AvatarGuide
        :speaking="store.speaking"
        :emotion="store.currentEmotion"
        :outfit="store.avatarConfig.outfit"
        :live2d="store.avatarConfig.live2d"
      />
      <div v-if="store.speaking" class="pulse-ring"></div>
    </div>

    <!-- 正常/展开状态 -->
    <div v-else class="assistant-container glass-card">
      <!-- 头部 -->
      <div class="assistant-header">
        <div class="header-info">
          <Bot :size="20" class="header-bot-icon" />
          <div>
            <h3>AI数字导员</h3>
            <span :class="{ active: store.speaking }">
              {{ store.speaking ? '正在讲解' : '在线服务' }}
            </span>
          </div>
        </div>
        <div class="header-actions">
          <button class="icon-btn" @click="toggleExpand" :title="isExpanded ? '收起' : '展开'">
            <Minimize2 v-if="isExpanded" :size="16" />
            <Maximize2 v-else :size="16" />
          </button>
          <button class="icon-btn" @click="toggleMinimize" title="最小化">
            <X :size="16" />
          </button>
        </div>
      </div>

      <!-- 数字人形象 -->
      <div class="avatar-section">
        <AvatarGuide
          :speaking="store.speaking"
          :emotion="store.currentEmotion"
          :outfit="store.avatarConfig.outfit"
          :live2d="store.avatarConfig.live2d"
        />
        <div class="avatar-status">
          <span :class="{ pulse: store.speaking }"></span>
          <p>{{ store.speaking ? '正在语音讲解' : '随时为您服务' }}</p>
        </div>
      </div>

      <!-- 展开的对话区域 -->
      <div v-if="isExpanded" class="chat-section">
        <div ref="messagesContainer" class="messages-container">
          <div
            v-for="(message, index) in store.messages"
            :key="index"
            class="message"
            :class="message.role"
          >
            <div v-if="message.role === 'assistant'" class="message-avatar">
              <Bot :size="14" />
            </div>
            <div class="message-content">
              <p>{{ message.text }}</p>
              <small v-if="message.references?.length">
                引用：{{ message.references.map(s => s.name).join('、') }}
              </small>
            </div>
          </div>
          <div v-if="store.loading" class="message assistant loading">
            <div class="message-avatar">
              <Bot :size="14" />
            </div>
            <div class="message-content">
              <div class="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- 快捷问题 -->
        <div class="quick-questions">
          <button
            v-for="q in quickQuestions"
            :key="q"
            class="quick-btn"
            @click="submit(q)"
          >
            {{ q }}
          </button>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-section">
        <button
          class="icon-btn voice-btn"
          :class="{ listening: recognitionState === 'listening' }"
          @click="startVoice"
          :title="recognitionState === 'listening' ? '聆听中' : '语音输入'"
        >
          <Mic :size="20" />
        </button>
        <input
          v-model="input"
          class="input"
          placeholder="问我任何关于景区的问题..."
          @keyup.enter="submit()"
        />
        <button class="btn btn-primary send-btn" :disabled="!input.trim()" @click="submit()">
          <Send :size="18" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 浮动助手 */
.floating-assistant {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  transition: all var(--transition-base);
}

/* 最小化状态 */
.minimized-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  padding: 3px;
  cursor: pointer;
  position: relative;
  box-shadow: var(--shadow-green);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.minimized-avatar:hover {
  transform: scale(1.08);
  box-shadow: var(--shadow-xl);
}

.minimized-avatar:active {
  transform: scale(0.95);
}

.pulse-ring {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border: 2px solid var(--primary-400);
  border-radius: 50%;
  animation: pulse-ring 1.5s ease-out infinite;
}

@keyframes pulse-ring {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.3);
    opacity: 0;
  }
}

/* 正常状态 */
.assistant-container {
  width: 380px;
  max-height: 600px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: assistant-entrance 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes assistant-entrance {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.floating-assistant.expanded .assistant-container {
  width: 450px;
  max-height: 700px;
}

/* 头部 */
.assistant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--border-light);
}

.header-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.header-bot-icon {
  color: var(--primary-600);
  background: var(--primary-100);
  padding: 6px;
  border-radius: var(--radius-md);
  width: 32px;
  height: 32px;
}

.header-info h3 {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.15rem;
}

.header-info span {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.header-info span.active {
  color: var(--primary-600);
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.icon-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.icon-btn:hover {
  background: var(--primary-50);
  color: var(--primary-600);
}

/* 数字人区域 */
.avatar-section {
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
}

.avatar-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.avatar-status span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary-500);
}

.avatar-status span.pulse {
  animation: status-pulse 1.5s ease-in-out infinite;
}

@keyframes status-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.avatar-status p {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

/* 对话区域 */
.chat-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-top: 1px solid var(--border-light);
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.message {
  display: flex;
  gap: var(--spacing-sm);
  max-width: 90%;
  animation: message-entrance 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes message-entrance {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.message.assistant .message-avatar {
  background: var(--primary-100);
  color: var(--primary-600);
}

.message.user .message-avatar {
  background: var(--primary-600);
  color: white;
}

.message-content {
  padding: 10px 14px;
  border-radius: var(--radius-lg);
  font-size: 0.85rem;
  line-height: 1.6;
}

.message.user .message-content {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: white;
  border-bottom-right-radius: 4px;
}

.message.assistant .message-content {
  background: var(--gray-100);
  color: var(--text-primary);
  border-bottom-left-radius: 4px;
}

.message.loading {
  opacity: 0.8;
}

.message p {
  margin: 0;
}

.message small {
  display: block;
  margin-top: 6px;
  font-size: 0.75rem;
  opacity: 0.75;
}

/* 打字指示器 */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}

.typing-indicator span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--text-tertiary);
  animation: typing-bounce 1.2s ease-in-out infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.15s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes typing-bounce {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-6px);
    opacity: 1;
  }
}

/* 快捷问题 */
.quick-questions {
  padding: var(--spacing-sm) var(--spacing-md);
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  border-top: 1px solid var(--border-light);
}

.quick-btn {
  padding: 0.375rem 0.75rem;
  border: 1px solid var(--border-light);
  background: var(--bg-primary);
  color: var(--text-secondary);
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.quick-btn:hover {
  border-color: var(--primary-500);
  color: var(--primary-600);
  background: var(--primary-50);
}

/* 输入区域 */
.input-section {
  display: flex;
  gap: var(--spacing-xs);
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--border-light);
  background: var(--bg-primary);
  align-items: center;
}

.voice-btn.listening {
  color: var(--error);
  animation: status-pulse 1s ease-in-out infinite;
}

.input-section .input {
  flex: 1;
  border: 1px solid var(--border-light);
  padding: 10px 14px;
  font-size: 0.875rem;
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .assistant-container,
  .floating-assistant.expanded .assistant-container {
    width: calc(100vw - 32px);
    max-height: calc(100vh - 100px);
    right: 16px;
  }

  .floating-assistant {
    right: 16px;
    bottom: 80px;
  }
}
</style>
