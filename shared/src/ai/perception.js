/**
 * Human-like perception for the bot. Every frame the world is buffered; the bot
 * acts on the snapshot from `reactionDelayMs` ago, with distance error and a
 * chance of misreading the opponent's state. All randomness comes from the
 * injected Rng so a bot with a fixed seed is fully deterministic.
 *
 * @module shared/ai/perception
 */

import { FP_SCALE } from '../constants.js';
import { msToTicks } from '../sim/timing.js';

/** @type {Record<string, import('../config/types.js').FighterState>} */
const MISREAD = {
  idle: 'walk',
  walk: 'idle',
  attack: 'idle',
  block: 'idle',
  crouch: 'idle',
  jump: 'idle',
  hitstun: 'idle',
  blockstun: 'idle',
  knockdown: 'hitstun',
  wakeup: 'idle',
  dash: 'walk',
  throw: 'attack',
  grabbed: 'hitstun',
};

/**
 * @param {import('../config/types.js').AiConfig} ai
 * @param {import('../rng.js').Rng} rng
 * @returns {{ observe: (view: import('./types.js').WorldView) => void, sense: (tick: number) => import('./types.js').WorldView | null }}
 */
export function createPerception(ai, rng) {
  const delayTicks = msToTicks(ai.reactionDelayMs);
  const cap = delayTicks + 4;
  /** @type {import('./types.js').WorldView[]} */
  const buffer = [];

  /** @param {import('./types.js').WorldView} view */
  const observe = (view) => {
    buffer.push(view);
    if (buffer.length > cap) buffer.shift();
  };

  /** @param {import('./types.js').WorldView} view @returns {import('./types.js').WorldView} */
  const applyNoise = (view) => {
    let distance = view.distance;
    if (ai.aimErrorPx > 0) {
      distance = distance + rng.int(-ai.aimErrorPx, ai.aimErrorPx) * FP_SCALE;
    }
    let opp = view.opp;
    if (ai.stateReadErrorChance > 0 && rng.chance(ai.stateReadErrorChance)) {
      const wrong = MISREAD[opp.state];
      if (wrong !== undefined) opp = { ...opp, state: wrong };
    }
    if (distance === view.distance && opp === view.opp) return view;
    return { ...view, distance, opp };
  };

  /** @param {number} tick @returns {import('./types.js').WorldView | null} */
  const sense = (tick) => {
    if (buffer.length === 0) return null;
    const target = tick - delayTicks;
    /** @type {import('./types.js').WorldView | null} */
    let chosen = null;
    for (let i = buffer.length - 1; i >= 0; i--) {
      const v = buffer[i];
      if (v !== undefined && v.tick <= target) {
        chosen = v;
        break;
      }
    }
    if (chosen === null) chosen = buffer[0] ?? null;
    if (chosen === null) return null;
    return applyNoise(chosen);
  };

  return { observe, sense };
}
