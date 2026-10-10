/**
 * Replay barrel: record a deterministic match, serialize it, and play it back.
 *
 * @module shared/replay
 */

export { REPLAY_VERSION } from './types.js';
export { createReplayHeader, createMatchRecorder, buildReplay } from './record.js';
export { playReplay, replaySignature } from './playback.js';
export { encodeReplay, decodeReplay, sanitizeReplay } from './codec.js';
