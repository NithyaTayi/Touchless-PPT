import { GestureRecognizer, FilesetResolver, type GestureRecognizerResult } from "@mediapipe/tasks-vision";
import { MODEL_ASSET_PATH, WASM_ASSET_PATH } from "./constants";
import { CrossedFingersDetector } from "./crossedFingersDetector";
import { PointingDetector } from "./pointingDetector";
import { StaticGestureDetector } from "./staticGestureDetector";
import type { GestureController as IGestureController, GestureEvent } from "./types";

export class GestureController implements IGestureController {
  private recognizer: GestureRecognizer | null = null;
  private videoEl: HTMLVideoElement | null = null;
  private rafId: number | null = null;
  private lastTimestampMs = -1;
  private listeners = new Set<(e: GestureEvent) => void>();
  private pointingDetector = new PointingDetector(true);
  private staticGestureDetector = new StaticGestureDetector();
  private crossedFingersDetector = new CrossedFingersDetector();

  async start(videoEl: HTMLVideoElement): Promise<void> {
    if (!this.recognizer) {
      // MediaPipe's WASM runtime logs benign init notices (e.g. the XNNPACK
      // delegate notice) via console.error, which trips Next.js's error
      // overlay even though nothing failed. Silence just that during init.
      const originalConsoleError = console.error;
      console.error = (...args: unknown[]) => {
        if (typeof args[0] === "string" && args[0].includes("XNNPACK")) return;
        originalConsoleError(...args);
      };
      try {
        const wasmFileset = await FilesetResolver.forVisionTasks(WASM_ASSET_PATH);
        this.recognizer = await GestureRecognizer.createFromOptions(wasmFileset, {
          baseOptions: { modelAssetPath: MODEL_ASSET_PATH, delegate: "CPU" },
          runningMode: "VIDEO",
          numHands: 1,
        });
      } finally {
        console.error = originalConsoleError;
      }
    }
    this.videoEl = videoEl;
    this.pointingDetector.reset();
    this.staticGestureDetector.reset();
    this.crossedFingersDetector.reset();
    this.loop();
  }

  stop(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.videoEl = null;
    this.recognizer?.close();
    this.recognizer = null;
  }

  onEvent(listener: (e: GestureEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private loop = (): void => {
    if (!this.videoEl || !this.recognizer) return;

    if (this.videoEl.readyState >= 2) {
      const timestampMs = Math.max(performance.now(), this.lastTimestampMs + 1);
      this.lastTimestampMs = timestampMs;
      const result = this.recognizer.recognizeForVideo(this.videoEl, timestampMs);
      this.processResult(result, timestampMs);
    }

    this.rafId = requestAnimationFrame(this.loop);
  };

  private processResult(result: GestureRecognizerResult, timestampMs: number): void {
    const landmarks = result.landmarks[0];
    const pointingEvent = landmarks
      ? this.pointingDetector.addSample(landmarks, timestampMs)
      : this.pointingDetector.noHand();
    if (pointingEvent) {
      if (process.env.NODE_ENV !== "production" && (pointingEvent.type === "next" || pointingEvent.type === "previous")) {
        console.debug(`[gesture-debug] detector fired: ${pointingEvent.type} @ ${Math.round(timestampMs)}ms`);
      }
      this.emit(pointingEvent);
    }

    if (landmarks && this.crossedFingersDetector.addSample(landmarks, timestampMs)) {
      this.emit({ type: "laser-toggle" });
    }

    const topGesture = result.gestures[0]?.[0];
    const staticEvent = this.staticGestureDetector.addSample(
      topGesture?.categoryName ?? "None",
      topGesture?.score ?? 0,
      timestampMs,
    );
    if (staticEvent) this.emit({ type: staticEvent });
  }

  private emit(event: GestureEvent): void {
    this.listeners.forEach((l) => l(event));
  }
}
