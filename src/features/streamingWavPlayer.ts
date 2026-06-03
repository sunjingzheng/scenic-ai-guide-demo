/**
 * 流式 TTS 播放器：接收 wav 流，首 chunk 解析 wav header 拿采样率，
 * 后续 PCM raw 一边接一边用 Web Audio API 排队播放。
 * 同时实时计算音频能量驱动 Live2D 口型。
 *
 * 与逐句切片不同，这里整段文本一次性发给后端，后端转发 GPT-SoVITS 流式输出，
 * 真正做到 AI 生成完毕 → 几百毫秒就开始出声。
 */

import { getLive2DHandler } from "./live2dBridge";

const WAV_HEADER_SIZE = 44;
const MOUTH_FRAME_MS = 40; // 口型帧间隔（ms）

type WavInfo = {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
};

type MouthEntry = {
  startTime: number; // AudioContext time
  duration: number; // seconds
  values: Float32Array; // one mouth-open value per MOUTH_FRAME_MS
};

function parseWavHeader(view: DataView): WavInfo | null {
  if (view.byteLength < WAV_HEADER_SIZE) return null;
  if (
    view.getUint8(0) !== 0x52 || // R
    view.getUint8(1) !== 0x49 || // I
    view.getUint8(2) !== 0x46 || // F
    view.getUint8(3) !== 0x46 // F
  )
    return null;
  const channels = view.getUint16(22, true);
  const sampleRate = view.getUint32(24, true);
  const bitsPerSample = view.getUint16(34, true);
  return { sampleRate, channels, bitsPerSample };
}

function pcm16ToFloat32(pcm: Int16Array): Float32Array<ArrayBuffer> {
  const out = new Float32Array(pcm.length);
  for (let i = 0; i < pcm.length; i += 1) {
    out[i] = Math.max(-1, Math.min(1, pcm[i] / 0x8000));
  }
  return out;
}

/**
 * 计算 PCM 数据的 RMS 能量帧（用于驱动 Live2D 口型）
 * 返回每 MOUTH_FRAME_MS 一帧的口型张开值（0~1）
 */
function computeMouthFrames(
  samples: Float32Array,
  sampleRate: number,
  channels: number,
): Float32Array {
  const framesPerSecond = 1000 / MOUTH_FRAME_MS;
  const samplesPerFrame =
    Math.max(1, Math.floor(sampleRate / framesPerSecond)) * channels;
  const frameCount = Math.max(1, Math.ceil(samples.length / samplesPerFrame));
  const frames = new Float32Array(frameCount);

  // 两遍扫描：先算所有原始值，再归一化
  const rawValues = new Float32Array(frameCount);
  for (let f = 0; f < frameCount; f++) {
    const start = f * samplesPerFrame;
    const end = Math.min(samples.length, start + samplesPerFrame);
    let sum = 0;
    let count = 0;
    for (let i = start; i < end; i++) {
      const v = samples[i] || 0;
      sum += v * v;
      count++;
    }
    rawValues[f] = count > 0 ? Math.sqrt(sum / count) : 0;
  }

  // 计算分位数做自适应阈值
  const sorted = [...rawValues].sort((a, b) => a - b);
  const noiseFloor = sorted[Math.floor(sorted.length * 0.1)] || 0.001;
  const peak = sorted[Math.floor(sorted.length * 0.9)] || 0.1;
  const range = Math.max(0.01, peak - noiseFloor);

  for (let f = 0; f < frameCount; f++) {
    const v = (rawValues[f] - noiseFloor) / range;
    frames[f] = Math.max(0, Math.min(1, v * 1.2));
  }

  return frames;
}

export class StreamingWavPlayer {
  private ctx: AudioContext | null = null;
  private wav: WavInfo | null = null;
  private leftover: Uint8Array<ArrayBuffer> = new Uint8Array(0);
  private playHead = 0;
  private nodes: AudioBufferSourceNode[] = [];
  private aborter: AbortController | null = null;
  private started = false;
  private endResolve: (() => void) | null = null;
  private endPromise: Promise<void> | null = null;
  private playingNodes = 0;
  private mouthRaf: number | undefined;
  private mouthEntries: MouthEntry[] = [];
  onPlayingChange: ((playing: boolean) => void) | null = null;

  async play(url: string, init: RequestInit) {
    this.stop();
    this.ctx = new AudioContext();
    this.aborter = new AbortController();
    this.endPromise = new Promise((resolve) => {
      this.endResolve = resolve;
    });
    this.mouthEntries = [];

    const response = await fetch(url, { ...init, signal: this.aborter.signal });
    if (!response.ok || !response.body) {
      throw new Error(`TTS stream failed: ${response.status}`);
    }

    const reader = response.body.getReader();
    let headerBuf: Uint8Array | null = null;

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (!value || value.length === 0) continue;

        if (!this.wav) {
          headerBuf = headerBuf ? concat(headerBuf, value) : value;
          if (headerBuf.length < WAV_HEADER_SIZE) continue;
          const info = parseWavHeader(
            new DataView(
              headerBuf.buffer,
              headerBuf.byteOffset,
              headerBuf.byteLength,
            ),
          );
          if (!info) throw new Error("TTS stream: invalid wav header");
          this.wav = info;
          const tail = headerBuf.subarray(WAV_HEADER_SIZE);
          headerBuf = null;
          if (tail.length > 0) this._enqueuePcm(tail);
        } else {
          this._enqueuePcm(value);
        }
      }

      // flush 残余字节
      if (this.leftover.length >= 2) {
        this._enqueuePcm(new Uint8Array(0), true);
      }
    } finally {
      reader.releaseLock?.();
    }

    // 启动 Live2D 口型同步 RAF 循环
    this._startMouthSync();

    // 等所有已排队的 source 播完
    await this._waitUntilDone();
    this._stopMouthSync();
  }

  stop() {
    this.aborter?.abort();
    this.aborter = null;
    for (const node of this.nodes) {
      try {
        node.stop();
      } catch {
        /* ignore */
      }
      try {
        node.disconnect();
      } catch {
        /* ignore */
      }
    }
    this.nodes = [];
    this.playingNodes = 0;
    this.started = false;
    this.wav = null;
    this.leftover = new Uint8Array(0);
    this.playHead = 0;
    this.mouthEntries = [];
    this._stopMouthSync();
    if (this.ctx && this.ctx.state !== "closed") {
      this.ctx.close().catch(() => {});
    }
    this.ctx = null;
    if (this.endResolve) {
      this.endResolve();
      this.endResolve = null;
    }
    this._setPlaying(false);
  }

  private _enqueuePcm(chunk: Uint8Array, _flushLast = false) {
    if (!this.ctx || !this.wav) return;
    let combined: Uint8Array<ArrayBuffer>;
    if (this.leftover.length > 0) {
      combined = concat(this.leftover, chunk);
      this.leftover = new Uint8Array(0);
    } else {
      combined = toOwned(chunk);
    }

    const usableLen = combined.length - (combined.length % 2);
    if (usableLen <= 0) {
      this.leftover = combined;
      return;
    }
    if (usableLen < combined.length) {
      this.leftover = combined.subarray(usableLen) as Uint8Array<ArrayBuffer>;
    }

    const pcm = new Int16Array(
      combined.buffer,
      combined.byteOffset,
      usableLen / 2,
    );
    const float32 = pcm16ToFloat32(pcm);

    // 计算口型帧
    const mouthValues = computeMouthFrames(
      float32,
      this.wav.sampleRate,
      this.wav.channels,
    );

    const buffer = this.ctx.createBuffer(
      this.wav.channels,
      float32.length / this.wav.channels,
      this.wav.sampleRate,
    );
    if (this.wav.channels === 1) {
      buffer.copyToChannel(float32, 0);
    } else {
      for (let ch = 0; ch < this.wav.channels; ch += 1) {
        const channelData = new Float32Array(
          float32.length / this.wav.channels,
        );
        for (let i = 0; i < channelData.length; i += 1) {
          channelData[i] = float32[i * this.wav.channels + ch];
        }
        buffer.copyToChannel(channelData, ch);
      }
    }

    const node = this.ctx.createBufferSource();
    node.buffer = buffer;
    node.connect(this.ctx.destination);

    const startAt = Math.max(this.playHead, this.ctx.currentTime + 0.05);
    node.start(startAt);
    this.playHead = startAt + buffer.duration;

    // 记录口型数据
    this.mouthEntries.push({
      startTime: startAt,
      duration: buffer.duration,
      values: mouthValues,
    });

    this.nodes.push(node);
    this.playingNodes += 1;
    if (!this.started) {
      this.started = true;
      this._setPlaying(true);
    }
    node.onended = () => {
      this.playingNodes = Math.max(0, this.playingNodes - 1);
      if (this.playingNodes === 0) {
        this._setPlaying(false);
      }
    };
  }

  private _startMouthSync() {
    if (this.mouthRaf) return;
    const tick = () => {
      if (!this.ctx || this.playingNodes === 0) {
        this.mouthRaf = requestAnimationFrame(tick);
        return;
      }

      const now = this.ctx.currentTime;
      let mouthOpen = 0;

      // 在当前播放位置查找对应的口型值
      for (const entry of this.mouthEntries) {
        if (now >= entry.startTime && now < entry.startTime + entry.duration) {
          const elapsedInChunk = now - entry.startTime;
          const frameIndex = Math.floor(
            elapsedInChunk / (MOUTH_FRAME_MS / 1000),
          );
          if (frameIndex >= 0 && frameIndex < entry.values.length) {
            mouthOpen = entry.values[frameIndex];
          }
          break;
        }
      }

      this._setMouthOpen(mouthOpen);
      this.mouthRaf = requestAnimationFrame(tick);
    };
    tick();
  }

  private _stopMouthSync() {
    if (this.mouthRaf) {
      cancelAnimationFrame(this.mouthRaf);
      this.mouthRaf = undefined;
    }
    // 复位口型
    this._setMouthOpen(0);
  }

  // 通过 Live2D bridge 驱动口型
  private _setMouthOpen(value: number) {
    getLive2DHandler()?.setMouthOpen?.(value);
  }

  private _setPlaying(playing: boolean) {
    this.onPlayingChange?.(playing);
  }

  private async _waitUntilDone() {
    if (!this.ctx) return;
    while (this.playingNodes > 0 || this.ctx.currentTime < this.playHead) {
      await new Promise((r) => setTimeout(r, 60));
      if (!this.ctx) return;
    }
    this._setPlaying(false);
    if (this.endResolve) {
      this.endResolve();
      this.endResolve = null;
    }
    if (this.ctx && this.ctx.state !== "closed") {
      this.ctx.close().catch(() => {});
    }
    this.ctx = null;
  }
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

function toOwned(buf: Uint8Array): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(buf.length);
  out.set(buf, 0);
  return out;
}
