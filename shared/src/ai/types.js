/**
 * JSDoc type definitions for the deterministic AI bot. The bot only ever reads
 * a delayed, error-prone WorldView — exactly the information a human player
 * would have — and emits per-tick button masks. It never touches simulation
 * internals, clocks or Math.random.
 *
 * @module shared/ai/types
 */

/**
 * A fighter as seen by the bot: public, human-visible state only.
 *
 * @typedef {Object} FighterView
 * @property {number} x                 Q16.16 feet-center x
 * @property {number} y                 Q16.16 height above ground
 * @property {-1|1} facing
 * @property {number} hp
 * @property {number} maxHp
 * @property {number} energy
 * @property {number} maxEnergy
 * @property {import('../config/types.js').FighterState} state
 * @property {string|null} moveId       active move id if visibly attacking
 * @property {number} moveTick          ticks into the active move
 * @property {number} moveTotalTicks    full duration of the active move
 * @property {'none'|'startup'|'active'|'recovery'} movePhase
 * @property {number} stunTicks         remaining stun (0 when free)
 * @property {boolean} grounded
 */

/**
 * One frame of the visible world, produced every tick by the client or a test
 * harness from only the public fighter state.
 *
 * @typedef {Object} WorldView
 * @property {number} tick
 * @property {FighterView} self
 * @property {FighterView} opp
 * @property {number} distance   signed Q16.16: opp.x - self.x
 * @property {import('../sim/types.js').StageBounds} stage
 */

/**
 * A chosen intent. `buttons` is a raw per-tick BTN mask that persists until the
 * next decision; `press` marks buttons that must be pulsed for a single tick
 * (edge-triggered moves) rather than held.
 *
 * @typedef {Object} Action
 * @property {string} name
 * @property {number} buttons
 * @property {boolean} pulse     true = emit for one tick, then release
 * @property {number} holdTicks  minimum ticks to keep the intent before re-deciding
 * @property {number[]|null} script  optional per-tick button masks (multi-press combos)
 */

/**
 * Blackboard handed to the behaviour tree and utility scorer for one decision.
 *
 * @typedef {Object} BotContext
 * @property {import('../config/types.js').AiConfig} ai
 * @property {FighterView} self
 * @property {FighterView} opp
 * @property {number} distance   perceived signed Q16.16
 * @property {number} rangePx    own weapon effective range in pixels
 * @property {-1|1} facing
 * @property {number} tick
 * @property {string} phase
 */

/**
 * Options accepted by createBot.
 *
 * @typedef {Object} BotOptions
 * @property {import('../config/types.js').Difficulty} difficulty
 * @property {0|1} side
 * @property {number} seed
 * @property {string} weaponId   own weapon, used for its effective range
 */

/**
 * @typedef {Object} Bot
 * @property {(view: WorldView) => { buttons: number }} step
 * @property {() => void} reset
 * @property {string} phase
 */

export {};
