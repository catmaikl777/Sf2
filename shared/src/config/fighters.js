/**
 * Fighter roster configuration. Stats are Q16.16 fixed point where marked.
 *
 * @module shared/config/fighters
 */

import { FP_SCALE, PX } from '../constants.js';

const S = FP_SCALE;

/** @type {import('./types.js').FighterConfig[]} */
export const FIGHTERS = [
  {
    id: 'shadow',
    nameKey: 'fighter.shadow',
    maxHp: 120,
    maxEnergy: 100,
    walkSpeed: Math.round(2.6 * S) | 0,
    backSpeed: Math.round(1.9 * S) | 0,
    dashSpeed: Math.round(6.5 * S) | 0,
    dashMs: 220,
    jumpVelocity: (-9.5 * S) | 0,
    gravity: Math.round(0.55 * S * S) / S | 0,
    weight: (1.0 * S) | 0,
    heightPx: 132,
    widthPx: 46,
    weaponIds: ['w_unarmed', 'w_dagger', 'w_sword'],
    armorIds: ['a_cloth', 'a_leather'],
    bodyAtlas: 'fighter_shadow',
    unlockPrice: 0,
  },
  {
    id: 'hermit',
    nameKey: 'fighter.hermit',
    maxHp: 108,
    maxEnergy: 120,
    walkSpeed: Math.round(2.9 * S) | 0,
    backSpeed: Math.round(2.2 * S) | 0,
    dashSpeed: Math.round(7.2 * S) | 0,
    dashMs: 200,
    jumpVelocity: (-10.2 * S) | 0,
    gravity: Math.round(0.52 * S * S) / S | 0,
    weight: Math.round(0.9 * S) | 0,
    heightPx: 126,
    widthPx: 44,
    weaponIds: ['w_unarmed', 'w_nunchaku', 'w_spear'],
    armorIds: ['a_cloth', 'a_leather'],
    bodyAtlas: 'fighter_hermit',
    unlockPrice: 0,
  },
  {
    id: 'butcher',
    nameKey: 'fighter.butcher',
    maxHp: 140,
    maxEnergy: 90,
    walkSpeed: Math.round(2.2 * S) | 0,
    backSpeed: Math.round(1.6 * S) | 0,
    dashSpeed: Math.round(5.4 * S) | 0,
    dashMs: 250,
    jumpVelocity: (-8.6 * S) | 0,
    gravity: Math.round(0.62 * S * S) / S | 0,
    weight: Math.round(1.25 * S) | 0,
    heightPx: 140,
    widthPx: 54,
    weaponIds: ['w_unarmed', 'w_axe', 'w_sword'],
    armorIds: ['a_leather', 'a_plate'],
    bodyAtlas: 'fighter_butcher',
    unlockPrice: 450,
  },
  {
    id: 'lynx',
    nameKey: 'fighter.lynx',
    maxHp: 100,
    maxEnergy: 110,
    walkSpeed: Math.round(3.2 * S) | 0,
    backSpeed: Math.round(2.5 * S) | 0,
    dashSpeed: Math.round(7.8 * S) | 0,
    dashMs: 180,
    jumpVelocity: (-10.8 * S) | 0,
    gravity: Math.round(0.5 * S * S) / S | 0,
    weight: Math.round(0.82 * S) | 0,
    heightPx: 122,
    widthPx: 42,
    weaponIds: ['w_unarmed', 'w_dagger', 'w_nunchaku'],
    armorIds: ['a_cloth', 'a_plate'],
    bodyAtlas: 'fighter_lynx',
    unlockPrice: 700,
  },
];

export const DEFAULT_FIGHTER_ID = 'shadow';

/**
 * Look up a fighter by id.
 * @param {string} id
 * @returns {import('./types.js').FighterConfig}
 * @throws {RangeError} when the id is unknown
 */
export function getFighter(id) {
  const f = FIGHTERS.find((x) => x.id === id);
  if (!f) throw new RangeError(`unknown fighter id: ${id}`);
  return f;
}

/** Ground-relative hurtbox of a fighter, in pixels (top-left origin at feet). */
export function hurtboxOf(/** @type {import('./types.js').FighterConfig} */ f) {
  return { w: PX(f.widthPx), h: PX(f.heightPx) };
}
