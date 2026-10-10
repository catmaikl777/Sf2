/**
 * Global simulation constants. The simulation runs on a fixed 60 Hz tick and
 * uses Q16.16 fixed-point integers for all positions, velocities and damage
 * math. No IEEE floating point values take part in combat state transitions.
 *
 * @module shared/constants
 */

/** Simulation ticks per second. */
export const TICKS_PER_SECOND = 60;

/** Milliseconds per simulation tick (1000 / 60, exact rational stored as int microseconds). */
export const TICK_US = 1000000 / TICKS_PER_SECOND;

/** Fixed-point scale: 1.0 === 65536. Q16.16 format. */
export const FP_SCALE = 65536;

/** Shift count for Q16.16. */
export const FP_SHIFT = 16;

/** Convert an integer count of world pixels to fixed point. */
export const PX = (/** @type {number} */ n) => (n * FP_SCALE) | 0;

/** Screen/canvas design width in pixels. */
export const VIEW_WIDTH = 1280;

/** Screen/canvas design height in pixels. */
export const VIEW_HEIGHT = 720;

/** Ground Y in world pixels (y grows downward, origin top-left of stage). */
export const GROUND_Y = 620;

/** Left wall of the stage in world pixels. */
export const STAGE_LEFT = 40;

/** Right wall of the stage in world pixels. */
export const STAGE_RIGHT = 1240;

/** Maximum number of ticks a single simulation run may execute (safety cap: 1 hour). */
export const MAX_TICKS_PER_RUN = 60 * 60 * TICKS_PER_SECOND;

/** Input buttons bit mask. */
export const BTN = Object.freeze({
  NONE: 0,
  LEFT: 1 << 0,
  RIGHT: 1 << 1,
  UP: 1 << 2,
  DOWN: 1 << 3,
  HAND: 1 << 4,
  FOOT: 1 << 5,
  BLOCK: 1 << 6,
  JUMP: 1 << 7,
  DASH: 1 << 8,
  THROW: 1 << 9,
  SUPER: 1 << 10,
});

/** 8-way direction helper: returns bitmask of horizontal+vertical parts. */
export const DIR = Object.freeze({
  NEUTRAL: 0,
  FORWARD: BTN.RIGHT,
  BACK: BTN.LEFT,
  UP: BTN.UP,
  DOWN: BTN.DOWN,
});
