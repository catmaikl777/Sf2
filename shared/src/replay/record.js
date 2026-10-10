/**
 * Replay recording. A recorder simply appends input frames; `build` seals them
 * into a Replay with a header. `buildReplay` runs a whole match from two input
 * controllers (humans or bots) and captures it in one call.
 *
 * @module shared/replay/record
 */

import { createSim } from '../sim/sim.js';
import { observe } from '../ai/observe.js';
import { REPLAY_VERSION } from './types.js';

/**
 * Metadata that is not derivable from the simulated inputs.
 *
 * @typedef {Object} RecordMeta
 * @property {number} [createdAt]
 * @property {string} [stageId]
 * @property {'player'|'bot'} [p0Control]
 * @property {'player'|'bot'} [p1Control]
 * @property {import('../config/types.js').Difficulty} [p0Difficulty]
 * @property {import('../config/types.js').Difficulty} [p1Difficulty]
 * @property {number} [p0Seed]
 * @property {number} [p1Seed]
 * @property {0|1|null} [winner]
 */

/**
 * Build a replay header with sensible defaults.
 * @param {import('../sim/sim.js').SimSetup} setup
 * @param {string} stageId
 * @param {RecordMeta} meta
 * @param {number} frameCount
 * @returns {import('./types.js').ReplayHeader}
 */
export function createReplayHeader(setup, stageId, meta = {}, frameCount = 0) {
  return {
    version: REPLAY_VERSION,
    createdAt: meta.createdAt ?? 0,
    stageId,
    setup,
    p0Control: meta.p0Control ?? 'player',
    p1Control: meta.p1Control ?? 'bot',
    p0Difficulty: meta.p0Difficulty ?? null,
    p1Difficulty: meta.p1Difficulty ?? null,
    p0Seed: meta.p0Seed ?? null,
    p1Seed: meta.p1Seed ?? null,
    winner: meta.winner ?? null,
    frameCount,
  };
}

/**
 * Collect input frames for one match in progress.
 * @param {import('../sim/sim.js').SimSetup} setup
 * @param {string} stageId
 * @returns {{ record: (p0: {buttons:number}, p1: {buttons:number}) => void, build: (meta?: RecordMeta) => import('./types.js').Replay, readonly frameCount: number }}
 */
export function createMatchRecorder(setup, stageId) {
  /** @type {import('./types.js').ReplayFrame[]} */
  const frames = [];
  return {
    record(p0, p1) {
      frames.push({ p0: p0.buttons, p1: p1.buttons });
    },
    build(meta = {}) {
      return { header: createReplayHeader(setup, stageId, meta, frames.length), frames: frames.slice() };
    },
    get frameCount() {
      return frames.length;
    },
  };
}

/**
 * @callback ReplayController
 * @param {import('../ai/types.js').WorldView} view
 * @param {import('../sim/sim.js').Sim} sim
 * @returns {number} raw button mask
 */

/**
 * Simulate a full match from two controllers and capture it as a replay.
 * Stops early once a match winner is decided or maxTicks is reached.
 *
 * @param {import('../config/types.js').GameConfig} cfg
 * @param {import('../sim/sim.js').SimSetup} setup
 * @param {{ p0: ReplayController, p1: ReplayController, maxTicks?: number, stageId?: string } & RecordMeta} opts
 * @returns {{ replay: import('./types.js').Replay, sim: import('../sim/sim.js').Sim }}
 */
export function buildReplay(cfg, setup, opts) {
  const stageId = opts.stageId ?? (cfg.stages[0] ? cfg.stages[0].id : '');
  const sim = createSim(cfg, setup);
  const maxTicks = opts.maxTicks ?? 60 * 60 * 3;
  const recorder = createMatchRecorder(setup, stageId);
  for (let i = 0; i < maxTicks; i++) {
    if (sim.round.matchWinner !== null) break;
    const b0 = opts.p0(observe(sim, 0), sim);
    const b1 = opts.p1(observe(sim, 1), sim);
    recorder.record({ buttons: b0 }, { buttons: b1 });
    sim.step({ buttons: b0 }, { buttons: b1 });
  }
  /** @type {RecordMeta} */
  const meta = { ...opts };
  const mw = sim.round.matchWinner;
  meta.winner = mw === 0 || mw === 1 ? mw : null;
  return { replay: recorder.build(meta), sim };
}
