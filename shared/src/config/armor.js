/**
 * Armor configuration. Defense and weight are Q16.16 multipliers.
 *
 * @module shared/config/armor
 */

import { FP_SCALE } from '../constants.js';

const S = FP_SCALE;
const m = (/** @type {number} */ v) => (v * S) | 0;

/** @type {import('./types.js').ArmorConfig[]} */
export const ARMORS = [
  {
    id: 'a_cloth',
    nameKey: 'armor.cloth',
    defense: m(0),
    weight: m(0.2),
    speedPenalty: m(1),
    price: 0,
    iconKey: 'icon_armor_cloth',
  },
  {
    id: 'a_leather',
    nameKey: 'armor.leather',
    defense: m(0.08),
    weight: m(0.5),
    speedPenalty: m(0.97),
    price: 250,
    iconKey: 'icon_armor_leather',
  },
  {
    id: 'a_plate',
    nameKey: 'armor.plate',
    defense: m(0.18),
    weight: m(1.1),
    speedPenalty: m(0.9),
    price: 600,
    iconKey: 'icon_armor_plate',
  },
];

/**
 * @param {string} id
 * @returns {import('./types.js').ArmorConfig}
 * @throws {RangeError} when the id is unknown
 */
export function getArmor(id) {
  const a = ARMORS.find((x) => x.id === id);
  if (!a) throw new RangeError(`unknown armor id: ${id}`);
  return a;
}
