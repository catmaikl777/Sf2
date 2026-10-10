/**
 * Utility scorer. Given one decision context it produces a small set of
 * candidate intents and scores each with the difficulty weights. The highest
 * score wins; ties resolve by a fixed candidate order so the outcome is
 * deterministic. No RNG is drawn here — imperfection lives in perception.
 *
 * @module shared/ai/utility
 */

import { BTN, FP_SCALE } from '../constants.js';

/** @param {-1|1} facing @returns {number} */
export function forwardButton(facing) {
  return facing > 0 ? BTN.RIGHT : BTN.LEFT;
}

/** @param {-1|1} facing @returns {number} */
export function backButton(facing) {
  return facing > 0 ? BTN.LEFT : BTN.RIGHT;
}

/**
 * @param {string} name
 * @param {number} buttons
 * @param {boolean} pulse
 * @param {number} holdTicks
 * @param {number[]|null} script
 * @returns {import('./types.js').Action}
 */
export function makeAction(name, buttons, pulse, holdTicks, script = null) {
  return { name, buttons, pulse, holdTicks, script };
}

/** @returns {import('./types.js').Action} */
export function idleAction() {
  return makeAction('idle', BTN.NONE, false, 30, null);
}

/** @param {-1|1} facing @param {boolean} toward @returns {import('./types.js').Action} */
export function moveAction(facing, toward) {
  return makeAction(toward ? 'approach' : 'retreat', toward ? forwardButton(facing) : backButton(facing), false, 30, null);
}

/** @returns {import('./types.js').Action} */
export function blockAction() {
  return makeAction('block', BTN.BLOCK, false, 12, null);
}

/** @returns {import('./types.js').Action} */
export function crouchAction() {
  return makeAction('crouch', BTN.DOWN, false, 12, null);
}

/** @returns {import('./types.js').Action} */
export function jumpAction() {
  return makeAction('jump', BTN.JUMP, true, 1, null);
}

/**
 * Pick a basic strike for the perceived distance.
 * @param {import('./types.js').BotContext} ctx
 * @param {boolean} veryClose
 * @returns {import('./types.js').Action}
 */
export function attackAction(ctx, veryClose) {
  const buttons = veryClose ? BTN.HAND : forwardButton(ctx.facing) | BTN.HAND;
  return makeAction('attack', buttons, true, 1, null);
}

/**
 * Three-press super combo: forward+hand, forward+foot, forward+hand.
 * @param {-1|1} facing
 * @returns {import('./types.js').Action}
 */
export function superAction(facing) {
  const fwd = forwardButton(facing);
  return makeAction('super', BTN.NONE, false, 0, [fwd | BTN.HAND, 0, fwd | BTN.FOOT, 0, fwd | BTN.HAND, 0]);
}

/**
 * Score every candidate intent for this decision.
 * @param {import('./types.js').BotContext} ctx
 * @returns {{ action: import('./types.js').Action, score: number }[]}
 */
export function evaluate(ctx) {
  const ai = ctx.ai;
  const dist = Math.abs(ctx.distance) / FP_SCALE;
  const range = Math.max(1, ctx.rangePx);
  const ratio = dist / range;
  const inRange = dist <= range;
  const veryClose = dist <= range * 0.55;
  const o = ctx.opp;
  const attacking = o.state === 'attack';
  const startup = attacking && o.movePhase === 'startup';
  const active = attacking && o.movePhase === 'active';
  const recovery = attacking && o.movePhase === 'recovery';
  const threatened = startup || active;
  const vulnerable = o.state === 'hitstun' || o.state === 'blockstun' || o.state === 'knockdown' || recovery;
  const blocking = o.state === 'block';
  const selfFrac = ctx.self.maxHp > 0 ? ctx.self.hp / ctx.self.maxHp : 1;
  const energyFrac = ctx.self.maxEnergy > 0 ? ctx.self.energy / ctx.self.maxEnergy : 0;

  const punishBonus = vulnerable ? ai.punish : 0;
  const whiffBonus = recovery ? ai.whiffPunish : 0;

  /** @type {{ action: import('./types.js').Action, score: number }[]} */
  const out = [];
  out.push({ action: idleAction(), score: 0.04 });

  const approachScore = inRange
    ? 0.08
    : ai.spacing * (0.4 + Math.min(ratio - 1, 3) * 0.3) * (1 + ai.aggression * 0.4);
  out.push({ action: moveAction(ctx.facing, true), score: approachScore });

  const retreatScore =
    ai.spacing * ((1 - selfFrac) * 0.9 + (threatened ? 0.4 : 0) + (veryClose ? 0.25 : 0)) * (1 + ai.defense * 0.3);
  out.push({ action: moveAction(ctx.facing, false), score: retreatScore });

  const blockScore = (threatened ? ai.defense * (0.6 + ai.blockReactionChance) : 0.05) + (veryClose && threatened ? 0.2 : 0);
  out.push({ action: blockAction(), score: blockScore });

  out.push({ action: crouchAction(), score: threatened ? ai.defense * 0.25 : 0.02 });
  out.push({ action: jumpAction(), score: ai.jumpUsage * 0.35 * (inRange ? 0.3 : 1) * (threatened ? 0.5 : 1) });

  let attackScore = ai.aggression * (inRange ? 1 : 0.02) + punishBonus + whiffBonus;
  if (blocking) attackScore *= 0.6;
  if (threatened && !vulnerable) attackScore *= 0.5;
  out.push({ action: attackAction(ctx, veryClose), score: attackScore });

  if (energyFrac >= ai.superThreshold && inRange) {
    out.push({ action: superAction(ctx.facing), score: 2 + ai.aggression });
  }

  const bias = PHASE_BIAS[ctx.phase];
  if (bias !== undefined) {
    for (const candidate of out) {
      const add = bias[candidate.action.name];
      if (add !== undefined) candidate.score += add;
    }
  }

  return out;
}

/** Coarse phase nudges applied on top of the weight-based scores. */
const PHASE_BIAS = /** @type {Record<string, Record<string, number>>} */ ({
  defend: { block: 0.5, retreat: 0.3, attack: -0.2 },
  punish: { attack: 0.6 },
  approach: { approach: 0.3 },
  engage: { attack: 0.2 },
});

/**
 * Choose the winning intent.
 * @param {import('./types.js').BotContext} ctx
 * @returns {import('./types.js').Action}
 */
export function choose(ctx) {
  const scored = evaluate(ctx);
  /** @type {{ action: import('./types.js').Action, score: number } | null} */
  let best = null;
  for (const s of scored) {
    if (best === null || s.score > best.score) best = s;
  }
  return best === null ? idleAction() : best.action;
}
