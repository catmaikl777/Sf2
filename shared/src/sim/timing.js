/**
 * Deterministic time conversion. The simulation ticks at exactly 60 Hz; all
 * millisecond durations in the config are translated to integer tick counts
 * once, before the hot loop starts. Every offset uses the same rounding rule
 * so windows and phases stay consistent.
 *
 * @module shared/sim/timing
 */

import { TICKS_PER_SECOND, FP_SCALE } from '../constants.js';

/** Convert milliseconds to ticks, rounding up so short windows exist. */
export function msToTicks(/** @type {number} */ ms) {
  return Math.ceil((ms * TICKS_PER_SECOND) / 1000);
}

/**
 * Precompute the integer tick timeline of one move.
 * @param {import('../config/types.js').MoveConfig} move
 * @returns {import('./types.js').MoveTiming}
 */
export function precomputeMove(move) {
  const startupTicks = Math.max(0, msToTicks(move.startupMs));
  const activeTicks = Math.max(1, msToTicks(move.activeMs));
  const recoveryTicks = Math.max(0, msToTicks(move.recoveryMs));
  const startActiveTick = startupTicks;
  const startRecoveryTick = startupTicks + activeTicks;
  const totalTicks = startRecoveryTick + recoveryTicks;
  const cancelStartTick = startRecoveryTick + msToTicks(move.cancelWindowStartMs);
  const cancelEndTick =
    move.cancelWindowEndMs > 0
      ? startRecoveryTick + msToTicks(move.cancelWindowEndMs)
      : totalTicks;

  const hitboxes = move.hitboxes.map((h) => ({
    startTick: msToTicks(h.startMs),
    endTick: msToTicks(h.endMs),
    window: h,
    consumed: false,
  }));

  return {
    move,
    startupTicks,
    activeTicks,
    recoveryTicks,
    totalTicks,
    startActiveTick,
    startRecoveryTick,
    cancelStartTick,
    cancelEndTick,
    advance: move.advance,
    hitboxes,
  };
}

/**
 * Convert a fixed-point fraction of seconds into ticks (used for AI decision
 * gating, where the value already is integer seconds * FP_SCALE).
 * @param {number} fpSeconds Q16.16 seconds
 * @param {number} denominator  e.g. decisionsPerSecond as a plain count
 * @returns {number}
 */
export function fpSecondsToTicks(fpSeconds, denominator) {
  return Math.max(1, Math.floor(((fpSeconds / FP_SCALE) * TICKS_PER_SECOND) / denominator));
}