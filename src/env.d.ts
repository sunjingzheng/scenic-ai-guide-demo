/// <reference types="vite/client" />

type SpeechRecognitionConstructor = new () => SpeechRecognition
type Live2DPixiApplication = {
  renderer: { resize(width: number, height: number): void }
  stage: { addChild(model: Live2DModelInstance): void }
  destroy(removeView?: boolean, options?: Record<string, boolean>): void
}

type Live2DModelInstance = {
  width?: number
  height?: number
  scale: { set(value: number): void }
  anchor?: { set(x: number, y: number): void }
  position: { set(x: number, y: number): void }
  internalModel?: {
    coreModel?: {
      setParameterValueById?(parameterId: string, value: number): void
    }
  }
  getLocalBounds?(): { width: number; height: number }
  motion?(group: string): void
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionResult {
  readonly length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList
}

interface SpeechRecognition extends EventTarget {
  lang: string
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start(): void
}

interface Window {
  PIXI?: {
    Application: new (options: Record<string, unknown>) => Live2DPixiApplication
    live2d?: {
      Live2DModel?: {
        from(url: string, options?: Record<string, unknown>): Promise<Live2DModelInstance>
      }
    }
  }
  AudioContext?: typeof AudioContext
  webkitAudioContext?: typeof AudioContext
  SpeechRecognition?: SpeechRecognitionConstructor
  webkitSpeechRecognition?: SpeechRecognitionConstructor
  __live2dAvatarMounted?: boolean
  __live2dGetModel?: () => {
    _wavFileHandler?: {
      startFromBuffer(buffer: ArrayBuffer): Promise<void>
      waitUntilEnd(): Promise<void>
      stop(): void
    }
    triggerMotion?: () => void
    setEmotion?: (emotion: string) => void
  } | null
}
