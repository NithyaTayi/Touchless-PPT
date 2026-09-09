export const MODEL_ASSET_PATH = "/models/gesture_recognizer.task";
export const WASM_ASSET_PATH = "/wasm";

// Pointing-direction detection (landmark-geometry based, not a canned MediaPipe
// category — works for either hand and is rotation/handedness independent).
export const POINT_FINGER_EXTENSION_RATIO = 1.15; // tip-to-wrist vs pip-to-wrist distance to count a finger "extended"
export const POINT_MIN_HORIZONTAL_NORM = 0.12; // min horizontal index-finger-vector length (fraction of frame width)
export const POINT_AXIS_DOMINANCE_RATIO = 1.2; // horizontal component must exceed vertical by this factor
export const POINT_HOLD_FRAMES = 5; // consecutive frames a direction must win before it's "stable"
export const POINT_COOLDOWN_MS = 900;

// Static gesture detection (MediaPipe's canned categories: Thumb_Up, Thumb_Down,
// Closed_Fist, Open_Palm, ...). Edge-triggered off a stabilized category, not fired
// every frame a pose is held.
export const GESTURE_CONFIDENCE_THRESHOLD = 0.65;
export const GESTURE_HOLD_FRAMES = 5; // consecutive frames a category must win before it's "stable"
export const GESTURE_COOLDOWN_MS = 1200;

// Crossed-fingers laser-pointer toggle (custom landmark geometry — not one of
// MediaPipe's canned categories).
export const CROSS_TIP_GAP_RATIO = 0.6; // index/middle tip distance vs knuckle distance; crossing pulls tips close together
export const CROSS_HOLD_FRAMES = 5;
export const CROSS_COOLDOWN_MS = 1200;
