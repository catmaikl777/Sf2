/**
 * Replay playback and integrity helpers. Playback rebuilds a fresh simulation
 * from the header and feeds the recorded frames, producing the exact same
 * event stream the original match produced.
 *
 * @module shared/replay/playback
 */

import { createSim } from '../sim/sim.js';

/**
 * A compact, deterministic fingerprint of the final match state. Two identical
 * replays must produce the same signature; any divergence shows up here.
 * @param {import('../sim/sim.js').Sim} sim
 * @returns {string}
 */
export function replaySignature(sim) {
  return [sim.tick, sim.p0.x, sim.p0.y, sim.p0.hp, sim.p1.x, sim.p1.y, sim.p1.hp, sim.round.p0Rounds, sim.round.p1Rounds].join(':');
}

/**
 * Replay an entire match.
 * @param {import('./types.js').Replay} replay
 * @param {import('../config/types.js').GameConfig} cfg
 * @returns {{ sim: import('../sim/sim.js').Sim, events: import('../sim/sim.js').SimEvent[], signature: string }}
 */
export function playReplay(replay, cfg) {
  const sim = createSim(cfg, replay.header.setup);
  /** @type {import('../sim/sim.js').SimEvent[]} */
  const events = [];
  for (const frame of replay.frames) {
    events.push(...sim.step({ buttons: frame.p0 }, { buttons: frame.p1 }));
  }
  return { sim, events, signature: replaySignature(sim) };
}
