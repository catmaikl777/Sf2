/**
 * Cached move timing. Precomputing once per move id means the hot loop never
 * re-runs ms->tick conversion.
 *
 * @module shared/sim/movetiming
 */

import { precomputeMove } from './timing.js';

/** @type {Map<string, import('./types.js').MoveTiming>} */
const cache = new Map();

/**
 * Get the precomputed timing for a move id.
 * @param {import('../config/types.js').MoveConfig} move
 * @returns {import('./types.js').MoveTiming}
 */
export function getMoveTiming(move) {
  let t = cache.get(move.id);
  if (!t) {
    t = precomputeMove(move);
    cache.set(move.id, t);
  }
  return t;
}

/** Clear the cache (used by tests). */
export function clearTimingCache() {
  cache.clear();
}