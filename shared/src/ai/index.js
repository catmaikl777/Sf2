/**
 * AI barrel. `createBot` builds a deterministic opponent; `observe` is the
 * harness hook that turns fighter state into the WorldView the bot consumes.
 *
 * @module shared/ai
 */

export { createBot } from './bot.js';
export { observe, observeFighter } from './observe.js';
export { createPerception } from './perception.js';
export { createFsm } from './fsm.js';
export { evaluate, choose } from './utility.js';
export * as bt from './behaviortree.js';
