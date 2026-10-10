/**
 * Client-only configuration: canvas size, scene keys, palette and the keyboard
 * binding table. Combat numbers live in @sf/shared; nothing here affects the
 * simulation.
 *
 * @module client/config
 */

import { BTN, VIEW_WIDTH, VIEW_HEIGHT } from '@sf/shared';

export const GAME_WIDTH = VIEW_WIDTH;
export const GAME_HEIGHT = VIEW_HEIGHT;

export const SCENES = {
  BOOT: 'Boot',
  MENU: 'Menu',
  SELECT: 'Select',
  BATTLE: 'Battle',
  RESULT: 'Result',
};

export const COLORS = {
  bg: 0x0d0b12,
  ground: 0x201d29,
  groundLine: 0x3a3546,
  shadow: 0x4f6bed,
  hermit: 0xe0603a,
  hp: 0xe23b3b,
  hpLow: 0xf2a03e,
  energy: 0xf2c14e,
  barBg: 0x2a2733,
  panel: 0x171420,
  accent: 0xf2c14e,
  hit: 0xff5b5b,
  block: 0x6fb7ff,
};

/** @type {{text:string, dim:string, accent:string, hp:string}} */
export const TEXT_COLORS = {
  text: '#efeaf5',
  dim: '#8b8496',
  accent: '#f2c14e',
  hp: '#ff8a8a',
};

/**
 * Keyboard bindings: KeyboardEvent.code -> BTN mask. The player is always
 * p0 and fights on the left; movement is absolute (LEFT/RIGHT), the engine
 * resolves facing.
 *
 * @type {Record<string, number>}
 */
export const KEY_MAP = {
  ArrowLeft: BTN.LEFT,
  ArrowRight: BTN.RIGHT,
  ArrowUp: BTN.UP,
  ArrowDown: BTN.DOWN,
  KeyA: BTN.LEFT,
  KeyD: BTN.RIGHT,
  KeyW: BTN.UP,
  KeyS: BTN.DOWN,
  KeyJ: BTN.HAND,
  KeyK: BTN.FOOT,
  KeyL: BTN.BLOCK,
  Space: BTN.JUMP,
  KeyI: BTN.JUMP,
  ShiftLeft: BTN.DASH,
  KeyU: BTN.THROW,
};

/** @typedef {'EASY'|'NORMAL'|'HARD'} Difficulty */

/**
 * @typedef {Object} FighterSetup
 * @property {string} fighterId
 * @property {string} weaponId
 * @property {string} armorId
 */

/**
 * @typedef {Object} Matchup
 * @property {FighterSetup} p0
 * @property {FighterSetup} p1
 */

/** @type {Matchup} */
export const DEFAULT_MATCHUP = {
  p0: { fighterId: 'shadow', weaponId: 'w_unarmed', armorId: 'a_cloth' },
  p1: { fighterId: 'hermit', weaponId: 'w_unarmed', armorId: 'a_cloth' },
};

/** Playable roster shown in the select screen (ids must exist in config). */
export const ROSTER = {
  fighters: ['shadow', 'hermit'],
  weapons: ['w_unarmed', 'w_dagger', 'w_sword', 'w_axe', 'w_spear', 'w_nunchaku'],
  armors: ['a_cloth'],
};
