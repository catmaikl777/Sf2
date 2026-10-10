/**
 * Profile persistence. Wraps localStorage with the shared schema so a corrupt
 * or partially written save is repaired instead of crashing the game.
 *
 * @module client/storage/profileStore
 */

import { defaultProfile, migrateProfile } from '@sf/shared';

export const PROFILE_KEY = 'sf.profile.v1';

/** @returns {ReturnType<typeof defaultProfile>} */
export function loadProfile() {
  try {
    const raw = globalThis.localStorage?.getItem(PROFILE_KEY);
    if (!raw) return defaultProfile();
    return migrateProfile(JSON.parse(raw));
  } catch {
    return defaultProfile();
  }
}

/** @param {ReturnType<typeof defaultProfile>} profile @returns {boolean} */
export function saveProfile(profile) {
  try {
    globalThis.localStorage?.setItem(PROFILE_KEY, JSON.stringify(profile));
    return true;
  } catch {
    return false;
  }
}

/** Remove the stored profile (used by a future reset button). */
export function clearProfile() {
  try {
    globalThis.localStorage?.removeItem(PROFILE_KEY);
  } catch {
    // storage unavailable: nothing to clear
  }
}
