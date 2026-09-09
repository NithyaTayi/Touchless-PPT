export type GestureEvent =
  | { type: "next" }
  | { type: "previous" }
  | { type: "jump-first" }
  | { type: "jump-last" }
  | { type: "presentation-enter" }
  | { type: "presentation-exit" }
  | { type: "laser-toggle" }
  | { type: "blackout-toggle" }
  | { type: "pointer-move"; xNorm: number; yNorm: number }
  | { type: "pointer-hide" };

export interface GestureController {
  start(videoEl: HTMLVideoElement): Promise<void>;
  stop(): void;
  onEvent(listener: (e: GestureEvent) => void): () => void;
}
