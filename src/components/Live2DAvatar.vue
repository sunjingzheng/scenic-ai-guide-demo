<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  speaking: boolean
  emotion: string
}>()

const emit = defineEmits<{
  error: [message: string]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const isActive = ref(false)
let animationTimer: number | undefined
let LAppDelegate: any
let LAppDefine: any

const live2dCoreScript = 'Core/live2dcubismcore.js'
const live2dResourcePath = 'Resources/'

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Live2D Core 加载失败'))
    document.head.appendChild(script)
  })
}

function triggerMotion() {
  const delegate = LAppDelegate.getInstance() as unknown as {
    _subdelegates?: { at(index: number): { getLive2DManager(): unknown } | null }
  }
  const manager = delegate._subdelegates?.at(0)?.getLive2DManager() as
    | {
        _models?: { at(index: number): { startRandomMotion(group: string, priority: number): void } | null }
      }
    | undefined

  const model = manager?._models?.at(0)
  if (!model) return

  const group = props.speaking || props.emotion === 'smile' ? 'Tap' : 'Idle'
  model.startRandomMotion(group, LAppDefine.PriorityNormal)
}

async function mountLive2D() {
  if (window.__live2dAvatarMounted || !canvasRef.value) return
  window.__live2dAvatarMounted = true

  await nextTick()

  try {
    await loadScript(live2dCoreScript)
    const runtime = await import('../live2d/live2dRuntime.js')

    LAppDelegate = runtime.LAppDelegate
    LAppDefine = runtime.LAppDefine
    LAppDefine.setResourcesPath(live2dResourcePath)

    canvasRef.value.id = 'live2d-canvas'
    const delegate = LAppDelegate.getInstance()
    if (!delegate.initialize()) {
      throw new Error('Live2D 初始化失败')
    }
    window.__live2dGetModel = () => {
      const liveDelegate = LAppDelegate.getInstance() as unknown as {
        _subdelegates?: { at(index: number): { getLive2DManager(): unknown } | null }
      }
      const manager = liveDelegate._subdelegates?.at(0)?.getLive2DManager() as
        | { _models?: { at(index: number): unknown } }
        | undefined
      return manager?._models?.at(0) ?? null
    }
    delegate.run()
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
    if (!isActive.value || animationTimer) return
    animationTimer = window.setTimeout(() => {
      animationTimer = undefined
      triggerMotion()
    }, 120)
  }
)

onBeforeUnmount(() => {
  if (animationTimer) {
    window.clearTimeout(animationTimer)
  }
  if (isActive.value && LAppDelegate) {
    LAppDelegate.releaseInstance()
    window.__live2dAvatarMounted = false
    window.__live2dGetModel = undefined
  }
})
</script>

<template>
  <div class="live2d-avatar" :class="{ speaking }">
    <canvas ref="canvasRef" class="live2d-canvas"></canvas>
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

.live2d-avatar.speaking::after {
  content: '';
  position: absolute;
  inset: 14%;
  border: 1px solid rgba(64, 176, 132, 0.28);
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
