<script setup lang="ts">
import { computed, ref, watch } from "vue";
import Live2DAvatar from "./Live2DAvatar.vue";
import type { Live2DConfig } from "../types";

const props = defineProps<{
  speaking: boolean;
  emotion: string;
  outfit: string;
  outfitImage?: string;
  outfitModelUrl?: string;
  live2d?: Live2DConfig;
}>();

const live2dFailed = ref(false);
const eyeClass = computed(() =>
  props.emotion === "thinking" ? "thinking" : "bright",
);
const mouthClass = computed(() =>
  props.speaking
    ? "speaking"
    : props.emotion === "smile" || props.emotion === "happy"
      ? "smile"
      : "calm",
);
const live2dKey = computed(() => JSON.stringify(props.live2d || {}));
const live2dErrorText = computed(() =>
  live2dFailed.value ? "Live2D 加载中断，请检查模型资源" : "Live2D 未启用",
);
const showFallback = computed(() => props.live2d?.enabled === false);

watch(live2dKey, () => {
  live2dFailed.value = false;
});

function handleLive2DError(message: string) {
  live2dFailed.value = true;
  console.warn(`[Live2D] ${message}`);
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
      :model-url="outfitModelUrl"
      @error="handleLive2DError"
    />
    <div v-else class="halo"></div>
    <div v-if="live2dFailed && !showFallback" class="live2d-status">
      {{ live2dErrorText }}
    </div>
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
          <img
            v-if="outfitImage"
            :src="outfitImage"
            :alt="outfit"
            class="outfit-img"
          />
          <span v-else></span>
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
  min-height: 520px;
  display: grid;
  place-items: center;
  overflow: hidden;
}

.halo {
  position: absolute;
  width: 330px;
  height: 330px;
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
  width: 178px;
  height: 110px;
  margin-bottom: -70px;
  border-radius: 90px 90px 42px 42px;
  background: linear-gradient(145deg, #1b1c23, #453334);
}

.head {
  position: relative;
  width: 158px;
  height: 182px;
  border: 2px solid rgba(255, 235, 200, 0.45);
  border-radius: 70px 70px 60px 60px;
  background: linear-gradient(165deg, #ffe0bf, #c98f69);
}

.eye,
.brow,
.mouth {
  position: absolute;
  display: block;
}

.eye {
  top: 75px;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: #172124;
}

.eye.left {
  left: 45px;
}

.eye.right {
  right: 45px;
}

.eye.thinking {
  top: 80px;
  height: 6px;
  border-radius: 8px;
}

.brow {
  top: 58px;
  width: 28px;
  height: 5px;
  border-radius: 8px;
  background: rgba(80, 50, 44, 0.72);
}

.brow.left {
  left: 36px;
}

.brow.right {
  right: 36px;
}

.mouth {
  left: 50%;
  bottom: 40px;
  transform: translateX(-50%);
  background: #8b3d44;
  transition: 0.2s ease;
}

.mouth.calm {
  width: 42px;
  height: 8px;
  border-radius: 8px;
}

.mouth.smile {
  width: 52px;
  height: 28px;
  border-radius: 0 0 44px 44px;
}

.mouth.speaking {
  width: 35px;
  height: 42px;
  border-radius: 50%;
  animation: talk 0.34s infinite alternate;
}

.neck {
  width: 52px;
  height: 38px;
  background: #c58c69;
}

.body {
  width: 270px;
  height: 230px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 100px 100px 36px 36px;
  background: linear-gradient(140deg, #1f8b7a, #0d4b4f 48%, #d2a74b);
}

.robe {
  height: 100%;
  display: grid;
  place-items: center;
  color: #fff9d6;
}

.robe .outfit-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
}

.robe span {
  width: 2px;
  height: 200px;
  background: rgba(255, 239, 170, 0.7);
}

.robe strong {
  margin-top: -70px;
  font-size: 16px;
  position: relative;
  z-index: 1;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
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
  width: 270px;
  height: 270px;
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
    height: 22px;
  }

  to {
    height: 44px;
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
