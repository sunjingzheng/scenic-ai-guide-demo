<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { useRoute } from "vue-router";
import {
  Bot,
  ChevronDown,
  ImagePlus,
  Maximize2,
  Mic,
  Minimize2,
  Square,
  X,
} from "lucide-vue-next";
import { BubbleList, Sender, XProvider } from "ant-design-x-vue";
import { Badge } from "ant-design-vue";
import AvatarGuide from "./AvatarGuide.vue";
import { useGuideStore } from "../stores/useGuideStore";
import { DEFAULT_CHAT_EXPANDED } from "../features/avatarPanel";

const route = useRoute();
const store = useGuideStore();
const isHomePage = computed(() => route.path === "/home");
const input = ref("");
const isExpanded = ref(store.chatExpanded > 0 || DEFAULT_CHAT_EXPANDED);
const isMinimized = ref(false);
const recognitionState = ref<"idle" | "listening" | "unsupported">("idle");
const chatBody = ref<HTMLElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const selectedImages = ref<string[]>([]);
const continuousVoice = ref(false);
const interimText = ref("");
let recognition: SpeechRecognition | null = null;

const bubbleRoles = {
  assistant: {
    placement: "start",
    variant: "shadow",
    avatar: {
      style: { background: "#eaf7ef", color: "#25754f" },
      icon: "灵",
    },
  },
  user: {
    placement: "end",
    variant: "filled",
    avatar: {
      style: { background: "#328f62", color: "#fff" },
      icon: "我",
    },
  },
} as const;

const bubbleItems = computed(() =>
  store.messages.map((message, index) => ({
    key: index,
    role: message.role,
    content:
      message.text ||
      (message.role === "assistant" && store.loading
        ? "正在检索知识库..."
        : ""),
    loading: message.role === "assistant" && !message.text && store.loading,
    footer:
      message.role === "assistant" && message.references?.length
        ? `引用：${message.references.map((item) => item.name).join("、")}`
        : undefined,
    typing:
      message.role === "assistant" &&
      index === store.messages.length - 1 &&
      store.loading
        ? { step: 2, interval: 24 }
        : false,
  })),
);

onMounted(() => {
  store.loadBaseData();
});

onBeforeUnmount(() => {
  stopVoice();
});

watch(
  () => [
    store.messages.length,
    store.messages[store.messages.length - 1]?.text,
    store.loading,
  ],
  () => nextTick(scrollToBottom),
  { deep: true },
);

watch(
  () => store.chatExpanded,
  () => {
    isExpanded.value = true;
    isMinimized.value = false;
    nextTick(scrollToBottom);
  },
);

function submit(text = input.value) {
  const value = text.trim();
  if ((!value && !selectedImages.value.length) || store.loading) return;
  input.value = "";
  interimText.value = "";
  const images = [...selectedImages.value];
  selectedImages.value = [];
  isExpanded.value = true;
  isMinimized.value = false;
  void store.ask(value, images);
  nextTick(scrollToBottom);
}

function scrollToBottom() {
  if (chatBody.value) {
    chatBody.value.scrollTop = chatBody.value.scrollHeight;
  }
}

function createRecognition(isContinuous: boolean) {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    recognitionState.value = "unsupported";
    return null;
  }

  const instance = new SpeechRecognition();
  instance.lang = "zh-CN";
  instance.continuous = isContinuous;
  instance.interimResults = isContinuous;
  recognitionState.value = "listening";

  instance.onresult = (event: SpeechRecognitionEvent) => {
    let finalText = "";
    let currentInterim = "";
    for (let index = 0; index < event.results.length; index += 1) {
      const result = event.results[index];
      const text = result?.[0]?.transcript?.trim() || "";
      if (!text) continue;
      if (result.isFinal) finalText += text;
      else currentInterim += text;
    }

    interimText.value = currentInterim;
    if (currentInterim) input.value = currentInterim;
    if (finalText) {
      input.value = finalText;
      submit(finalText);
    }
  };

  instance.onerror = () => {
    if (!continuousVoice.value) recognitionState.value = "idle";
  };

  instance.onend = () => {
    recognitionState.value = "idle";
    if (continuousVoice.value) {
      window.setTimeout(() => {
        if (continuousVoice.value && !store.loading) startVoice(true);
      }, 280);
    }
  };

  return instance;
}

function startVoice(isContinuous = false) {
  stopVoice();
  continuousVoice.value = isContinuous;
  recognition = createRecognition(isContinuous);
  recognition?.start();
}

function stopVoice() {
  continuousVoice.value = false;
  interimText.value = "";
  recognitionState.value = "idle";
  recognition?.abort();
  recognition = null;
}

function toggleContinuousVoice() {
  if (continuousVoice.value) {
    stopVoice();
    return;
  }
  startVoice(true);
}

function triggerImageInput() {
  fileInput.value?.click();
}

function handleImageChange(event: Event) {
  const inputEl = event.target as HTMLInputElement;
  const files = Array.from(inputEl.files || []).slice(0, 3);
  if (!files.length) return;
  Promise.all(files.map(readImageFile)).then((items) => {
    selectedImages.value = [...selectedImages.value, ...items].slice(0, 3);
  });
  inputEl.value = "";
}

function readImageFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("图片读取失败"));
    reader.readAsDataURL(file);
  });
}

function removeImage(index: number) {
  selectedImages.value = selectedImages.value.filter(
    (_, itemIndex) => itemIndex !== index,
  );
}

function toggleExpand() {
  isExpanded.value = !isExpanded.value;
  if (isExpanded.value) {
    isMinimized.value = false;
    nextTick(scrollToBottom);
  }
}

function toggleMinimize() {
  isMinimized.value = !isMinimized.value;
  if (isMinimized.value) isExpanded.value = false;
}
</script>

<template>
  <XProvider>
    <div
      v-if="!isHomePage"
      class="floating-assistant"
      :class="{ expanded: isExpanded, minimized: isMinimized }"
    >
      <button
        v-if="isMinimized"
        class="agent-orb"
        type="button"
        @click="toggleMinimize"
      >
        <Bot :size="24" />
      </button>

      <template v-else>
        <button
          class="avatar-float"
          type="button"
          :title="isExpanded ? '收起对话' : '展开对话'"
          @click="toggleExpand"
        >
          <AvatarGuide
            :speaking="store.speaking || store.loading"
            :emotion="store.currentEmotion"
            :outfit="store.avatarConfig.outfit"
            :outfit-image="store.currentOutfitImage"
            :outfit-model-url="store.currentOutfitModelUrl"
            :live2d="store.avatarConfig.live2d"
          />
        </button>

        <a-card v-if="isExpanded" class="agent-panel" :bordered="false">
          <template #title>
            <a-flex align="center" gap="small">
              <Badge status="success" />
              <div class="agent-title">
                <strong>Hiyori</strong>
                <span>{{ store.loading ? "正在思考" : "在线" }}</span>
              </div>
            </a-flex>
          </template>

          <template #extra>
            <a-flex gap="small">
              <a-button
                shape="circle"
                type="text"
                :title="isExpanded ? '收起对话' : '展开对话'"
                @click="toggleExpand"
              >
                <Minimize2 v-if="isExpanded" :size="16" />
                <Maximize2 v-else :size="16" />
              </a-button>
              <a-button
                shape="circle"
                type="text"
                title="最小化"
                @click="toggleMinimize"
              >
                <ChevronDown :size="16" />
              </a-button>
              <a-button
                shape="circle"
                type="text"
                title="关闭"
                @click="toggleMinimize"
              >
                <X :size="16" />
              </a-button>
            </a-flex>
          </template>

          <div v-show="isExpanded" ref="chatBody" class="agent-chat-body">
            <BubbleList
              class="agent-bubbles"
              :items="bubbleItems"
              :roles="bubbleRoles"
              :auto-scroll="true"
            />
          </div>

          <div v-if="selectedImages.length" class="image-tray">
            <button
              v-for="(image, index) in selectedImages"
              :key="image"
              type="button"
              @click="removeImage(index)"
            >
              <img :src="image" alt="待发送图片" />
              <span>移除</span>
            </button>
          </div>

          <p v-if="continuousVoice || interimText" class="voice-status">
            {{ interimText || "长时间语音对话中，说完一句会自动提问" }}
          </p>

          <Sender
            v-model:value="input"
            class="agent-sender"
            :loading="store.loading"
            :placeholder="
              continuousVoice
                ? '正在持续聆听...'
                : '说点什么，或上传图片提问...'
            "
            submit-type="enter"
            @submit="submit"
          >
            <template #prefix>
              <input
                ref="fileInput"
                class="hidden-file"
                type="file"
                accept="image/*"
                multiple
                @change="handleImageChange"
              />
              <a-button
                shape="circle"
                type="text"
                title="图片输入"
                @click="triggerImageInput"
              >
                <ImagePlus :size="18" />
              </a-button>
              <a-button
                shape="circle"
                type="text"
                :class="{ listening: recognitionState === 'listening' }"
                title="单句语音输入"
                @click="() => startVoice(false)"
              >
                <Mic :size="18" />
              </a-button>
              <a-button
                shape="circle"
                type="text"
                :class="{ listening: continuousVoice }"
                :title="
                  continuousVoice ? '停止长时间语音对话' : '长时间语音对话'
                "
                @click="toggleContinuousVoice"
              >
                <Square v-if="continuousVoice" :size="15" />
                <Bot v-else :size="17" />
              </a-button>
            </template>
          </Sender>
        </a-card>
      </template>
    </div>
  </XProvider>
</template>

<style scoped>
.floating-assistant {
  position: fixed;
  right: 28px;
  bottom: 18px;
  width: min(440px, calc(100vw - 32px));
  height: min(720px, calc(100vh - 36px));
  z-index: 1000;
  pointer-events: none;
  --agent-panel-width: min(360px, calc(100vw - 48px));
  --agent-panel-height: 248px;
  --agent-avatar-width: clamp(420px, 62vh, 560px);
  --agent-avatar-frame-height: min(520px, calc(100vh - 120px));
  --agent-avatar-stage-height: min(820px, calc(100vh + 120px));
}

.floating-assistant.expanded {
  --agent-panel-height: 210px;
  --agent-avatar-width: clamp(400px, 56vh, 520px);
  --agent-avatar-frame-height: min(430px, calc(100vh - 288px));
  --agent-avatar-stage-height: min(780px, calc(100vh + 80px));
}

.agent-orb,
.avatar-float,
.agent-panel {
  pointer-events: auto;
}

.agent-orb {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 72px;
  height: 72px;
  border: 0;
  border-radius: 50%;
  color: #fff;
  background: linear-gradient(135deg, var(--primary-500), var(--accent-teal));
  box-shadow: 0 18px 45px rgba(50, 143, 98, 0.28);
  display: grid;
  place-items: center;
  cursor: pointer;
}

.avatar-float {
  position: absolute;
  right: 0;
  bottom: 0;
  width: var(--agent-avatar-width);
  height: var(--agent-avatar-frame-height);
  padding: 0;
  border: 0;
  background: transparent;
  z-index: 3;
  display: grid;
  place-items: start center;
  cursor: pointer;
  overflow: hidden;
  filter: drop-shadow(0 28px 34px rgba(22, 58, 39, 0.25));
}

.avatar-float:focus,
.avatar-float:focus-visible {
  outline: none;
}

.floating-assistant.expanded .avatar-float {
  bottom: calc(var(--agent-panel-height) - 8px);
}

.avatar-float :deep(.avatar-stage) {
  width: var(--agent-avatar-width);
  height: var(--agent-avatar-stage-height);
  min-height: var(--agent-avatar-stage-height);
  overflow: visible;
}

.avatar-float :deep(.live2d-avatar) {
  width: 100%;
  height: 100%;
}

.avatar-float :deep(.live2d-loading) {
  display: none;
}

.avatar-float :deep(.voice-rings) {
  display: none;
}

.agent-panel {
  position: absolute;
  right: 24px;
  bottom: 0;
  width: var(--agent-panel-width);
  height: var(--agent-panel-height);
  overflow: hidden;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 24px 64px rgba(32, 71, 52, 0.2);
  border: 1px solid rgba(50, 143, 98, 0.2);
  backdrop-filter: blur(18px);
}

.agent-panel :deep(.ant-card-head) {
  min-height: 52px;
  border: 0;
  color: #fff;
  background: linear-gradient(
    105deg,
    var(--primary-600) 0%,
    var(--accent-mint) 100%
  );
}

.agent-panel :deep(.ant-card-head-title),
.agent-panel :deep(.ant-card-extra) {
  color: #fff;
}

.agent-panel :deep(.ant-btn-text) {
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.18);
}

.agent-title {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}

.agent-title strong {
  font-size: 18px;
  letter-spacing: 0;
}

.agent-title span {
  font-size: 13px;
  opacity: 0.9;
}

.agent-panel :deep(.ant-card-body) {
  padding: 10px 14px 14px;
}

.agent-chat-body {
  height: calc(var(--agent-panel-height) - 146px);
  min-height: 68px;
  overflow-y: auto;
  padding: 4px 2px 10px;
  scroll-behavior: smooth;
}

.agent-bubbles :deep(.ant-bubble-content) {
  line-height: 1.7;
  white-space: pre-wrap;
}

.agent-bubbles :deep(.ant-bubble-footer) {
  margin-top: 6px;
  color: var(--text-tertiary);
  font-size: 12px;
}

.agent-prompts {
  margin: 4px 0 8px;
}

.agent-prompts :deep(.ant-prompts-item) {
  border-radius: 14px;
  background: rgba(238, 248, 241, 0.88);
  border-color: rgba(50, 143, 98, 0.14);
}

.agent-sender {
  border-radius: 24px;
  box-shadow: 0 12px 30px rgba(50, 143, 98, 0.12);
}

.agent-sender :deep(.ant-sender-prefix) {
  display: flex;
  align-items: center;
  gap: 2px;
  color: var(--primary-700);
}

.agent-sender :deep(.ant-sender-prefix .ant-btn) {
  color: var(--primary-700);
}

.hidden-file {
  display: none;
}

.image-tray {
  display: flex;
  gap: 8px;
  margin: 4px 0 10px;
  overflow-x: auto;
}

.image-tray button {
  position: relative;
  width: 58px;
  height: 58px;
  padding: 0;
  border: 1px solid rgba(50, 143, 98, 0.22);
  border-radius: 12px;
  overflow: hidden;
  background: var(--primary-50);
  cursor: pointer;
}

.image-tray img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.image-tray span {
  position: absolute;
  inset: auto 0 0;
  padding: 2px 0;
  color: #fff;
  background: rgba(23, 62, 46, 0.78);
  font-size: 11px;
}

.voice-status {
  margin: 0 0 8px;
  color: var(--primary-700);
  font-size: 12px;
}

.listening {
  color: var(--primary-600);
}

@media (max-width: 768px) {
  .floating-assistant {
    right: 12px;
    bottom: 76px;
    width: min(430px, calc(100vw - 24px));
    height: min(680px, calc(100vh - 100px));
    --agent-panel-width: min(350px, calc(100vw - 32px));
    --agent-panel-height: 248px;
    --agent-avatar-width: clamp(310px, 50vh, 410px);
    --agent-avatar-frame-height: min(390px, calc(100vh - 246px));
    --agent-avatar-stage-height: min(680px, calc(100vh + 40px));
  }

  .agent-panel {
    right: 50%;
    transform: translateX(50%);
  }

  .avatar-float {
    right: 50%;
    transform: translateX(50%);
  }
}
</style>
