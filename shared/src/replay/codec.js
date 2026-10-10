/**
 * Replay serialization. `decodeReplay` is defensive: it validates the version,
 * the setup and every frame, and coerces button masks into the valid range so
 * a corrupt or hand-edited save can never crash playback.
 *
 * @module shared/replay/codec
 */

import { REPLAY_VERSION } from './types.js';

/** All defined button bits. */
const MASK = 0x7ff;

/** @param {unknown} v @returns {number} */
function toMask(v) {
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.trunc(v) : 0;
  return n & MASK;
}

/** @param {unknown} v @param {string} field @returns {string} */
function requireString(v, field) {
  if (typeof v !== 'string' || v.length === 0) throw new RangeError(`replay: ${field} must be a non-empty string`);
  return v;
}

/**
 * @param {unknown} raw
 * @returns {import('../sim/sim.js').SimSetup}
 */
function parseSetup(raw) {
  if (!raw || typeof raw !== 'object') throw new RangeError('replay: missing setup');
  const s = /** @type {Record<string, any>} */ (raw);
  return {
    p0: {
      fighterId: requireString(s.p0?.fighterId, 'setup.p0.fighterId'),
      weaponId: requireString(s.p0?.weaponId, 'setup.p0.weaponId'),
      armorId: requireString(s.p0?.armorId, 'setup.p0.armorId'),
    },
    p1: {
      fighterId: requireString(s.p1?.fighterId, 'setup.p1.fighterId'),
      weaponId: requireString(s.p1?.weaponId, 'setup.p1.weaponId'),
      armorId: requireString(s.p1?.armorId, 'setup.p1.armorId'),
    },
  };
}

/**
 * @param {unknown} raw
 * @returns {import('./types.js').Replay}
 */
export function sanitizeReplay(raw) {
  if (!raw || typeof raw !== 'object') throw new RangeError('replay: not an object');
  const o = /** @type {Record<string, any>} */ (raw);
  const h = o.header;
  if (!h || typeof h !== 'object') throw new RangeError('replay: missing header');
  const version = Math.round(Number(h.version));
  if (version !== REPLAY_VERSION) throw new RangeError(`replay: unsupported version ${h.version}`);
  const setup = parseSetup(h.setup);
  if (!Array.isArray(o.frames)) throw new RangeError('replay: missing frames');

  /** @type {import('./types.js').ReplayFrame[]} */
  const frames = o.frames.map((/** @type {any} */ f) => ({ p0: toMask(f?.p0), p1: toMask(f?.p1) }));

  const control = (/** @type {unknown} */ v) => (v === 'bot' ? 'bot' : 'player');
  const difficulty = (/** @type {unknown} */ v) =>
    v === 'EASY' || v === 'NORMAL' || v === 'HARD' ? v : null;
  const nullableInt = (/** @type {unknown} */ v) => (typeof v === 'number' && Number.isFinite(v) ? Math.trunc(v) : null);

  /** @type {import('./types.js').ReplayHeader} */
  const header = {
    version: REPLAY_VERSION,
    createdAt: nullableInt(h.createdAt) ?? 0,
    stageId: typeof h.stageId === 'string' ? h.stageId : '',
    setup,
    p0Control: control(h.p0Control),
    p1Control: control(h.p1Control),
    p0Difficulty: difficulty(h.p0Difficulty),
    p1Difficulty: difficulty(h.p1Difficulty),
    p0Seed: nullableInt(h.p0Seed),
    p1Seed: nullableInt(h.p1Seed),
    winner: h.winner === 0 || h.winner === 1 ? h.winner : null,
    frameCount: frames.length,
  };
  return { header, frames };
}

/**
 * @param {import('./types.js').Replay} replay
 * @returns {string}
 */
export function encodeReplay(replay) {
  return JSON.stringify(replay);
}

/**
 * @param {string} text
 * @returns {import('./types.js').Replay}
 * @throws {RangeError} on malformed or unsupported data
 */
export function decodeReplay(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new RangeError('replay: invalid JSON');
  }
  return sanitizeReplay(raw);
}
