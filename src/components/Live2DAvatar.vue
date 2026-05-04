<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import type { Live2DConfig } from '../types'

const props = defineProps<{
  speaking: boolean
  emotion: string
  config?: Live2DConfig
}>()

const emit = defineEmits<{
  error: [message: string]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const loading = ref(true)
const isActive = ref(false)

const repoBase =
  props.config?.assetBase ||
  import.meta.env.VITE_LIVE2D_ASSET_BASE ||
  'https://cdn.jsdelivr.net/gh/luckui/ai-live2d-go@nightly/public'

// 支持完整 URL、public 下的 / 开头路径，或相对于 assetBase 的模型资源路径。
function resolveAssetUrl(value: string | undefined, fallbackPath: string) {
  const candidate = value?.trim() || fallbackPath
  if (/^(https?:)?\/\//.test(candidate) || candidate.startsWith('/')) return candidate
  return `${repoBase.replace(/\/$/, '')}/${candidate.replace(/^\//, '')}`
}

const scripts = [
  resolveAssetUrl(props.config?.coreUrl || import.meta.env.VITE_LIVE2D_CORE_URL, 'Core/live2dcubismcore.js'),
  props.config?.pixiUrl ||
  import.meta.env.VITE_PIXI_URL || 'https://cdn.jsdelivr.net/npm/pixi.js@6.5.10/dist/browser/pixi.min.js',
  props.config?.runtimeUrl ||
  import.meta.env.VITE_PIXI_LIVE2D_URL ||
    'https://cdn.jsdelivr.net/npm/pixi-live2d-display@0.4.0/dist/cubism4.min.js'
]
const modelUrl = resolveAssetUrl(
  props.config?.modelUrl || import.meta.env.VITE_LIVE2D_MODEL_URL,
  'Resources/Hiyori_pro/hiyori_pro_t11.model3.json'
)

let app: Live2DPixiApplication | null = null
let model: Live2DModelInstance | null = null
let animationTimer: number | undefined
let mouthRaf: number | undefined

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)
    if (existing?.dataset.loaded === 'true') {
      resolve()
      return
    }

    const script = existing ?? document.createElement('script')
    script.src = src
    script.async = false
    script.onload = () => {
      script.dataset.loaded = 'true'
      resolve()
    }
    script.onerror = () => reject(new Error(`Live2D 依赖加载失败：${src}`))
    if (!existing) document.head.appendChild(script)
  })
}

async function loadScripts() {
  for (const script of scripts) {
    await loadScript(script)
  }
}

function resizeModel() {
  if (!canvasRef.value || !app || !model) return

  const rect = canvasRef.value.getBoundingClientRect()
  app.renderer.resize(rect.width, rect.height)

  const bounds = model.getLocalBounds?.()
  const width = Math.max(bounds?.width || model.width || 1, 1)
  const height = Math.max(bounds?.height || model.height || 1, 1)
  const scale = Math.min((rect.width * 0.92) / width, (rect.height * 1.1) / height)

  model.scale.set(scale)
  model.anchor?.set?.(0.5, 0.5)
  model.position.set(rect.width / 2, rect.height * 0.58)
}

function getCoreModel() {
  return model?.internalModel?.coreModel
}

function setParameter(parameterId: string, value: number) {
  const coreModel = getCoreModel()
  coreModel?.setParameterValueById?.(parameterId, value)
}

function motion(group: string) {
  try {
    model?.motion?.(group)
  } catch {
    // Some models omit optional motion groups; ignore and keep idle animation.
  }
}

function triggerMotion() {
  if (!model) return
  if (props.speaking) {
    motion('Tap')
    return
  }
  if (props.emotion === 'thinking') {
    motion('Idle')
  } else {
    motion('Tap')
  }
}

function applyEmotion() {
  if (!model) return

  const isSmile = props.emotion === 'smile' || props.emotion === 'happy'
  const isThinking = props.emotion === 'thinking'

  setParameter('ParamMouthForm', isSmile ? 0.9 : isThinking ? -0.2 : 0)
  setParameter('ParamEyeLSmile', isSmile ? 0.9 : 0)
  setParameter('ParamEyeRSmile', isSmile ? 0.9 : 0)
  setParameter('ParamBrowLY', isThinking ? 0.3 : isSmile ? 0.4 : 0)
  setParameter('ParamBrowRY', isThinking ? -0.2 : isSmile ? 0.4 : 0)
}

// 本地 TTS 返回音频时，用音频波形能量驱动 Live2D 的嘴巴开合参数。
function startMouthSyncFromBuffer(buffer: ArrayBuffer) {
  return new Promise<void>(async (resolve) => {
    stopMouthSync()

    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) {
      resolve()
      return
    }

    const ctx = new AudioContextClass()
    const audioBuffer = await ctx.decodeAudioData(buffer.slice(0))
    const source = ctx.createBufferSource()
    const analyser = ctx.createAnalyser()
    const data = new Float32Array(analyser.fftSize)

    analyser.fftSize = 256
    source.buffer = audioBuffer
    source.connect(analyser)
    analyser.connect(ctx.destination)
    source.onended = () => {
      stopMouthSync()
      void ctx.close().catch(() => {})
      resolve()
    }

    const tick = () => {
      analyser.getFloatTimeDomainData(data)
      let sum = 0
      for (const item of data) sum += item * item
      setParameter('ParamMouthOpenY', Math.min(Math.sqrt(sum / data.length) * 5, 1))
      mouthRaf = window.requestAnimationFrame(tick)
    }

    source.start()
    tick()
  })
}

function stopMouthSync() {
  if (mouthRaf) {
    window.cancelAnimationFrame(mouthRaf)
    mouthRaf = undefined
  }
  setParameter('ParamMouthOpenY', 0)
}

async function mountLive2D() {
  if (window.__live2dAvatarMounted || !canvasRef.value) return
  window.__live2dAvatarMounted = true

  await nextTick()

  try {
    await loadScripts()

    const PIXI = window.PIXI
    const Live2DModel = PIXI?.live2d?.Live2DModel
    if (!PIXI || !Live2DModel) {
      throw new Error('Live2D Web 运行时不可用')
    }

    app = new PIXI.Application({
      view: canvasRef.value,
      autoStart: true,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    })

    model = await Live2DModel.from(modelUrl, {
      autoInteract: true
    })
    app.stage.addChild(model)
    resizeModel()
    applyEmotion()

    window.addEventListener('resize', resizeModel)
    window.__live2dGetModel = () => ({
      _wavFileHandler: {
        startFromBuffer: startMouthSyncFromBuffer,
        waitUntilEnd: () => Promise.resolve(),
        stop: stopMouthSync
      },
      triggerMotion,
      setEmotion: (emotion: string) => {
        if (emotion) motion(emotion === 'thinking' ? 'Idle' : 'Tap')
        applyEmotion()
      }
    })

    loading.value = false
    isActive.value = true
  } catch (error) {
    window.__live2dAvatarMounted = false
    emit('error', error instanceof Error ? error.message : 'Live2D 初始化失败')
  }
}

onMounted(mountLive2D)

watch(
  () => [props.speaking, props.emotion],
  () => {
    applyEmotion()
    if (!isActive.value || animationTimer) return
    animationTimer = window.setTimeout(() => {
      animationTimer = undefined
      triggerMotion()
    }, 120)
  }
)

onBeforeUnmount(() => {
  if (animationTimer) window.clearTimeout(animationTimer)
  stopMouthSync()
  window.removeEventListener('resize', resizeModel)
  app?.destroy(true, { children: true, texture: false, baseTexture: false })
  app = null
  model = null
  isActive.value = false
  window.__live2dAvatarMounted = false
  window.__live2dGetModel = undefined
})
</script>

<template>
  <div class="live2d-avatar" :class="{ speaking }">
    <canvas ref="canvasRef" class="live2d-canvas"></canvas>
    <div v-if="loading" class="live2d-loading">Loading</div>
  </div>
</template>

<style scoped>
.live2d-avatar {
  width: 100%;
  height: 100%;
  min-width: 96px;
  min-height: 132px;
  position: relative;
  display: grid;
  place-items: center;
}

.live2d-canvas {
  width: 100%;
  height: 100%;
  display: block;
  touch-action: none;
}

.live2d-loading {
  position: absolute;
  inset: auto 0 12px;
  color: var(--text-tertiary);
  font-size: 12px;
  text-align: center;
}

.live2d-avatar.speaking::after {
  content: '';
  position: absolute;
  inset: 14%;
  border: 1px solid rgba(50, 143, 98, 0.28);
  border-radius: 999px;
  animation: live2d-pulse 1.4s ease-out infinite;
  pointer-events: none;
}

@keyframes live2d-pulse {
  from {
    transform: scale(0.86);
    opacity: 0.72;
  }

  to {
    transform: scale(1.14);
    opacity: 0;
  }
}
</style>
