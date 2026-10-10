/**
 * Client storage barrel: profile and replay persistence.
 *
 * @module client/storage
 */

export { PROFILE_KEY, loadProfile, saveProfile, clearProfile } from './profileStore.js';
export { listReplayMeta, saveReplay, loadReplay, deleteReplay, clearReplays } from './replayStore.js';
