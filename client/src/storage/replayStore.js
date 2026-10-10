/**
 * Replay persistence: an index of lightweight metadata plus one encoded replay
 * blob per entry. Both are validated through the shared codec on the way back
 * in, so damaged storage degrades gracefully.
 *
 * @module client/storage/replayStore
 */

import { encodeReplay, decodeReplay } from '@sf/shared';

/** @typedef {ReturnType<typeof decodeReplay>} Replay */
/**
 * @typedef {Object} ReplayMeta
 * @property {string} id
 * @property {number} createdAt
 * @property {string} stageId
 * @property {string} p0
 * @property {string} p1
 * @property {0|1|null} winner
 */

const INDEX_KEY = 'sf.replays.index.v1';
const ITEM_PREFIX = 'sf.replay.v1.';
const MAX_REPLAYS = 20;

/** @returns {ReplayMeta[]} */
export function listReplayMeta() {
  try {
    const raw = globalThis.localStorage?.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((m) => m && typeof m.id === 'string');
  } catch {
    return [];
  }
}

/** @param {ReplayMeta[]} index */
function writeIndex(index) {
  try {
    globalThis.localStorage?.setItem(INDEX_KEY, JSON.stringify(index));
  } catch {
    // storage full or unavailable: index stays best-effort
  }
}

/** Generate a unique id without depending on crypto being present.
 * @returns {string}
 */
function newId() {
  const rand = Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0');
  return `${Date.now().toString(36)}-${rand}`;
}

/**
 * Persist a replay, keeping only the newest MAX_REPLAYS entries.
 * @param {Replay} replay
 * @returns {string|null} the new id, or null when storage is unavailable
 */
export function saveReplay(replay) {
  const id = newId();
  try {
    globalThis.localStorage?.setItem(ITEM_PREFIX + id, encodeReplay(replay));
  } catch {
    return null;
  }
  /** @type {ReplayMeta} */
  const meta = {
    id,
    createdAt: replay.header.createdAt,
    stageId: replay.header.stageId,
    p0: replay.header.setup.p0.fighterId,
    p1: replay.header.setup.p1.fighterId,
    winner: replay.header.winner,
  };
  const full = [meta, ...listReplayMeta()];
  const index = full.slice(0, MAX_REPLAYS);
  for (const dropped of full.slice(MAX_REPLAYS)) {
    try {
      globalThis.localStorage?.removeItem(ITEM_PREFIX + dropped.id);
    } catch {
      // ignore
    }
  }
  writeIndex(index);
  return id;
}

/**
 * Load and decode a replay by id.
 * @param {string} id
 * @returns {Replay|null}
 */
export function loadReplay(id) {
  try {
    const raw = globalThis.localStorage?.getItem(ITEM_PREFIX + id);
    if (!raw) return null;
    return decodeReplay(raw);
  } catch {
    return null;
  }
}

/**
 * @param {string} id
 * @returns {boolean}
 */
export function deleteReplay(id) {
  try {
    globalThis.localStorage?.removeItem(ITEM_PREFIX + id);
  } catch {
    return false;
  }
  writeIndex(listReplayMeta().filter((m) => m.id !== id));
  return true;
}

/** Delete every stored replay and the index. */
export function clearReplays() {
  for (const meta of listReplayMeta()) deleteReplay(meta.id);
  writeIndex([]);
}
