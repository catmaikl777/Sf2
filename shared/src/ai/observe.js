/**
 * World observation. Turns the public fighter state into the flat WorldView the
 * bot is allowed to see. This is the only place that reads the simulation
 * objects; the bot itself receives plain data and never touches sim internals.
 *
 * @module shared/ai/observe
 */

import { sub } from '../fp.js';

/**
 * Flatten one fighter into a human-visible view.
 * @param {import('../sim/types.js').FighterState} f
 * @returns {import('./types.js').FighterView}
 */
export function observeFighter(f) {
  /** @type {'none'|'startup'|'active'|'recovery'} */
  let movePhase = 'none';
  let moveId = null;
  let moveTick = 0;
  let moveTotalTicks = 0;
  const ms = f.move;
  if (ms) {
    moveId = ms.timing.move.id;
    moveTick = ms.tick;
    moveTotalTicks = ms.timing.totalTicks;
    if (ms.tick < ms.timing.startActiveTick) movePhase = 'startup';
    else if (ms.tick < ms.timing.startRecoveryTick) movePhase = 'active';
    else movePhase = 'recovery';
  }
  return {
    x: f.x,
    y: f.y,
    facing: f.facing,
    hp: f.hp,
    maxHp: f.maxHp,
    energy: f.energy,
    maxEnergy: f.maxEnergy,
    state: f.state,
    moveId,
    moveTick,
    moveTotalTicks,
    movePhase,
    stunTicks: f.stunTicks,
    grounded: f.y === 0,
  };
}

/**
 * Build a WorldView for one side. The harness (client or test) is responsible
 * for calling this once per tick and feeding the result to Bot.step.
 *
 * @param {import('../sim/sim.js').Sim} sim
 * @param {0|1} side
 * @returns {import('./types.js').WorldView}
 */
export function observe(sim, side) {
  const self = side === 0 ? sim.p0 : sim.p1;
  const opp = side === 0 ? sim.p1 : sim.p0;
  return {
    tick: sim.tick,
    self: observeFighter(self),
    opp: observeFighter(opp),
    distance: sub(opp.x, self.x),
    stage: sim.stage,
  };
}
