import { GESTURE_CONFIDENCE_THRESHOLD, GESTURE_COOLDOWN_MS, GESTURE_HOLD_FRAMES } from "./constants";

type StaticEvent = "jump-first" | "jump-last" | "presentation-enter" | "presentation-exit";

/** MediaPipe's canned gesture categories are noisy frame-to-frame, so a category
 * only counts once it wins GESTURE_HOLD_FRAMES in a row ("stable"). Events fire
 * once on the transition into a new stable category, not every frame it's held,
 * so holding thumbs-up doesn't repeatedly jump to the first slide. Open_Palm and
 * Closed_Fist are level-triggered (enter/exit presentation directly) rather than
 * requiring a specific prior pose, since requiring "fist then palm" is fragile —
 * MediaPipe's confidence often dips to "None" for a few frames mid-transition,
 * which would erase the memory of the prior pose. */
export class StaticGestureDetector {
  private currentCategory = "None";
  private streak = 0;
  private stableCategory = "None";
  private cooldownUntil = 0;

  addSample(categoryName: string, score: number, timestampMs: number): StaticEvent | null {
    const category = score >= GESTURE_CONFIDENCE_THRESHOLD ? categoryName : "None";

    if (category === this.currentCategory) {
      this.streak += 1;
    } else {
      this.currentCategory = category;
      this.streak = 1;
    }

    if (this.streak < GESTURE_HOLD_FRAMES || category === this.stableCategory) return null;

    this.stableCategory = category;

    if (timestampMs < this.cooldownUntil) return null;

    let event: StaticEvent | null = null;
    if (category === "Thumb_Up") event = "jump-first";
    else if (category === "Thumb_Down") event = "jump-last";
    else if (category === "Open_Palm") event = "presentation-enter";
    else if (category === "Closed_Fist") event = "presentation-exit";

    if (event) this.cooldownUntil = timestampMs + GESTURE_COOLDOWN_MS;
    return event;
  }

  reset(): void {
    this.currentCategory = "None";
    this.streak = 0;
    this.stableCategory = "None";
    this.cooldownUntil = 0;
  }
}
