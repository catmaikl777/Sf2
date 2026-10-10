/**
 * High-level phase machine. The FSM reads the same perceived context the tree
 * uses and biases the bot towards one of a few coarse modes; the behaviour tree
 * and utility scorer then pick the concrete intent.
 *
 * @module shared/ai/fsm
 */

import { FP_SCALE } from '../constants.js';

/** @typedef {'neutral'|'approach'|'engage'|'defend'|'punish'|'recover'} Phase */

/**
 * @returns {{ readonly phase: Phase, update: (ctx: import('./types.js').BotContext) => Phase }}
 */
export function createFsm() {
  /** @type {Phase} */
  let phase = 'neutral';
  return {
    get phase() {
      return phase;
    },
    /** @param {import('./types.js').BotContext} ctx @returns {Phase} */
    update(ctx) {
      const self = ctx.self;
      const o = ctx.opp;
      const dist = Math.abs(ctx.distance) / FP_SCALE;
      const inRange = dist <= Math.max(1, ctx.rangePx);

      if (self.state === 'hitstun' || self.state === 'blockstun' || self.state === 'knockdown' || self.state === 'dead') {
        phase = 'recover';
      } else {
        const incoming = o.state === 'attack' && (o.movePhase === 'startup' || o.movePhase === 'active');
        const open = o.state === 'hitstun' || o.state === 'blockstun' || o.state === 'knockdown' || (o.state === 'attack' && o.movePhase === 'recovery');
        if (incoming && ctx.ai.defense >= 0.5) phase = 'defend';
        else if (open) phase = 'punish';
        else if (inRange) phase = 'engage';
        else phase = 'approach';
      }
      return phase;
    },
  };
}
