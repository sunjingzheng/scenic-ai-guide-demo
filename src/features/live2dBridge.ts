export type Live2DHandler = {
  _wavFileHandler?: {
    startFromBuffer(buffer: ArrayBuffer): Promise<void>;
    waitUntilEnd(): Promise<void>;
    stop(): void;
  };
  getMouthOpen?: () => number;
  /** 由外部实时驱动口型张开度（0~1），用于流式 TTS 播放时同步口型 */
  setMouthOpen?: (value: number) => void;
  triggerMotion?: () => void;
  setEmotion?: (emotion: string) => void;
};

let activeId: symbol | null = null;
let activeHandler: Live2DHandler | null = null;

export function registerLive2DHandler(id: symbol, handler: Live2DHandler) {
  activeId = id;
  activeHandler = handler;
}

export function unregisterLive2DHandler(id: symbol) {
  if (activeId !== id) return;
  activeId = null;
  activeHandler = null;
}

export function getLive2DHandler() {
  return activeHandler;
}

export function stopLive2DAudio() {
  activeHandler?._wavFileHandler?.stop();
}
