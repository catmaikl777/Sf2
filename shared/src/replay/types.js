/**
 * JSDoc type definitions for deterministic match replays. A replay is nothing
 * more than the match setup plus the raw per-tick input frames: because the
 * simulation is a pure function of those, replaying reproduces the fight
 * bit-for-bit — regardless of whether the buttons came from a human or a bot.
 *
 * @module shared/replay/types
 */

/** Bump when the serialized shape of a replay changes. */
export const REPLAY_VERSION = 1;

/**
 * One tick of both players' inputs.
 *
 * @typedef {Object} ReplayFrame
 * @property {number} p0  raw BTN mask
 * @property {number} p1  raw BTN mask
 */

/**
 * Everything needed to reconstruct a match, excluding the frames.
 *
 * @typedef {Object} ReplayHeader
 * @property {number} version
 * @property {number} createdAt     epoch ms (informational; 0 when not set)
 * @property {string} stageId
 * @property {import('../sim/sim.js').SimSetup} setup
 * @property {'player'|'bot'} p0Control
 * @property {'player'|'bot'} p1Control
 * @property {import('../config/types.js').Difficulty|null} p0Difficulty
 * @property {import('../config/types.js').Difficulty|null} p1Difficulty
 * @property {number|null} p0Seed
 * @property {number|null} p1Seed
 * @property {0|1|null} winner   match winner if known at record time
 * @property {number} frameCount
 */

/**
 * @typedef {Object} Replay
 * @property {ReplayHeader} header
 * @property {ReplayFrame[]} frames
 */

export {};
