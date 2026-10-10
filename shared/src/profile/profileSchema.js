/**
 * Local player profile schema: shape, defaults and forward migrations.
 * Storage is the client's concern; this module owns only the data contract.
 *
 * @module shared/profile/profileSchema
 */

export const PROFILE_VERSION = 2;

/**
 * @typedef {Object} Settings
 * @property {import('../config/types.js').Difficulty} difficulty
 * @property {'ru'|'en'} language
 * @property {number} masterVolume   0..100
 * @property {number} musicVolume    0..100
 * @property {number} sfxVolume      0..100
 * @property {number} stickSensitivity 1..20 (px deadzone = 22 - sensitivity)
 * @property {boolean} debugMode
 */

/**
 * @typedef {Object} MatchRecord
 * @property {string} id
 * @property {string} isoDate
 * @property {string} fighterId
 * @property {string} weaponId
 * @property {string} armorId
 * @property {string} opponentFighterId
 * @property {string} aiDifficulty
 * @property {boolean} playerWon
 * @property {number} roundsWon
 * @property {number} roundsLost
 * @property {number} reward
 */

/**
 * @typedef {Object} Profile
 * @property {number} version
 * @property {number} coins
 * @property {string[]} unlockedFighters
 * @property {string[]} unlockedWeapons
 * @property {string[]} unlockedArmors
 * @property {MatchRecord[]} matches
 * @property {number} wins
 * @property {number} losses
 * @property {Settings} settings
 * @property {number} replayRewardSpentToday
 * @property {string} replayRewardDate
 */

/**
 * Default profile for a first launch.
 * @returns {Profile}
 */
export function defaultProfile() {
  return {
    version: PROFILE_VERSION,
    coins: 0,
    unlockedFighters: ['shadow', 'hermit'],
    unlockedWeapons: ['w_unarmed', 'w_dagger'],
    unlockedArmors: ['a_cloth'],
    matches: [],
    wins: 0,
    losses: 0,
    settings: {
      difficulty: 'NORMAL',
      language: 'ru',
      masterVolume: 80,
      musicVolume: 60,
      sfxVolume: 85,
      stickSensitivity: 12,
      debugMode: false,
    },
    replayRewardSpentToday: 0,
    replayRewardDate: '',
  };
}

/**
 * Coerce an arbitrary stored value into a valid Profile, repairing or
 * dropping anything malformed so corrupted storage can never crash the game.
 * @param {unknown} raw
 * @returns {Profile}
 */
export function migrateProfile(raw) {
  const base = defaultProfile();
  if (!raw || typeof raw !== 'object') return base;
  const o = /** @type {Record<string, any>} */ (raw);

  const num = (/** @type {unknown} */ v, /** @type {number} */ dflt) =>
    typeof v === 'number' && Number.isFinite(v) ? v : dflt;
  const str = (/** @type {unknown} */ v, /** @type {string} */ dflt) =>
    typeof v === 'string' ? v : dflt;
  const bool = (/** @type {unknown} */ v, /** @type {boolean} */ dflt) =>
    typeof v === 'boolean' ? v : dflt;
  const strList = (/** @type {unknown} */ v, /** @type {string[]} */ dflt) =>
    Array.isArray(v) ? v.filter((x) => typeof x === 'string') : dflt;

  const rawSettings = o.settings && typeof o.settings === 'object' ? o.settings : {};
  const s = /** @type {Record<string, any>} */ (rawSettings);
  const difficulty = s.difficulty === 'EASY' || s.difficulty === 'HARD' ? s.difficulty : 'NORMAL';
  const language = s.language === 'en' ? 'en' : 'ru';
  const clamp0100 = (/** @type {unknown} */ v, /** @type {number} */ d) =>
    Math.max(0, Math.min(100, Math.round(num(v, d))));

  /** @type {MatchRecord[]} */
  const matches = Array.isArray(o.matches)
    ? o.matches
        .filter((m) => m && typeof m === 'object')
        .slice(-200)
        .map((m) => ({
          id: str(m.id, ''),
          isoDate: str(m.isoDate, ''),
          fighterId: str(m.fighterId, 'shadow'),
          weaponId: str(m.weaponId, 'w_unarmed'),
          armorId: str(m.armorId, 'a_cloth'),
          opponentFighterId: str(m.opponentFighterId, 'hermit'),
          aiDifficulty: str(m.aiDifficulty, 'NORMAL'),
          playerWon: bool(m.playerWon, false),
          roundsWon: Math.max(0, Math.round(num(m.roundsWon, 0))),
          roundsLost: Math.max(0, Math.round(num(m.roundsLost, 0))),
          reward: Math.max(0, Math.round(num(m.reward, 0))),
        }))
    : [];

  const version = Math.max(1, Math.round(num(o.version, 1)));
  /** @type {Profile} */
  const out = {
    version: PROFILE_VERSION,
    coins: Math.max(0, Math.round(num(o.coins, 0))),
    unlockedFighters: strList(o.unlockedFighters, base.unlockedFighters),
    unlockedWeapons: strList(o.unlockedWeapons, base.unlockedWeapons),
    unlockedArmors: strList(o.unlockedArmors, base.unlockedArmors),
    matches,
    wins: Math.max(0, Math.round(num(o.wins, 0))),
    losses: Math.max(0, Math.round(num(o.losses, 0))),
    settings: {
      difficulty,
      language,
      masterVolume: clamp0100(s.masterVolume, 80),
      musicVolume: clamp0100(s.musicVolume, 60),
      sfxVolume: clamp0100(s.sfxVolume, 85),
      stickSensitivity: Math.max(1, Math.min(20, Math.round(num(s.stickSensitivity, 12)))),
      debugMode: bool(s.debugMode, false),
    },
    replayRewardSpentToday: Math.max(0, Math.round(num(o.replayRewardSpentToday, 0))),
    replayRewardDate: str(o.replayRewardDate, ''),
  };

  // v1 -> v2: replay reward budget fields did not exist.
  if (version < 2) {
    out.replayRewardSpentToday = 0;
    out.replayRewardDate = '';
  }
  return out;
}

/**
 * Derive summary statistics from a profile.
 * @param {Profile} p
 * @returns {{total: number, winrate: number}}
 */
export function profileStats(p) {
  const total = p.wins + p.losses;
  return { total, winrate: total === 0 ? 0 : p.wins / total };
}
