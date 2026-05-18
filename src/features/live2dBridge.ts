export type Live2DHandler = {
  _wavFileHandler?: {
    startFromBuffer(buffer: ArrayBuffer): Promise<void>
    waitUntilEnd(): Promise<void>
    stop(): void
  }
  getMouthOpen?: () => number
  triggerMotion?: () => void
  setEmotion?: (emotion: string) => void
}

let activeId: symbol | null = null
let activeHandler: Live2DHandler | null = null

export function registerLive2DHandler(id: symbol, handler: Live2DHandler) {
  activeId = id
  activeHandler = handler
}

export function unregisterLive2DHandler(id: symbol) {
  if (activeId !== id) return
  activeId = null
  activeHandler = null
}

export function getLive2DHandler() {
  return activeHandler
}

export function stopLive2DAudio() {
  activeHandler?._wavFileHandler?.stop()
}
