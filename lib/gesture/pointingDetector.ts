import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import {
  POINT_AXIS_DOMINANCE_RATIO,
  POINT_COOLDOWN_MS,
  POINT_FINGER_EXTENSION_RATIO,
  POINT_HOLD_FRAMES,
  POINT_MIN_HORIZONTAL_NORM,
} from "./constants";

const WRIST = 0;
const INDEX_PIP = 6;
const INDEX_MCP = 5;
const INDEX_TIP = 8;
const MIDDLE_PIP = 10;
const MIDDLE_TIP = 12;
const RING_PIP = 14;
const RING_TIP = 16;
const PINKY_PIP = 18;
const PINKY_TIP = 20;

type Direction = "Left" | "Right" | "None";

export type PointingEvent =
  | { type: "next" }
  | { type: "previous" }
  | { type: "pointer-move"; xNorm: number; yNorm: number }
  | { type: "pointer-hide" };

function dist(a: NormalizedLandmark, b: NormalizedLandmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Rotation-invariant "is this finger straight" check: a curled finger's tip
 * sits close to the wrist (near the pip joint's distance); an extended one's
 * tip sits well past it. Works regardless of how the hand is rotated. */
function isExtended(landmarks: NormalizedLandmark[], wrist: NormalizedLandmark, pip: number, tip: number): boolean {
  return dist(wrist, landmarks[tip]) > dist(wrist, landmarks[pip]) * POINT_FINGER_EXTENSION_RATIO;
}

/** True for the base "pointing" hand shape (only the index finger extended),
 * independent of which way it's aimed — distinguishes a deliberate point from
 * an open palm or other canned gesture pose. */
function isIndexOnlyExtended(landmarks: NormalizedLandmark[]): boolean {
  const wrist = landmarks[WRIST];
  const indexExtended = isExtended(landmarks, wrist, INDEX_PIP, INDEX_TIP);
  const middleExtended = isExtended(landmarks, wrist, MIDDLE_PIP, MIDDLE_TIP);
  const ringExtended = isExtended(landmarks, wrist, RING_PIP, RING_TIP);
  const pinkyExtended = isExtended(landmarks, wrist, PINKY_PIP, PINKY_TIP);
  return indexExtended && !middleExtended && !ringExtended && !pinkyExtended;
}

/** Classifies a horizontally-dominant index-finger aim as a deliberate
 * left/right swipe. Any other aim (vertical, diagonal, or not horizontal
 * enough) returns "None" — the caller treats that as "aiming at the slide"
 * rather than swiping. */
function classifyDirection(landmarks: NormalizedLandmark[], mirrored: boolean): Direction {
  const dx = landmarks[INDEX_TIP].x - landmarks[INDEX_MCP].x;
  const dy = landmarks[INDEX_TIP].y - landmarks[INDEX_MCP].y;
  if (Math.abs(dx) < POINT_MIN_HORIZONTAL_NORM || Math.abs(dx) < Math.abs(dy) * POINT_AXIS_DOMINANCE_RATIO) {
    return "None";
  }

  const horizontal = mirrored ? -dx : dx;
  return horizontal > 0 ? "Right" : "Left";
}

/**
 * Reads the single "index finger extended, others curled" pose two ways:
 * a horizontally-aimed point is a deliberate swipe (edge-triggered "next"/
 * "previous", stabilized over POINT_HOLD_FRAMES with a cooldown, same as
 * before). Any other aim is "aiming at the slide" — reports the fingertip
 * position as a laser-pointer target every qualifying frame (no cooldown,
 * needs to track live). Losing the point pose, or losing the hand entirely,
 * fires a single edge-triggered "pointer-hide".
 */
export class PointingDetector {
  private currentDirection: Direction = "None";
  private streak = 0;
  private stableDirection: Direction = "None";
  private cooldownUntil = 0;
  private aiming = false;

  constructor(private readonly mirrored: boolean = true) {}

  addSample(landmarks: NormalizedLandmark[], timestampMs: number): PointingEvent | null {
    if (!isIndexOnlyExtended(landmarks)) return this.hide();

    const direction = classifyDirection(landmarks, this.mirrored);
    if (direction === "None") return this.aim(landmarks);

    const hideEvent = this.aiming ? ({ type: "pointer-hide" } as const) : null;
    this.aiming = false;
    return this.classifyNav(direction, timestampMs) ?? hideEvent;
  }

  /** Call when MediaPipe reports no hand at all this frame. */
  noHand(): PointingEvent | null {
    return this.hide();
  }

  private aim(landmarks: NormalizedLandmark[]): PointingEvent {
    this.currentDirection = "None";
    this.streak = 0;
    this.stableDirection = "None";
    this.aiming = true;
    const tip = landmarks[INDEX_TIP];
    const xNorm = this.mirrored ? 1 - tip.x : tip.x;
    return { type: "pointer-move", xNorm: Math.min(1, Math.max(0, xNorm)), yNorm: Math.min(1, Math.max(0, tip.y)) };
  }

  private classifyNav(direction: "Left" | "Right", timestampMs: number): PointingEvent | null {
    if (direction === this.currentDirection) {
      this.streak += 1;
    } else {
      this.currentDirection = direction;
      this.streak = 1;
    }

    if (this.streak < POINT_HOLD_FRAMES || direction === this.stableDirection) return null;
    if (timestampMs < this.cooldownUntil) return null;

    this.stableDirection = direction;
    this.cooldownUntil = timestampMs + POINT_COOLDOWN_MS;
    return direction === "Right" ? { type: "next" } : { type: "previous" };
  }

  private hide(): PointingEvent | null {
    this.currentDirection = "None";
    this.streak = 0;
    this.stableDirection = "None";
    if (!this.aiming) return null;
    this.aiming = false;
    return { type: "pointer-hide" };
  }

  reset(): void {
    this.currentDirection = "None";
    this.streak = 0;
    this.stableDirection = "None";
    this.cooldownUntil = 0;
    this.aiming = false;
  }
}
