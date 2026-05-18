<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Live2DAvatar from './Live2DAvatar.vue'
import type { Live2DConfig } from '../types'

const props = defineProps<{
  speaking: boolean
  emotion: string
  outfit: string
  live2d?: Live2DConfig
}>()

const live2dFailed = ref(false)
const eyeClass = computed(() => (props.emotion === 'thinking' ? 'thinking' : 'bright'))
const mouthClass = computed(() =>
  props.speaking ? 'speaking' : props.emotion === 'smile' || props.emotion === 'happy' ? 'smile' : 'calm'
)
const live2dKey = computed(() => JSON.stringify(props.live2d || {}))
const live2dErrorText = computed(() => (live2dFailed.value ? 'Live2D 加载中断，请检查模型资源' : 'Live2D 未启用'))
const showFallback = computed(() => props.live2d?.enabled === false)

watch(live2dKey, () => {
  live2dFailed.value = false
})

function handleLive2DError(message: string) {
  live2dFailed.value = true
  console.warn(`[Live2D] ${message}`)
}
</script>

<template>
  <section class="avatar-stage">
    <Live2DAvatar
      v-if="!live2dFailed && live2d?.enabled !== false"
      :key="live2dKey"
      :speaking="speaking"
      :emotion="emotion"
      :config="live2d"
      @error="handleLive2DError"
    />
    <div v-else class="halo"></div>
    <div v-if="live2dFailed && !showFallback" class="live2d-status">{{ live2dErrorText }}</div>
    <div v-if="showFallback" class="avatar">
      <div class="hair"></div>
      <div class="head">
        <span class="eye left" :class="eyeClass"></span>
        <span class="eye right" :class="eyeClass"></span>
        <span class="brow left"></span>
        <span class="brow right"></span>
        <span class="mouth" :class="mouthClass"></span>
      </div>
      <div class="neck"></div>
      <div class="body">
        <div class="robe">
          <span></span>
          <strong>{{ outfit }}</strong>
        </div>
      </div>
    </div>
    <div class="voice-rings" :class="{ active: speaking }">
      <span></span>
      <span></span>
      <span></span>
    </div>
  </section>
</template>

<style scoped>
.avatar-stage {
  position: relative;
  min-height: 440px;
  display: grid;
  place-items: center;
  overflow: hidden;
}

.halo {
  position: absolute;
  width: 270px;
  height: 270px;
  border: 1px solid rgba(244, 201, 93, 0.45);
  border-radius: 50%;
  box-shadow: inset 0 0 50px rgba(244, 201, 93, 0.1);
}

.live2d-status {
  position: absolute;
  left: 50%;
  bottom: 28px;
  z-index: 3;
  width: max-content;
  max-width: 180px;
  transform: translateX(-50%);
  padding: 6px 10px;
  border-radius: 999px;
  color: var(--primary-700);
  background: rgba(238, 248, 241, 0.92);
  border: 1px solid rgba(50, 143, 98, 0.24);
  font-size: 12px;
  box-shadow: 0 8px 24px rgba(32, 42, 37, 0.12);
  text-align: center;
}

.avatar {
  position: relative;
  z-index: 2;
  display: grid;
  justify-items: center;
  transform-origin: center bottom;
}

.hair {
  width: 142px;
  height: 88px;
  margin-bottom: -56px;
  border-radius: 72px 72px 34px 34px;
  background: linear-gradient(145deg, #1b1c23, #453334);
}

.head {
  position: relative;
  width: 126px;
  height: 146px;
  border: 2px solid rgba(255, 235, 200, 0.45);
  border-radius: 56px 56px 48px 48px;
  background: linear-gradient(165deg, #ffe0bf, #c98f69);
}

.eye,
.brow,
.mouth {
  position: absolute;
  display: block;
}

.eye {
  top: 60px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #172124;
}

.eye.left {
  left: 36px;
}

.eye.right {
  right: 36px;
}

.eye.thinking {
  top: 64px;
  height: 5px;
  border-radius: 8px;
}

.brow {
  top: 47px;
  width: 22px;
  height: 4px;
  border-radius: 8px;
  background: rgba(80, 50, 44, 0.72);
}

.brow.left {
  left: 29px;
}

.brow.right {
  right: 29px;
}

.mouth {
  left: 50%;
  bottom: 32px;
  transform: translateX(-50%);
  background: #8b3d44;
  transition: 0.2s ease;
}

.mouth.calm {
  width: 34px;
  height: 6px;
  border-radius: 8px;
}

.mouth.smile {
  width: 42px;
  height: 22px;
  border-radius: 0 0 34px 34px;
}

.mouth.speaking {
  width: 28px;
  height: 34px;
  border-radius: 50%;
  animation: talk 0.34s infinite alternate;
}

.neck {
  width: 42px;
  height: 30px;
  background: #c58c69;
}

.body {
  width: 220px;
  height: 190px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 80px 80px 28px 28px;
  background: linear-gradient(140deg, #1f8b7a, #0d4b4f 48%, #d2a74b);
}

.robe {
  height: 100%;
  display: grid;
  place-items: center;
  color: #fff9d6;
}

.robe span {
  width: 2px;
  height: 160px;
  background: rgba(255, 239, 170, 0.7);
}

.robe strong {
  margin-top: -56px;
  font-size: 14px;
}

.voice-rings {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.voice-rings span {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 220px;
  height: 220px;
  border: 1px solid rgba(97, 230, 198, 0.42);
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0.82);
  opacity: 0;
}

.voice-rings.active span {
  animation: ring 1.8s infinite ease-out;
}

.voice-rings span:nth-child(2) {
  animation-delay: 0.35s;
}

.voice-rings span:nth-child(3) {
  animation-delay: 0.7s;
}

@keyframes talk {
  from {
    height: 18px;
  }

  to {
    height: 36px;
  }
}

@keyframes ring {
  from {
    opacity: 0.9;
    transform: translate(-50%, -50%) scale(0.7);
  }

  to {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.55);
  }
}
</style>
