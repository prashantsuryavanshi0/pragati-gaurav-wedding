// ── FlipBook Tunable Config ──────────────────────────────────────────────────

export const FLIP_DURATION      = 2.6   // seconds — normal page turn
export const FAST_FLIP_DURATION = 0.9   // seconds — navbar sequential jumps

export const MAX_TILT_Z  = 4     // degrees Z-axis lean when corner lifts
export const MAX_TILT_X  = 8     // degrees X-axis tilt (top lifts toward viewer)
export const LIFT_Z      = 60    // px translateZ at peak (50% of turn)
export const PERSPECTIVE = 2200  // px CSS perspective distance
export const CURL_STRENGTH = 0.6 // 0-1 light sweep intensity

/** Main cubic-bezier — starts slow, fast through middle, settles gently */
export const EASE = [0.37, 0, 0.18, 1]

// ── Auto-flip ────────────────────────────────────────────────────────────────

export const AUTO_FLIP          = true   // enable auto-flip by default
export const PAGE_DWELL         = 7      // seconds on most pages before auto-turning
export const COVER_DWELL        = 8      // seconds on the cover page before first flip
export const RESUME_AFTER_IDLE  = 6      // seconds idle before auto-flip resumes

// Per-page dwell overrides (seconds). Missing keys use PAGE_DWELL.
export const PAGE_DWELL_OVERRIDES = {
  1: 8,  // Couple
  2: 8,  // Celebrations
}

// ── Riffle (last-page → cover fan effect) ────────────────────────────────────

export const RIFFLE_DURATION = 1.3                  // seconds per card
export const RIFFLE_STAGGER  = 0.18                 // seconds between card starts
export const RIFFLE_EASE     = [0.37, 0, 0.18, 1]
export const RIFFLE_TILT_Z   = [2, 2.75, 3.5, 4.25, 5]  // per-card rotateZ (deg)

// ── Derived keyframe arrays ──────────────────────────────────────────────────
//   Five stops at 0% / 12% / 50% / 85% / 100% of the flip progress value.
//   The first 15% and last 15% are slow (corner lifting / paper settling).

export const KF_TIMES = [0, 0.12, 0.50, 0.85, 1.00]

// Forward flip: rotateY 0 → -180 (page turns from right to left)
export const KF_ROT_Y_FWD = [
    0,   // flat, front face toward viewer
  -12,   // corner lifts, starts turning
  -90,   // standing perpendicular — edge-on
 -168,   // nearly flat on the far side
 -180,   // settled — back face toward viewer
]

// Backward flip: -180 → 0 (destination page unfolds from left)
export const KF_ROT_Y_BWD = KF_ROT_Y_FWD.map(v => -180 - v)

export const KF_ROT_Z = [
  0,
  -MAX_TILT_Z,
  -MAX_TILT_Z * 0.6,
  -1,
  0,
]

export const KF_ROT_X = [
  0,
  MAX_TILT_X * 0.5,
  MAX_TILT_X,
  2,
  0,
]

export const KF_TRANS_Z = [
  0,
  LIFT_Z * 0.4,
  LIFT_Z,
  LIFT_Z * 0.3,
  0,
]
