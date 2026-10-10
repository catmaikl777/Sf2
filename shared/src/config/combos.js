/**
 * Combo table: directional sequences that map onto moves. This is pure data;
 * the input layer feeds sequences to phaser3-hadoken matchers built from this
 * table, and the AI references the same table when choosing follow-ups.
 *
 * Direction tokens: 'f' forward, 'b' back, 'd' down, 'u' up, 'n' neutral.
 * Button tokens: 'hand', 'foot', 'block', 'jump', 'dash', 'throw', 'super'.
 *
 * @module shared/config/combos
 */

/**
 * @typedef {Object} ComboEntry
 * @property {string} id
 * @property {string} moveId
 * @property {import('./types.js').WeaponClass|'universal'} weaponClass
 * @property {string[]} sequence   ordered semantic tokens, oldest first
 * @property {number} windowMs     total time allowed for the whole sequence
 * @property {number} stepMs       max gap between two consecutive tokens
 * @property {number} priority     higher wins when two combos match together
 */

/** @type {ComboEntry[]} */
export const COMBOS = [
  // ---- unarmed
  { id: 'c_u_jab', moveId: 'unarmed_jab', weaponClass: 'unarmed', sequence: ['n:hand'], windowMs: 400, stepMs: 400, priority: 1 },
  { id: 'c_u_doublejab', moveId: 'unarmed_doublejab', weaponClass: 'unarmed', sequence: ['n:hand', 'n:hand'], windowMs: 700, stepMs: 320, priority: 3 },
  { id: 'c_u_straight', moveId: 'unarmed_straight', weaponClass: 'unarmed', sequence: ['f:hand'], windowMs: 400, stepMs: 400, priority: 2 },
  { id: 'c_u_hook', moveId: 'unarmed_hook', weaponClass: 'unarmed', sequence: ['f:hand', 'n:hand'], windowMs: 800, stepMs: 380, priority: 4 },
  { id: 'c_u_uppercut', moveId: 'unarmed_uppercut', weaponClass: 'unarmed', sequence: ['d:hand'], windowMs: 400, stepMs: 400, priority: 3 },
  { id: 'c_u_lowkick', moveId: 'unarmed_lowkick', weaponClass: 'unarmed', sequence: ['n:foot'], windowMs: 400, stepMs: 400, priority: 1 },
  { id: 'c_u_roundkick', moveId: 'unarmed_roundkick', weaponClass: 'unarmed', sequence: ['f:foot'], windowMs: 400, stepMs: 400, priority: 2 },
  { id: 'c_u_spinkick', moveId: 'unarmed_spinkick', weaponClass: 'unarmed', sequence: ['f:foot', 'f:foot'], windowMs: 800, stepMs: 400, priority: 5 },
  { id: 'c_u_knee', moveId: 'unarmed_knee', weaponClass: 'unarmed', sequence: ['b:foot'], windowMs: 400, stepMs: 400, priority: 2 },
  { id: 'c_u_sweep', moveId: 'unarmed_sweep', weaponClass: 'unarmed', sequence: ['d:foot'], windowMs: 400, stepMs: 400, priority: 3 },
  { id: 'c_u_elbow', moveId: 'unarmed_elbow', weaponClass: 'unarmed', sequence: ['b:hand'], windowMs: 400, stepMs: 400, priority: 2 },
  { id: 'c_u_heavypalm', moveId: 'unarmed_heavypalm', weaponClass: 'unarmed', sequence: ['f:hand', 'f:hand'], windowMs: 850, stepMs: 400, priority: 6 },
  { id: 'c_u_flyingkick', moveId: 'unarmed_flyingkick', weaponClass: 'unarmed', sequence: ['u:f', 'f:foot'], windowMs: 900, stepMs: 450, priority: 5 },
  { id: 'c_u_jumpkick', moveId: 'unarmed_jumpkick', weaponClass: 'unarmed', sequence: ['u:f', 'n:hand'], windowMs: 900, stepMs: 450, priority: 4 },
  { id: 'c_u_super', moveId: 'unarmed_super', weaponClass: 'unarmed', sequence: ['f:hand', 'f:foot', 'f:hand'], windowMs: 1400, stepMs: 500, priority: 20 },

  // ---- dagger
  { id: 'c_d_stab', moveId: 'dagger_stab', weaponClass: 'dagger', sequence: ['n:hand'], windowMs: 400, stepMs: 400, priority: 1 },
  { id: 'c_d_jabcombo', moveId: 'dagger_jabcombo', weaponClass: 'dagger', sequence: ['n:hand', 'n:hand'], windowMs: 700, stepMs: 320, priority: 3 },
  { id: 'c_d_slash', moveId: 'dagger_slash', weaponClass: 'dagger', sequence: ['f:hand'], windowMs: 400, stepMs: 400, priority: 2 },
  { id: 'c_d_slashcombo', moveId: 'dagger_slashcombo', weaponClass: 'dagger', sequence: ['f:hand', 'f:hand'], windowMs: 800, stepMs: 380, priority: 5 },
  { id: 'c_d_lowslash', moveId: 'dagger_lowslash', weaponClass: 'dagger', sequence: ['d:foot'], windowMs: 400, stepMs: 400, priority: 3 },
  { id: 'c_d_thrust', moveId: 'dagger_thrust', weaponClass: 'dagger', sequence: ['d:hand'], windowMs: 400, stepMs: 400, priority: 3 },
  { id: 'c_d_spinstab', moveId: 'dagger_spinstab', weaponClass: 'dagger', sequence: ['f:foot', 'f:foot'], windowMs: 800, stepMs: 400, priority: 5 },
  { id: 'c_d_riposte', moveId: 'dagger_riposte', weaponClass: 'dagger', sequence: ['b:hand'], windowMs: 400, stepMs: 400, priority: 4 },
  { id: 'c_d_airslash', moveId: 'dagger_airslash', weaponClass: 'dagger', sequence: ['u:f', 'n:hand'], windowMs: 900, stepMs: 450, priority: 4 },
  { id: 'c_d_super', moveId: 'dagger_super', weaponClass: 'dagger', sequence: ['f:hand', 'f:hand', 'f:foot'], windowMs: 1400, stepMs: 500, priority: 20 },

  // ---- sword
  { id: 'c_s_slash', moveId: 'sword_slash', weaponClass: 'sword', sequence: ['n:hand'], windowMs: 400, stepMs: 400, priority: 1 },
  { id: 'c_s_combo1', moveId: 'sword_combo1', weaponClass: 'sword', sequence: ['n:hand', 'n:hand'], windowMs: 700, stepMs: 340, priority: 3 },
  { id: 'c_s_combo2', moveId: 'sword_combo2', weaponClass: 'sword', sequence: ['f:hand', 'f:hand', 'f:hand'], windowMs: 1200, stepMs: 400, priority: 7 },
  { id: 'c_s_overhead', moveId: 'sword_overhead', weaponClass: 'sword', sequence: ['d:hand'], windowMs: 400, stepMs: 400, priority: 4 },
  { id: 'c_s_thrust', moveId: 'sword_thrust', weaponClass: 'sword', sequence: ['f:hand'], windowMs: 400, stepMs: 400, priority: 2 },
  { id: 'c_s_lowsweep', moveId: 'sword_lowsweep', weaponClass: 'sword', sequence: ['d:foot'], windowMs: 400, stepMs: 400, priority: 3 },
  { id: 'c_s_crosscut', moveId: 'sword_crosscut', weaponClass: 'sword', sequence: ['n:hand', 'n:foot'], windowMs: 800, stepMs: 380, priority: 6 },
  { id: 'c_s_spincut', moveId: 'sword_spincut', weaponClass: 'sword', sequence: ['f:foot', 'f:foot'], windowMs: 850, stepMs: 420, priority: 7 },
  { id: 'c_s_pommel', moveId: 'sword_pommel', weaponClass: 'sword', sequence: ['b:hand'], windowMs: 400, stepMs: 400, priority: 2 },
  { id: 'c_s_jumpslash', moveId: 'sword_jumpslash', weaponClass: 'sword', sequence: ['u:f', 'n:hand'], windowMs: 900, stepMs: 450, priority: 5 },
  { id: 'c_s_super', moveId: 'sword_super', weaponClass: 'sword', sequence: ['f:hand', 'f:hand', 'f:foot'], windowMs: 1400, stepMs: 500, priority: 20 },

  // ---- axe
  { id: 'c_a_chop', moveId: 'axe_chop', weaponClass: 'axe', sequence: ['n:hand'], windowMs: 400, stepMs: 400, priority: 1 },
  { id: 'c_a_combo1', moveId: 'axe_combo1', weaponClass: 'axe', sequence: ['n:hand', 'n:hand'], windowMs: 750, stepMs: 360, priority: 4 },
  { id: 'c_a_horizontal', moveId: 'axe_horizontalswing', weaponClass: 'axe', sequence: ['f:hand'], windowMs: 400, stepMs: 400, priority: 3 },
  { id: 'c_a_overhead', moveId: 'axe_overheadchop', weaponClass: 'axe', sequence: ['d:hand'], windowMs: 400, stepMs: 400, priority: 5 },
  { id: 'c_a_lowsplit', moveId: 'axe_lowsplit', weaponClass: 'axe', sequence: ['d:foot'], windowMs: 400, stepMs: 400, priority: 4 },
  { id: 'c_a_spinswing', moveId: 'axe_spinswing', weaponClass: 'axe', sequence: ['f:foot', 'f:foot'], windowMs: 900, stepMs: 450, priority: 8 },
  { id: 'c_a_buttstroke', moveId: 'axe_buttstroke', weaponClass: 'axe', sequence: ['b:hand'], windowMs: 400, stepMs: 400, priority: 2 },
  { id: 'c_a_jumpchop', moveId: 'axe_jumpchop', weaponClass: 'axe', sequence: ['u:f', 'n:hand'], windowMs: 900, stepMs: 450, priority: 6 },
  { id: 'c_a_super', moveId: 'axe_super', weaponClass: 'axe', sequence: ['f:hand', 'f:hand', 'f:foot'], windowMs: 1500, stepMs: 520, priority: 20 },

  // ---- spear
  { id: 'c_p_thrust', moveId: 'spear_thrust', weaponClass: 'spear', sequence: ['n:hand'], windowMs: 400, stepMs: 400, priority: 1 },
  { id: 'c_p_combo1', moveId: 'spear_combo1', weaponClass: 'spear', sequence: ['n:hand', 'n:hand'], windowMs: 750, stepMs: 360, priority: 3 },
  { id: 'c_p_longthrust', moveId: 'spear_longthrust', weaponClass: 'spear', sequence: ['f:hand'], windowMs: 400, stepMs: 400, priority: 4 },
  { id: 'c_p_spinthrust', moveId: 'spear_spinthrust', weaponClass: 'spear', sequence: ['f:hand', 'f:hand'], windowMs: 850, stepMs: 400, priority: 6 },
  { id: 'c_p_lowpoke', moveId: 'spear_lowpoke', weaponClass: 'spear', sequence: ['d:foot'], windowMs: 400, stepMs: 400, priority: 3 },
  { id: 'c_p_sweep', moveId: 'spear_sweep', weaponClass: 'spear', sequence: ['n:foot'], windowMs: 400, stepMs: 400, priority: 3 },
  { id: 'c_p_leapstrike', moveId: 'spear_leapstrike', weaponClass: 'spear', sequence: ['d:hand'], windowMs: 400, stepMs: 400, priority: 5 },
  { id: 'c_p_buttend', moveId: 'spear_buttend', weaponClass: 'spear', sequence: ['b:hand'], windowMs: 400, stepMs: 400, priority: 2 },
  { id: 'c_p_super', moveId: 'spear_super', weaponClass: 'spear', sequence: ['f:hand', 'f:hand', 'f:foot'], windowMs: 1500, stepMs: 520, priority: 20 },

  // ---- nunchaku
  { id: 'c_n_swipe', moveId: 'nunchaku_swipe', weaponClass: 'nunchaku', sequence: ['n:hand'], windowMs: 400, stepMs: 400, priority: 1 },
  { id: 'c_n_dualswipe', moveId: 'nunchaku_dualswipe', weaponClass: 'nunchaku', sequence: ['n:hand', 'n:hand'], windowMs: 700, stepMs: 330, priority: 3 },
  { id: 'c_n_combo1', moveId: 'nunchaku_combo1', weaponClass: 'nunchaku', sequence: ['f:hand', 'f:hand'], windowMs: 800, stepMs: 380, priority: 5 },
  { id: 'c_n_lowpoke', moveId: 'nunchaku_lowpoke', weaponClass: 'nunchaku', sequence: ['d:foot'], windowMs: 400, stepMs: 400, priority: 2 },
  { id: 'c_n_overhead', moveId: 'nunchaku_overhead', weaponClass: 'nunchaku', sequence: ['d:hand'], windowMs: 400, stepMs: 400, priority: 4 },
  { id: 'c_n_lowsweep', moveId: 'nunchaku_lowsweep', weaponClass: 'nunchaku', sequence: ['n:foot'], windowMs: 400, stepMs: 400, priority: 2 },
  { id: 'c_n_spinstrike', moveId: 'nunchaku_spinstrike', weaponClass: 'nunchaku', sequence: ['f:foot', 'f:foot'], windowMs: 850, stepMs: 420, priority: 6 },
  { id: 'c_n_airswipe', moveId: 'nunchaku_airswipe', weaponClass: 'nunchaku', sequence: ['u:f', 'n:hand'], windowMs: 900, stepMs: 450, priority: 4 },
  { id: 'c_n_super', moveId: 'nunchaku_super', weaponClass: 'nunchaku', sequence: ['f:hand', 'f:hand', 'f:foot'], windowMs: 1400, stepMs: 500, priority: 20 },

  // ---- universal (any weapon)
  { id: 'c_x_throw', moveId: 'universal_throw', weaponClass: 'universal', sequence: ['b:hand', 'b:foot'], windowMs: 800, stepMs: 420, priority: 15 },
  { id: 'c_x_dashattack', moveId: 'universal_dashattack', weaponClass: 'universal', sequence: ['f:f', 'f:hand'], windowMs: 900, stepMs: 450, priority: 10 },
];

/** @type {Map<string, ComboEntry>} */
export const COMBOS_BY_ID = new Map(COMBOS.map((c) => [c.id, c]));

/**
 * Combos usable with a given weapon class (universal ones always included).
 * @param {import('./types.js').WeaponClass} wc
 * @returns {ComboEntry[]}
 */
export function combosForWeapon(wc) {
  return COMBOS.filter((c) => c.weaponClass === wc || c.weaponClass === 'universal');
}
