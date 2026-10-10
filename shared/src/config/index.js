/**
 * Configuration registry: assembles every config module into one validated
 * GameConfig, and exposes lookup helpers used by the simulation, the AI and
 * the client.
 *
 * @module shared/config
 */

import { FIGHTERS, DEFAULT_FIGHTER_ID, getFighter, hurtboxOf } from './fighters.js';
import { WEAPONS, getWeapon } from './weapons.js';
import { ARMORS, getArmor } from './armor.js';
import { MOVES, MOVES_BY_ID, getMove, movesForWeapon } from './moves.js';
import { COMBOS, COMBOS_BY_ID, combosForWeapon } from './combos.js';
import { ROUNDS } from './rounds.js';
import { AI_CONFIGS, getAiConfig } from './ai.js';
import { PROGRESSION } from './progression.js';
import { STAGES, DEFAULT_STAGE_ID, getStage } from './stages.js';
import { STRINGS, DEFAULT_LANGUAGE, t } from './strings.js';

/**
 * Build a deep-cloned game configuration object. Cloning guarantees that
 * validation/tests that mutate a returned copy cannot corrupt the shared
 * module-level config arrays.
 * @returns {import('./types.js').GameConfig}
 */
export function createGameConfig() {
  return /** @type {import('./types.js').GameConfig} */ (structuredClone({
    fighters: FIGHTERS,
    weapons: WEAPONS,
    armors: ARMORS,
    moves: MOVES,
    rounds: ROUNDS,
    ai: AI_CONFIGS,
    progression: PROGRESSION,
    stages: STAGES,
    strings: STRINGS.ru,
  }));
}

/**
 * Validate cross-references of the configuration. Collects every problem
 * instead of failing on the first one, so a bad edit is fixed in one pass.
 * @param {import('./types.js').GameConfig} cfg
 * @returns {string[]} list of error messages, empty when valid
 */
export function validateConfig(cfg) {
  /** @type {string[]} */
  const errors = [];

  const fighterIds = new Set();
  for (const f of cfg.fighters) {
    if (fighterIds.has(f.id)) errors.push(`duplicate fighter id: ${f.id}`);
    fighterIds.add(f.id);
    if (f.maxHp <= 0) errors.push(`fighter ${f.id}: maxHp must be > 0`);
    if (f.walkSpeed <= 0) errors.push(`fighter ${f.id}: walkSpeed must be > 0`);
    if (f.heightPx <= 0 || f.widthPx <= 0) errors.push(`fighter ${f.id}: hurtbox size must be > 0`);
    for (const wid of f.weaponIds) {
      if (!cfg.weapons.some((w) => w.id === wid)) errors.push(`fighter ${f.id}: unknown weapon ${wid}`);
    }
    for (const aid of f.armorIds) {
      if (!cfg.armors.some((a) => a.id === aid)) errors.push(`fighter ${f.id}: unknown armor ${aid}`);
    }
  }

  const moveIds = new Set(cfg.moves.map((m) => m.id));
  if (moveIds.size !== cfg.moves.length) errors.push('duplicate move ids present');

  for (const m of cfg.moves) {
    if (m.startupMs < 0 || m.activeMs <= 0 || m.recoveryMs < 0) {
      errors.push(`move ${m.id}: invalid timeline`);
    }
    if (m.hitboxes.length === 0) errors.push(`move ${m.id}: no hitbox windows`);
    for (const h of m.hitboxes) {
      if (h.endMs <= h.startMs) errors.push(`move ${m.id}: hitbox window end must exceed start`);
      if (h.w <= 0 || h.h <= 0) errors.push(`move ${m.id}: hitbox size must be > 0`);
      if (h.damage < 0) errors.push(`move ${m.id}: negative damage`);
    }
    const lastWindow = m.hitboxes.reduce((acc, h) => Math.max(acc, h.endMs), 0);
    if (lastWindow > m.startupMs + m.activeMs) {
      errors.push(`move ${m.id}: hitbox window exceeds startup+active window`);
    }
    for (const c of m.cancelsInto) {
      if (!moveIds.has(c)) errors.push(`move ${m.id}: cancels into unknown move ${c}`);
    }
    if (m.isSuper && m.energyCost <= 0) errors.push(`move ${m.id}: super requires energyCost > 0`);
  }

  const weaponIds = new Set();
  for (const w of cfg.weapons) {
    if (weaponIds.has(w.id)) errors.push(`duplicate weapon id: ${w.id}`);
    weaponIds.add(w.id);
    for (const mid of w.moveIds) {
      if (!moveIds.has(mid)) errors.push(`weapon ${w.id}: unknown move ${mid}`);
    }
    if (w.moveIds.length === 0) errors.push(`weapon ${w.id}: empty moveset`);
  }

  for (const c of COMBOS) {
    if (!moveIds.has(c.moveId)) errors.push(`combo ${c.id}: unknown move ${c.moveId}`);
    if (c.sequence.length === 0) errors.push(`combo ${c.id}: empty sequence`);
    if (c.windowMs < c.stepMs) errors.push(`combo ${c.id}: windowMs must be >= stepMs`);
  }
  if (new Set(COMBOS.map((c) => c.id)).size !== COMBOS.length) errors.push('duplicate combo ids present');

  if (cfg.rounds.roundsToWin < 1) errors.push('roundsToWin must be >= 1');
  if (cfg.rounds.roundTimeSec <= 0) errors.push('roundTimeSec must be > 0');
  if (cfg.rounds.introMs < 0 || cfg.rounds.outroMs < 0 || cfg.rounds.breakMs < 0) {
    errors.push('round phase durations must be >= 0');
  }

  for (const d of ['EASY', 'NORMAL', 'HARD']) {
    const a = cfg.ai[/** @type {import('./types.js').Difficulty} */ (d)];
    if (!a) {
      errors.push(`missing AI config for ${d}`);
      continue;
    }
    if (a.reactionDelayMs < 0) errors.push(`AI ${d}: negative reactionDelayMs`);
    if (a.decisionsPerSecond <= 0) errors.push(`AI ${d}: decisionsPerSecond must be > 0`);
    if (a.stateReadErrorChance < 0 || a.stateReadErrorChance > 1) errors.push(`AI ${d}: stateReadErrorChance out of range`);
    if (a.aggression < 0 || a.defense < 0 || a.spacing < 0) errors.push(`AI ${d}: utility weights must be >= 0`);
  }

  if (!cfg.stages.some((s) => s.id === DEFAULT_STAGE_ID)) errors.push('default stage missing');
  for (const s of cfg.stages) {
    if (s.rightPx <= s.leftPx) errors.push(`stage ${s.id}: rightPx must exceed leftPx`);
  }

  if (!cfg.fighters.some((f) => f.id === DEFAULT_FIGHTER_ID)) errors.push('default fighter missing');
  if (cfg.progression.winReward < 0 || cfg.progression.lossReward < 0) errors.push('rewards must be >= 0');

  return errors;
}

const GAME_CONFIG = createGameConfig();

/** Frozen default configuration used by simulation and client alike. */
export const config = Object.freeze(GAME_CONFIG);

/** Validation runs once at module load; a broken config must never ship. */
const startupErrors = validateConfig(GAME_CONFIG);
if (startupErrors.length > 0) {
  throw new Error(`invalid game config:\n- ${startupErrors.join('\n- ')}`);
}

export {
  FIGHTERS,
  WEAPONS,
  ARMORS,
  MOVES,
  MOVES_BY_ID,
  COMBOS,
  COMBOS_BY_ID,
  ROUNDS,
  AI_CONFIGS,
  PROGRESSION,
  STAGES,
  STRINGS,
  DEFAULT_FIGHTER_ID,
  DEFAULT_STAGE_ID,
  DEFAULT_LANGUAGE,
  getFighter,
  getWeapon,
  getArmor,
  getMove,
  movesForWeapon,
  combosForWeapon,
  getAiConfig,
  getStage,
  hurtboxOf,
  t,
};
