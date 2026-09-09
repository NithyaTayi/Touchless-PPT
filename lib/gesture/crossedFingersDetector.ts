import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { CROSS_COOLDOWN_MS, CROSS_HOLD_FRAMES, CROSS_TIP_GAP_RATIO, POINT_FINGER_EXTENSION_RATIO } from "./constants";

const WRIST = 0;
const INDEX_MCP = 5;
const INDEX_PIP = 6;
const INDEX_TIP = 8;
const MIDDLE_MCP = 9;
const MIDDLE_PIP = 10;
const MIDDLE_TIP = 12;

function dist(a: NormalizedLandmark, b: NormalizedLandmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function isExtended(landmarks: NormalizedLandmark[], wrist: NormalizedLandmark, pip: number, tip: number): boolean {
  return dist(wrist, landmarks[tip]) > dist(wrist, landmarks[pip]) * POINT_FINGER_EXTENSION_RATIO;
}

/** Index and middle fingers both extended, but with their tip left-right
 * order flipped relative to their knuckle order and pulled close together —
 * the "fingers crossed" pose. Distinct from a spread peace sign (MediaPipe's
 * canned Victory category), which keeps knuckle and tip order the same. */
function isFingersCrossed(landmarks: NormalizedLandmark[]): boolean {
  const wrist = landmarks[WRIST];
  if (!isExtended(landmarks, wrist, INDEX_PIP, INDEX_TIP) || !isExtended(landmarks, wrist, MIDDLE_PIP, MIDDLE_TIP)) {
    return false;
  }

  const knuckleOrder = landmarks[INDEX_MCP].x - landmarks[MIDDLE_MCP].x;
  const tipOrder = landmarks[INDEX_TIP].x - landmarks[MIDDLE_TIP].x;
  if (knuckleOrder === 0 || Math.sign(knuckleOrder) === Math.sign(tipOrder)) return false;

  const tipGap = dist(landmarks[INDEX_TIP], landmarks[MIDDLE_TIP]);
  const knuckleGap = dist(landmarks[INDEX_MCP], landmarks[MIDDLE_MCP]);
  return tipGap < knuckleGap * CROSS_TIP_GAP_RATIO;
}

/** Fires once when the fingers-crossed pose stabilizes (hold+cooldown edge
 * trigger, same pattern as StaticGestureDetector's single-pose gestures) —
 * used to toggle the laser pointer on/off. Only the transition into
 * "crossed" fires; uncrossing just re-arms the trigger for next time. */
export class CrossedFingersDetector {
  private currentState = false;
  private streak = 0;
  private stableState = false;
  private cooldownUntil = 0;

  addSample(landmarks: NormalizedLandmark[], timestampMs: number): boolean {
    const crossed = isFingersCrossed(landmarks);

    if (crossed === this.currentState) {
      this.streak += 1;
    } else {
      this.currentState = crossed;
      this.streak = 1;
    }

    if (this.streak < CROSS_HOLD_FRAMES || this.currentState === this.stableState) return false;

    if (!crossed) {
      this.stableState = false;
      return false;
    }

    if (timestampMs < this.cooldownUntil) return false;

    this.stableState = true;
    this.cooldownUntil = timestampMs + CROSS_COOLDOWN_MS;
    return true;
  }

  reset(): void {
    this.currentState = false;
    this.streak = 0;
    this.stableState = false;
    this.cooldownUntil = 0;
  }
}
