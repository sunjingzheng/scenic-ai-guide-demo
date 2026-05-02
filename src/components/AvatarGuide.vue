<script setup lang="ts">
import { computed, ref } from 'vue'
import Live2DAvatar from './Live2DAvatar.vue'

const props = defineProps<{
  speaking: boolean
  emotion: string
  outfit: string
}>()

const live2dFailed = ref(false)
const eyeClass = computed(() => (props.emotion === 'thinking' ? 'thinking' : 'bright'))
const mouthClass = computed(() => (props.speaking ? 'speaking' : props.emotion === 'smile' ? 'smile' : 'calm'))
</script>

<template>
  <section class="avatar-stage">
    <Live2DAvatar
      v-if="!live2dFailed"
      :speaking="speaking"
      :emotion="emotion"
      @error="live2dFailed = true"
    />
    <div v-else class="halo"></div>
    <div v-if="live2dFailed" class="avatar">
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
