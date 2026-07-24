'use client';

import {
  FilesetResolver,
  ImageSegmenter,
  ImageSegmenterResult,
} from '@mediapipe/tasks-vision';

export type VirtualBackgroundMode = 'none' | 'blur' | 'image';

export interface VirtualBackgroundOptions {
  mode: VirtualBackgroundMode;
  blurAmount?: number; 
  backgroundImage?: HTMLImageElement | ImageBitmap | null;
  frameRate?: number; 
  modelAssetPath?: string;
  wasmBasePath?: string;
}

const DEFAULT_MODEL =
  '/models/selfie_segmenter.tflite';

const DEFAULT_WASM_BASE =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';

export class VirtualBackgroundProcessor {
  private segmenter: ImageSegmenter | null = null;
  private initPromise: Promise<void> | null = null;

  private sourceVideo: HTMLVideoElement | null = null;
  private sourceStream: MediaStream | null = null;

  private outputCanvas: HTMLCanvasElement;
  private outputCtx: CanvasRenderingContext2D;
  private personCanvas: HTMLCanvasElement;
  private personCtx: CanvasRenderingContext2D;
  private maskCanvas: HTMLCanvasElement;
  private maskCtx: CanvasRenderingContext2D;

  private rafId: number | null = null;
  private lastVideoTime = -1;
  private running = false;

  private mode: VirtualBackgroundMode;
  private blurAmount: number;
  private backgroundImage: HTMLImageElement | ImageBitmap | null;
  private modelAssetPath: string;
  private wasmBasePath: string;
  private frameRate: number;

  private outputStream: MediaStream | null = null;

  constructor(options: Partial<VirtualBackgroundOptions> = {}) {
    this.mode = options.mode ?? 'none';
    this.blurAmount = options.blurAmount ?? 12;
    this.backgroundImage = options.backgroundImage ?? null;
    this.modelAssetPath = options.modelAssetPath ?? DEFAULT_MODEL;
    this.wasmBasePath = options.wasmBasePath ?? DEFAULT_WASM_BASE;
    this.frameRate = options.frameRate ?? 30;

    this.outputCanvas = document.createElement('canvas');
    this.outputCtx = this.outputCanvas.getContext('2d')!;
    this.personCanvas = document.createElement('canvas');
    this.personCtx = this.personCanvas.getContext('2d', { willReadFrequently: true })!;
    this.maskCanvas = document.createElement('canvas');
    this.maskCtx = this.maskCanvas.getContext('2d', { willReadFrequently: true })!;
  }

  private async ensureInit() {
    if (this.segmenter) return;
    if (!this.initPromise) {
      this.initPromise = (async () => {
        const fileset = await FilesetResolver.forVisionTasks(this.wasmBasePath);
        try {
          this.segmenter = await ImageSegmenter.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: this.modelAssetPath, delegate: 'GPU' },
            runningMode: 'VIDEO',
            outputConfidenceMasks: true,
          });
        } catch (e) {
          console.warn('GPU delegate gagal, fallback ke CPU:', e);
          this.segmenter = await ImageSegmenter.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: this.modelAssetPath, delegate: 'CPU' },
            runningMode: 'VIDEO',
            outputConfidenceMasks: true,
          });
        }
      })();
    }
    await this.initPromise;
  }

  async start(stream: MediaStream, options?: Partial<VirtualBackgroundOptions>): Promise<MediaStream> {
    await this.ensureInit();

    if (options?.mode) this.mode = options.mode;
    if (options?.blurAmount !== undefined) this.blurAmount = options.blurAmount;
    if (options?.backgroundImage !== undefined) this.backgroundImage = options.backgroundImage;

    this.stopLoop();

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) throw new Error('VirtualBackgroundProcessor: source stream tidak punya video track');

    this.sourceStream = stream;

    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.srcObject = new MediaStream([videoTrack]);
    await video.play();
    this.sourceVideo = video;

    const settings = videoTrack.getSettings();
    const width = settings.width ?? video.videoWidth ?? 1280;
    const height = settings.height ?? video.videoHeight ?? 720;
    [this.outputCanvas, this.personCanvas, this.maskCanvas].forEach((c) => {
      c.width = width;
      c.height = height;
    });

    this.running = true;
    this.renderLoop();

    const canvasStream = this.outputCanvas.captureStream(this.frameRate);
    stream.getAudioTracks().forEach((t) => canvasStream.addTrack(t));

    this.outputStream = canvasStream;
    return canvasStream;
  }

  setMode(mode: VirtualBackgroundMode) {
    this.mode = mode;
  }

  setBlurAmount(px: number) {
    this.blurAmount = px;
  }

  async setBackgroundImage(src: string | HTMLImageElement | ImageBitmap) {
    if (typeof src === 'string') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = src;
      await img.decode();
      this.backgroundImage = img;
    } else {
      this.backgroundImage = src;
    }
  }

  getOutputVideoTrack(): MediaStreamTrack | null {
    return this.outputStream?.getVideoTracks()[0] ?? null;
  }

  private renderLoop = () => {
    if (!this.running || !this.sourceVideo || !this.segmenter) return;
    const video = this.sourceVideo;

    if (video.readyState >= 2 && video.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = video.currentTime;
      const timestampMs = performance.now();

      if (this.mode === 'none') {
        this.outputCtx.drawImage(video, 0, 0, this.outputCanvas.width, this.outputCanvas.height);
      } else {
        try {
          this.segmenter.segmentForVideo(video, timestampMs, (result) => {
            this.drawComposite(video, result);
          });
        } catch (e) {
          console.error('segmentForVideo error:', e);
          this.outputCtx.drawImage(video, 0, 0, this.outputCanvas.width, this.outputCanvas.height);
        }
      }
    }

    this.rafId = requestAnimationFrame(this.renderLoop);
  };

  private drawComposite(video: HTMLVideoElement, result: ImageSegmenterResult) {
    const w = this.outputCanvas.width;
    const h = this.outputCanvas.height;
    const confidenceMask = result.confidenceMasks?.[0];
    if (!confidenceMask) {
      this.outputCtx.drawImage(video, 0, 0, w, h);
      return;
    }

    const maskData = confidenceMask.getAsFloat32Array();
    const maskW = confidenceMask.width;
    const maskH = confidenceMask.height;

    const maskImageData = this.maskCtx.createImageData(maskW, maskH);
    for (let i = 0; i < maskData.length; i++) {
      const o = i * 4;
      maskImageData.data[o] = 255;
      maskImageData.data[o + 1] = 255;
      maskImageData.data[o + 2] = 255;
      maskImageData.data[o + 3] = Math.round(maskData[i] * 255);
    }

    const smallMaskCanvas = document.createElement('canvas');
    smallMaskCanvas.width = maskW;
    smallMaskCanvas.height = maskH;
    smallMaskCanvas.getContext('2d')!.putImageData(maskImageData, 0, 0);

    this.maskCtx.clearRect(0, 0, w, h);
    this.maskCtx.drawImage(smallMaskCanvas, 0, 0, w, h);

    this.personCtx.clearRect(0, 0, w, h);
    this.personCtx.drawImage(video, 0, 0, w, h);
    this.personCtx.globalCompositeOperation = 'destination-in';
    this.personCtx.drawImage(this.maskCanvas, 0, 0);
    this.personCtx.globalCompositeOperation = 'source-over';

    this.outputCtx.clearRect(0, 0, w, h);
    if (this.mode === 'image' && this.backgroundImage) {
      this.outputCtx.drawImage(this.backgroundImage as CanvasImageSource, 0, 0, w, h);
    } else {
      this.outputCtx.save();
      this.outputCtx.filter = `blur(${this.blurAmount}px)`;
      this.outputCtx.drawImage(video, 0, 0, w, h);
      this.outputCtx.restore();
    }

    this.outputCtx.drawImage(this.personCanvas, 0, 0);

    confidenceMask.close?.();
  }

  private stopLoop() {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  stop() {
    this.stopLoop();
    if (this.outputStream) {
      this.outputStream.getVideoTracks().forEach((t) => t.stop());
      this.outputStream = null;
    }
    if (this.sourceVideo) {
      this.sourceVideo.pause();
      this.sourceVideo.srcObject = null;
      this.sourceVideo = null;
    }
    this.sourceStream = null;
    this.lastVideoTime = -1;
  }

  destroy() {
    this.stop();
    this.segmenter?.close();
    this.segmenter = null;
    this.initPromise = null;
  }
}

export default VirtualBackgroundProcessor;