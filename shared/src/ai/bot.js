/**
 * Deterministic bot. It consumes a WorldView every tick, perceives it with a
 * reaction delay, decides on a fixed cadence, then routes the chosen intent
 * through an input-latency delay line before emitting a raw button mask.
 *
 * @module shared/ai/bot
 */

import { TICKS_PER_SECOND } from '../constants.js';
import { createRng } from '../rng.js';
import { getAiConfig } from '../config/ai.js';
import { msToTicks } from '../sim/timing.js';
import { createPerception } from './perception.js';
import { createFsm } from './fsm.js';
import { choose, idleAction } from './utility.js';
import { selector, guard, action } from './behaviortree.js';

/**
 * @typedef {Object} Commitment
 * @property {number[]|null} frames
 * @property {number} buttons
 * @property {number} ticksLeft
 * @property {number} frameIdx
 */

/**
 * The bot's decision ladder. A busy (stunned) fighter does nothing; otherwise
 * the utility scorer picks the best intent for the current phase.
 *
 * @param {import('./types.js').BotContext} ctx
 * @returns {import('./types.js').Action}
 */
const tree = selector(
  guard(
    (ctx) =>
      ctx.self.state === 'hitstun' ||
      ctx.self.state === 'blockstun' ||
      ctx.self.state === 'knockdown' ||
      ctx.self.state === 'dead',
    () => idleAction(),
  ),
  action((ctx) => choose(ctx)),
);

/**
 * Create a bot for one side.
 * @param {import('../config/types.js').GameConfig} cfg
 * @param {import('./types.js').BotOptions} options
 * @returns {import('./types.js').Bot}
 */
export function createBot(cfg, options) {
  const ai = getAiConfig(options.difficulty);
  const seed = (options.seed ^ ai.rngSeed) >>> 0;
  const weapon = cfg.weapons.find((w) => w.id === options.weaponId);
  const rangePx = weapon ? weapon.rangePx : 60;

  const latencyTicks = msToTicks(ai.inputLatencyMs);
  const jitterTicks = msToTicks(ai.inputJitterMs);
  const baseInterval = Math.max(1, Math.round(TICKS_PER_SECOND / ai.decisionsPerSecond));

  /** @type {import('../rng.js').Rng} */
  let rng = createRng(seed === 0 ? 1 : seed);
  /** @type {ReturnType<typeof createPerception>} */
  let perception = createPerception(ai, rng);
  const fsm = createFsm();

  /** @type {number[]} */
  let line = [];
  /** @type {number} */
  let nextDecision = 0;
  /** @type {Commitment|null} */
  let committed = null;
  /** @type {string} */
  let phase = 'neutral';

  /**
   * Decide and commit a new intent for this tick.
   * @param {import('./types.js').WorldView} view
   * @param {import('./types.js').WorldView} sensed
   */
  const decide = (view, sensed) => {
    nextDecision = view.tick + baseInterval + (jitterTicks > 0 ? rng.int(-jitterTicks, jitterTicks) : 0);
    if (nextDecision <= view.tick) nextDecision = view.tick + 1;
    /** @type {import('./types.js').BotContext} */
    const ctx = {
      ai,
      self: sensed.self,
      opp: sensed.opp,
      distance: sensed.distance,
      rangePx,
      facing: view.self.facing,
      tick: view.tick,
      phase: 'neutral',
    };
    phase = fsm.update(ctx);
    ctx.phase = phase;
    const chosen = tree(ctx) ?? idleAction();
    committed = { frames: chosen.script, buttons: chosen.buttons, ticksLeft: chosen.pulse ? 1 : chosen.holdTicks, frameIdx: 0 };
  };

  /** @returns {number} */
  const desiredButtons = () => {
    if (committed === null) return 0;
    if (committed.frames !== null) {
      const frames = committed.frames;
      const out = frames[committed.frameIdx] ?? 0;
      committed.frameIdx++;
      if (committed.frameIdx >= frames.length) committed = null;
      return out;
    }
    const out = committed.buttons;
    committed.ticksLeft--;
    if (committed.ticksLeft <= 0) committed = null;
    return out;
  };

  /** @param {number} desired @returns {number} */
  const delay = (desired) => {
    if (latencyTicks === 0) return desired;
    line.push(desired);
    if (line.length > latencyTicks) return line.shift() ?? 0;
    return 0;
  };

  /** @param {import('./types.js').WorldView} view @returns {{ buttons: number }} */
  const step = (view) => {
    perception.observe(view);
    const sensed = perception.sense(view.tick);
    if (sensed !== null && view.tick >= nextDecision) decide(view, sensed);
    return { buttons: delay(desiredButtons()) };
  };

  const reset = () => {
    rng = createRng(seed === 0 ? 1 : seed);
    perception = createPerception(ai, rng);
    line = [];
    nextDecision = 0;
    committed = null;
    phase = 'neutral';
  };

  return {
    step,
    reset,
    get phase() {
      return phase;
    },
  };
}
