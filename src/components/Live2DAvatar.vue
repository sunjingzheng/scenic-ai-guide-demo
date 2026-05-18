<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { registerLive2DHandler, unregisterLive2DHandler } from '../features/live2dBridge'
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
const instanceId = Symbol('live2d-avatar')

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
  import.meta.env.VITE_PIXI_URL || '/live2d/vendor/pixi-legacy.min.js',
  props.config?.runtimeUrl ||
  import.meta.env.VITE_PIXI_LIVE2D_URL ||
    '/live2d/vendor/cubism4.min.js'
]
const modelUrl = resolveAssetUrl(
  props.config?.modelUrl || import.meta.env.VITE_LIVE2D_MODEL_URL,
  'Resources/Hiyori_pro/hiyori_pro_t11.model3.json'
)

let app: Live2DPixiApplication | null = null
let model: Live2DModelInstance | null = null
let animationTimer: number | undefined
let mouthRaf: number | undefined
let fallbackMouthRaf: number | undefined
let activeAudioContext: AudioContext | null = null
let activeAudioSource: AudioBufferSourceNode | null = null
let mouthEnvelope = 0
let lastMouthOpen = 0
let disposed = false

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function quantile(values: number[], ratio: number) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * ratio)))]
}

function buildMouthFrames(audioBuffer: AudioBuffer, fps = 72) {
  const samplesPerFrame = Math.max(1, Math.floor(audioBuffer.sampleRate / fps))
  const frameCount = Math.max(1, Math.ceil(audioBuffer.length / samplesPerFrame))
  const rawFrames = new Array<number>(frameCount).fill(0)
  const normalizedFrames = new Array<number>(frameCount).fill(0)
  const channels = Array.from({ length: audioBuffer.numberOfChannels }, (_, index) => audioBuffer.getChannelData(index))

  for (let frame = 0; frame < frameCount; frame += 1) {
    const start = frame * samplesPerFrame
    const end = Math.min(audioBuffer.length, start + samplesPerFrame)
    let sum = 0
    let peak = 0
    let samples = 0

    for (const channel of channels) {
      for (let index = start; index < end; index += 1) {
        const value = channel[index] || 0
        const abs = Math.abs(value)
        sum += value * value
        if (abs > peak) peak = abs
        samples += 1
      }
    }

    const rms = samples ? Math.sqrt(sum / samples) : 0
    rawFrames[frame] = rms * 0.78 + peak * 0.22
  }

  const noise = Math.max(0.0008, quantile(rawFrames, 0.08))
  const loud = Math.max(noise + 0.012, quantile(rawFrames, 0.92))

  for (let frame = 0; frame < frameCount; frame += 1) {
    const prev = rawFrames[Math.max(0, frame - 1)]
    const current = rawFrames[frame]
    const next = rawFrames[Math.min(frameCount - 1, frame + 1)]
    const smoothed = current * 0.58 + prev * 0.21 + next * 0.21
    normalizedFrames[frame] = clamp((smoothed - noise * 0.62) / (loud - noise * 0.62), 0, 1)
  }

  return { fps, noise, rawFrames, normalizedFrames }
}

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
    const timeout = window.setTimeout(() => {
      reject(new Error(`Live2D 依赖加载超时：${src}`))
    }, 12000)
    script.onload = () => {
      window.clearTimeout(timeout)
      script.dataset.loaded = 'true'
      resolve()
    }
    script.onerror = () => {
      window.clearTimeout(timeout)
      reject(new Error(`Live2D 依赖加载失败：${src}`))
    }
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

  const stageRect = canvasRef.value.parentElement?.getBoundingClientRect() || canvasRef.value.getBoundingClientRect()
  const width = Math.max(stageRect.width, 1)
  const height = Math.max(stageRect.height, 1)
  app.renderer.resize(width, height)
  canvasRef.value.style.width = '100%'
  canvasRef.value.style.height = '100%'

  const bounds = model.getLocalBounds?.()
  const modelWidth = Math.max(bounds?.width || model.width || 1, 1)
  const modelHeight = Math.max(bounds?.height || model.height || 1, 1)
  const scale = Math.min((width * 1.04) / modelWidth, (height * 1.24) / modelHeight)

  model.scale.set(scale)
  model.anchor?.set?.(0.5, 0.5)
  model.position.set(width / 2, height * 0.62)
}

function getCoreModel() {
  return model?.internalModel?.coreModel
}

function setParameter(parameterId: string, value: number) {
  const coreModel = getCoreModel()
  if (parameterId === 'ParamMouthOpenY') lastMouthOpen = value
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

function startFallbackMouthMotion() {
  if (fallbackMouthRaf || mouthRaf) return

  const startedAt = performance.now()
  const tick = () => {
    const elapsed = performance.now() - startedAt
    const syllable = Math.max(0, Math.sin(elapsed / 54))
    const phrase = Math.max(0, Math.sin(elapsed / 310))
    setParameter('ParamMouthOpenY', Math.max(0.06, Math.min(0.72, 0.12 + syllable * 0.46 + phrase * 0.14)))
    fallbackMouthRaf = window.requestAnimationFrame(tick)
  }
  tick()
}

function stopFallbackMouthMotion() {
  if (fallbackMouthRaf) {
    window.cancelAnimationFrame(fallbackMouthRaf)
    fallbackMouthRaf = undefined
  }
}

// 本地 TTS 返回音频时，先预计算整段音频能量曲线，再按播放时间轴驱动 Live2D 嘴部。
function startMouthSyncFromBuffer(buffer: ArrayBuffer) {
  return new Promise<void>(async (resolve) => {
    stopMouthSync()
    stopFallbackMouthMotion()

    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) {
      resolve()
      return
    }

    const ctx = new AudioContextClass()
    const audioBuffer = await ctx.decodeAudioData(buffer.slice(0))
    const source = ctx.createBufferSource()
    const mouthFrames = buildMouthFrames(audioBuffer)
    let resolved = false
    let startedAt = 0

    activeAudioContext = ctx
    activeAudioSource = source
    mouthEnvelope = 0
    source.buffer = audioBuffer
    source.connect(ctx.destination)
    source.onended = () => {
      if (resolved) return
      resolved = true
      if (mouthRaf) {
        window.cancelAnimationFrame(mouthRaf)
        mouthRaf = undefined
      }
      activeAudioSource = null
      activeAudioContext = null
      mouthEnvelope = 0
      setParameter('ParamMouthOpenY', 0)
      void ctx.close().catch(() => {})
      resolve()
    }

    const tick = () => {
      if (activeAudioSource !== source) return
      const elapsedSeconds = Math.max(0, ctx.currentTime - startedAt)
      const frameIndex = Math.min(
        mouthFrames.normalizedFrames.length - 1,
        Math.floor(elapsedSeconds * mouthFrames.fps)
      )
      const energy = mouthFrames.normalizedFrames[frameIndex] || 0
      const rawEnergy = mouthFrames.rawFrames[frameIndex] || 0
      const audible = energy > 0.018 || rawEnergy > mouthFrames.noise * 1.18
      const elapsedMs = elapsedSeconds * 1000
      const syllable = audible ? Math.max(0, Math.sin(elapsedMs / 58) * 0.75 + Math.sin(elapsedMs / 132) * 0.25) : 0
      const target = audible
        ? clamp(0.18 + Math.pow(energy, 0.62) * 0.58 + syllable * 0.2, 0.12, 0.94)
        : clamp(energy * 0.2, 0, 0.16)
      const attack = target > mouthEnvelope ? 0.82 : 0.34
      mouthEnvelope += (target - mouthEnvelope) * attack
      const open = clamp(mouthEnvelope, 0, 0.96)
      setParameter('ParamMouthOpenY', open < 0.025 ? 0 : open)
      mouthRaf = window.requestAnimationFrame(tick)
    }

    startedAt = ctx.currentTime + 0.02
    source.start(startedAt)
    tick()
  })
}

function stopMouthSync() {
  const source = activeAudioSource
  const ctx = activeAudioContext
  activeAudioSource = null
  activeAudioContext = null
  if (mouthRaf) {
    window.cancelAnimationFrame(mouthRaf)
    mouthRaf = undefined
  }
  if (source) {
    try {
      source.onended = null
      source.stop()
    } catch {
      // Source may already have ended.
    }
  }
  if (ctx) void ctx.close().catch(() => {})
  mouthEnvelope = 0
  stopFallbackMouthMotion()
  setParameter('ParamMouthOpenY', 0)
}

async function mountLive2D() {
  if (!canvasRef.value) return

  await nextTick()
  if (disposed || !canvasRef.value) return

  try {
    await loadScripts()
    if (disposed || !canvasRef.value) return

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
    if (disposed || !canvasRef.value) {
      model?.destroy?.({ children: true })
      app?.destroy(true, { children: true, texture: false, baseTexture: false })
      app = null
      model = null
      return
    }

    app.stage.addChild(model)
    resizeModel()
    applyEmotion()

    window.addEventListener('resize', resizeModel)
    registerLive2DHandler(instanceId, {
      _wavFileHandler: {
        startFromBuffer: startMouthSyncFromBuffer,
        waitUntilEnd: () => Promise.resolve(),
        stop: stopMouthSync
      },
      getMouthOpen: () => lastMouthOpen,
      triggerMotion,
      setEmotion: (emotion: string) => {
        if (emotion) motion(emotion === 'thinking' ? 'Idle' : 'Tap')
        applyEmotion()
      }
    })

    loading.value = false
    isActive.value = true
  } catch (error) {
    if (disposed) return
    unregisterLive2DHandler(instanceId)
    emit('error', error instanceof Error ? error.message : 'Live2D 初始化失败')
  }
}

onMounted(mountLive2D)

watch(
  () => [props.speaking, props.emotion],
  () => {
    applyEmotion()
    if (props.speaking) startFallbackMouthMotion()
    else stopMouthSync()
    if (!isActive.value || animationTimer) return
    animationTimer = window.setTimeout(() => {
      animationTimer = undefined
      triggerMotion()
    }, 120)
  }
)

onBeforeUnmount(() => {
  disposed = true
  if (animationTimer) window.clearTimeout(animationTimer)
  stopMouthSync()
  window.removeEventListener('resize', resizeModel)
  app?.destroy(true, { children: true, texture: false, baseTexture: false })
  app = null
  model = null
  isActive.value = false
  unregisterLive2DHandler(instanceId)
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
  width: 100% !important;
  height: 100% !important;
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
