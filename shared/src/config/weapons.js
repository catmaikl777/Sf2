/**
 * Weapon configuration. Multipliers are Q16.16. `rangePx` is used by the AI
 * utility scorer to reason about spacing.
 *
 * @module shared/config/weapons
 */

import { FP_SCALE } from '../constants.js';

const S = FP_SCALE;
const m = (/** @type {number} */ v) => (v * S) | 0;

/** @type {import('./types.js').WeaponConfig[]} */
export const WEAPONS = [
  {
    id: 'w_unarmed',
    nameKey: 'weapon.unarmed',
    weaponClass: 'unarmed',
    damageMult: m(1),
    speedMult: m(1),
    weight: m(0.6),
    rangePx: 60,
    moveIds: [
      'unarmed_jab', 'unarmed_straight', 'unarmed_hook', 'unarmed_uppercut',
      'unarmed_lowkick', 'unarmed_roundkick', 'unarmed_spinkick', 'unarmed_knee',
      'unarmed_flyingkick', 'unarmed_sweep', 'unarmed_elbow', 'unarmed_doublejab',
      'unarmed_jumpkick', 'unarmed_heavypalm', 'unarmed_super',
    ],
    price: 0,
    iconKey: 'icon_unarmed',
  },
  {
    id: 'w_dagger',
    nameKey: 'weapon.dagger',
    weaponClass: 'dagger',
    damageMult: m(0.85),
    speedMult: m(1.18),
    weight: m(0.45),
    rangePx: 72,
    moveIds: [
      'dagger_stab', 'dagger_slash', 'dagger_lowslash', 'dagger_spinstab',
      'dagger_riposte', 'dagger_jabcombo', 'dagger_airslash', 'dagger_thrust',
      'dagger_slashcombo', 'dagger_super',
    ],
    price: 0,
    iconKey: 'icon_dagger',
  },
  {
    id: 'w_sword',
    nameKey: 'weapon.sword',
    weaponClass: 'sword',
    damageMult: m(1.05),
    speedMult: m(1),
    weight: m(0.9),
    rangePx: 96,
    moveIds: [
      'sword_slash', 'sword_overhead', 'sword_thrust', 'sword_lowsweep',
      'sword_crosscut', 'sword_spincut', 'sword_pommel', 'sword_jumpslash',
      'sword_combo1', 'sword_combo2', 'sword_super',
    ],
    price: 300,
    iconKey: 'icon_sword',
  },
  {
    id: 'w_axe',
    nameKey: 'weapon.axe',
    weaponClass: 'axe',
    damageMult: m(1.35),
    speedMult: m(0.84),
    weight: m(1.3),
    rangePx: 88,
    moveIds: [
      'axe_chop', 'axe_horizontalswing', 'axe_overheadchop', 'axe_lowsplit',
      'axe_spinswing', 'axe_buttstroke', 'axe_jumpchop', 'axe_combo1', 'axe_super',
    ],
    price: 520,
    iconKey: 'icon_axe',
  },
  {
    id: 'w_spear',
    nameKey: 'weapon.spear',
    weaponClass: 'spear',
    damageMult: m(1),
    speedMult: m(0.95),
    weight: m(1.05),
    rangePx: 130,
    moveIds: [
      'spear_thrust', 'spear_longthrust', 'spear_lowpoke', 'spear_sweep',
      'spear_leapstrike', 'spear_spinthrust', 'spear_buttend', 'spear_combo1', 'spear_super',
    ],
    price: 640,
    iconKey: 'icon_spear',
  },
  {
    id: 'w_nunchaku',
    nameKey: 'weapon.nunchaku',
    weaponClass: 'nunchaku',
    damageMult: m(0.92),
    speedMult: m(1.12),
    weight: m(0.5),
    rangePx: 78,
    moveIds: [
      'nunchaku_swipe', 'nunchaku_dualswipe', 'nunchaku_lowpoke',
      'nunchaku_overhead', 'nunchaku_lowsweep', 'nunchaku_spinstrike',
      'nunchaku_airswipe', 'nunchaku_combo1', 'nunchaku_super',
    ],
    price: 780,
    iconKey: 'icon_nunchaku',
  },
];

/**
 * @param {string} id
 * @returns {import('./types.js').WeaponConfig}
 * @throws {RangeError} when the id is unknown
 */
export function getWeapon(id) {
  const w = WEAPONS.find((x) => x.id === id);
  if (!w) throw new RangeError(`unknown weapon id: ${id}`);
  return w;
}
