/**
 * Move library: every attack in the game, expressed as a data table.
 * Timings are milliseconds; spatial values are pixels converted to Q16.16
 * through PX(). The simulation consumes these records verbatim — changing a
 * number here changes combat behaviour without touching engine code.
 *
 * @module shared/config/moves
 */

import { PX, FP_SCALE } from '../constants.js';

const S = FP_SCALE;

/**
 * Build one hitbox window from pixel units.
 * @param {number} startMs
 * @param {number} endMs
 * @param {{ox:number, oy:number, w:number, h:number}} box pixels
 * @param {number} damage
 * @param {Partial<import('./types.js').HitboxWindow>} [extra]
 * @returns {import('./types.js').HitboxWindow}
 */
function hb(startMs, endMs, box, damage, extra = {}) {
  return {
    startMs,
    endMs,
    ox: PX(box.ox),
    oy: PX(box.oy),
    w: PX(box.w),
    h: PX(box.h),
    damage,
    damageType: 'light',
    breaksBlock: false,
    hitstunMs: 260,
    blockstunMs: 180,
    knockback: PX(3.2),
    liftup: 0,
    stunMs: 0,
    hitstopMs: 70,
    ...extra,
  };
}

/**
 * Build one move record with sane defaults.
 * @param {Partial<import('./types.js').MoveConfig> & {id:string, weaponClass:import('./types.js').WeaponClass|'universal'}} m
 * @returns {import('./types.js').MoveConfig}
 */
function mv(m) {
  return {
    nameKey: `move.${m.id}`,
    buttons: ['hand'],
    dirs: ['neutral'],
    stance: 'stand',
    startupMs: 120,
    activeMs: 80,
    recoveryMs: 200,
    hitstunMs: 260,
    blockstunMs: 180,
    damage: 8,
    knockback: PX(3.2),
    energyGain: 6,
    energyCost: 0,
    isSuper: false,
    moveWeight: Math.round(0.8 * S) | 0,
    cancelWindowStartMs: 0,
    cancelWindowEndMs: 0,
    advance: 0,
    animId: m.id,
    hitboxes: [],
    cancelsInto: [],
    priority: 1,
    ...m,
  };
}

/** @type {import('./types.js').MoveConfig[]} */
export const MOVES = [
  // ---------------------------------------------------------------- unarmed
  mv({
    id: 'unarmed_jab', weaponClass: 'unarmed', buttons: ['hand'], dirs: ['neutral'],
    startupMs: 70, activeMs: 55, recoveryMs: 110, damage: 6, energyGain: 5,
    advance: PX(4), priority: 1,
    hitboxes: [hb(70, 125, { ox: 14, oy: -96, w: 52, h: 26 }, 6)],
  }),
  mv({
    id: 'unarmed_doublejab', weaponClass: 'unarmed', buttons: ['hand', 'hand'], dirs: ['neutral'],
    startupMs: 65, activeMs: 150, recoveryMs: 140, damage: 5, energyGain: 4,
    advance: PX(5), priority: 1,
    hitboxes: [
      hb(65, 115, { ox: 14, oy: -96, w: 52, h: 26 }, 5),
      hb(165, 215, { ox: 16, oy: -94, w: 54, h: 26 }, 5),
    ],
  }),
  mv({
    id: 'unarmed_straight', weaponClass: 'unarmed', buttons: ['hand'], dirs: ['forward'],
    startupMs: 95, activeMs: 60, recoveryMs: 160, damage: 9, energyGain: 7,
    advance: PX(8), priority: 2,
    hitboxes: [hb(95, 155, { ox: 16, oy: -98, w: 58, h: 28 }, 9,
      { damageType: 'heavy', knockback: PX(4.4) })],
  }),
  mv({
    id: 'unarmed_hook', weaponClass: 'unarmed', buttons: ['hand'], dirs: ['neutral', 'forward'],
    startupMs: 140, activeMs: 70, recoveryMs: 230, damage: 13, energyGain: 9,
    advance: PX(6), priority: 3,
    hitboxes: [hb(140, 210, { ox: 8, oy: -104, w: 62, h: 34 }, 13,
      { damageType: 'heavy', knockback: PX(5.6), hitstunMs: 330, stunMs: 120 })],
  }),
  mv({
    id: 'unarmed_uppercut', weaponClass: 'unarmed', buttons: ['hand'], dirs: ['down'],
    startupMs: 110, activeMs: 75, recoveryMs: 300, damage: 12, energyGain: 10,
    priority: 4,
    hitboxes: [hb(110, 185, { ox: 10, oy: -118, w: 44, h: 62 }, 12,
      { damageType: 'heavy', knockback: PX(2.4), liftup: PX(-7.5), hitstunMs: 360, stunMs: 150 })],
  }),
  mv({
    id: 'unarmed_lowkick', weaponClass: 'unarmed', buttons: ['foot'], dirs: ['neutral'],
    startupMs: 90, activeMs: 60, recoveryMs: 150, damage: 7, energyGain: 5,
    advance: PX(6), priority: 1,
    hitboxes: [hb(90, 150, { ox: 16, oy: -34, w: 56, h: 26 }, 7)],
  }),
  mv({
    id: 'unarmed_roundkick', weaponClass: 'unarmed', buttons: ['foot'], dirs: ['forward'],
    startupMs: 130, activeMs: 70, recoveryMs: 220, damage: 11, energyGain: 8,
    advance: PX(9), priority: 3,
    hitboxes: [hb(130, 200, { ox: 18, oy: -86, w: 62, h: 32 }, 11,
      { damageType: 'heavy', knockback: PX(5.2), hitstunMs: 320 })],
  }),
  mv({
    id: 'unarmed_spinkick', weaponClass: 'unarmed', buttons: ['foot', 'foot'], dirs: ['forward'],
    startupMs: 175, activeMs: 90, recoveryMs: 290, damage: 14, energyGain: 11,
    advance: PX(7), priority: 4,
    hitboxes: [hb(175, 265, { ox: 12, oy: -90, w: 74, h: 40 }, 14,
      { damageType: 'heavy', knockback: PX(6.4), hitstunMs: 350, stunMs: 140, hitstopMs: 95 })],
  }),
  mv({
    id: 'unarmed_knee', weaponClass: 'unarmed', buttons: ['foot'], dirs: ['back'],
    startupMs: 105, activeMs: 60, recoveryMs: 190, damage: 9, energyGain: 7,
    priority: 2,
    hitboxes: [hb(105, 165, { ox: 12, oy: -74, w: 44, h: 34 }, 9,
      { damageType: 'heavy', knockback: PX(4.0) })],
  }),
  mv({
    id: 'unarmed_sweep', weaponClass: 'unarmed', buttons: ['foot'], dirs: ['down'],
    startupMs: 125, activeMs: 70, recoveryMs: 280, damage: 8, energyGain: 8,
    stance: 'crouch', priority: 3,
    hitboxes: [hb(125, 195, { ox: 14, oy: -18, w: 74, h: 20 }, 8,
      { knockback: PX(3.0), liftup: PX(-2.4), hitstunMs: 300 })],
  }),
  mv({
    id: 'unarmed_elbow', weaponClass: 'unarmed', buttons: ['hand'], dirs: ['back'],
    startupMs: 85, activeMs: 55, recoveryMs: 160, damage: 8, energyGain: 6,
    priority: 2,
    hitboxes: [hb(85, 140, { ox: 4, oy: -98, w: 44, h: 28 }, 8,
      { damageType: 'heavy', knockback: PX(4.8) })],
  }),
  mv({
    id: 'unarmed_heavypalm', weaponClass: 'unarmed', buttons: ['hand', 'hand'], dirs: ['forward'],
    startupMs: 165, activeMs: 70, recoveryMs: 260, damage: 15, energyGain: 12,
    advance: PX(10), priority: 5,
    hitboxes: [hb(165, 235, { ox: 14, oy: -98, w: 64, h: 34 }, 15,
      { damageType: 'heavy', breaksBlock: true, knockback: PX(7.2), hitstunMs: 380, stunMs: 200, hitstopMs: 110 })],
  }),
  mv({
    id: 'unarmed_flyingkick', weaponClass: 'unarmed', buttons: ['foot'], dirs: ['forward'],
    stance: 'air', startupMs: 110, activeMs: 110, recoveryMs: 220, damage: 12, energyGain: 9,
    advance: PX(6), priority: 3,
    hitboxes: [hb(110, 220, { ox: 18, oy: -84, w: 64, h: 34 }, 12,
      { damageType: 'heavy', knockback: PX(5.8), hitstunMs: 330 })],
  }),
  mv({
    id: 'unarmed_jumpkick', weaponClass: 'unarmed', buttons: ['hand'], dirs: ['neutral', 'forward'],
    stance: 'air', startupMs: 95, activeMs: 100, recoveryMs: 200, damage: 10, energyGain: 8,
    priority: 3,
    hitboxes: [hb(95, 195, { ox: 14, oy: -70, w: 58, h: 32 }, 10,
      { knockback: PX(5.0), hitstunMs: 310 })],
  }),
  mv({
    id: 'unarmed_super', weaponClass: 'unarmed', buttons: ['hand', 'foot', 'hand'], dirs: ['forward'],
    startupMs: 210, activeMs: 140, recoveryMs: 430, damage: 30, energyGain: 0, energyCost: 100,
    isSuper: true, advance: PX(12), priority: 10, moveWeight: Math.round(0.55 * S) | 0,
    hitboxes: [hb(210, 350, { ox: 10, oy: -110, w: 84, h: 64 }, 30,
      { damageType: 'crit', breaksBlock: true, knockback: PX(9.5), liftup: PX(-5),
        hitstunMs: 520, stunMs: 420, hitstopMs: 180 })],
  }),

  // ----------------------------------------------------------------- dagger
  mv({
    id: 'dagger_stab', weaponClass: 'dagger', buttons: ['hand'], dirs: ['neutral'],
    startupMs: 60, activeMs: 45, recoveryMs: 105, damage: 5, energyGain: 4,
    advance: PX(5), priority: 1,
    hitboxes: [hb(60, 105, { ox: 16, oy: -94, w: 54, h: 20 }, 5)],
  }),
  mv({
    id: 'dagger_jabcombo', weaponClass: 'dagger', buttons: ['hand', 'hand'], dirs: ['neutral'],
    startupMs: 58, activeMs: 137, recoveryMs: 130, damage: 4, energyGain: 4,
    advance: PX(6), priority: 1,
    hitboxes: [
      hb(58, 103, { ox: 16, oy: -94, w: 54, h: 20 }, 4),
      hb(150, 195, { ox: 18, oy: -92, w: 56, h: 20 }, 4),
    ],
  }),
  mv({
    id: 'dagger_slash', weaponClass: 'dagger', buttons: ['hand'], dirs: ['forward'],
    startupMs: 85, activeMs: 55, recoveryMs: 150, damage: 8, energyGain: 6,
    advance: PX(7), priority: 2,
    hitboxes: [hb(85, 140, { ox: 16, oy: -100, w: 62, h: 30 }, 8,
      { damageType: 'heavy', knockback: PX(4.2) })],
  }),
  mv({
    id: 'dagger_slashcombo', weaponClass: 'dagger', buttons: ['hand', 'hand'], dirs: ['forward'],
    startupMs: 80, activeMs: 170, recoveryMs: 190, damage: 7, energyGain: 6,
    advance: PX(8), priority: 2,
    hitboxes: [
      hb(80, 135, { ox: 16, oy: -100, w: 62, h: 28 }, 7),
      hb(195, 250, { ox: 20, oy: -60, w: 64, h: 34 }, 7,
        { damageType: 'heavy', knockback: PX(4.6) }),
    ],
  }),
  mv({
    id: 'dagger_lowslash', weaponClass: 'dagger', buttons: ['foot'], dirs: ['down'],
    startupMs: 100, activeMs: 60, recoveryMs: 210, damage: 7, energyGain: 6,
    stance: 'crouch', priority: 2,
    hitboxes: [hb(100, 160, { ox: 14, oy: -20, w: 68, h: 22 }, 7,
      { knockback: PX(3.4), hitstunMs: 300 })],
  }),
  mv({
    id: 'dagger_thrust', weaponClass: 'dagger', buttons: ['hand'], dirs: ['down'],
    startupMs: 120, activeMs: 60, recoveryMs: 240, damage: 10, energyGain: 8,
    advance: PX(11), priority: 3,
    hitboxes: [hb(120, 180, { ox: 18, oy: -90, w: 70, h: 24 }, 10,
      { damageType: 'heavy', knockback: PX(4.8), hitstunMs: 320 })],
  }),
  mv({
    id: 'dagger_spinstab', weaponClass: 'dagger', buttons: ['foot', 'foot'], dirs: ['forward'],
    startupMs: 155, activeMs: 80, recoveryMs: 265, damage: 12, energyGain: 10,
    advance: PX(8), priority: 4,
    hitboxes: [hb(155, 235, { ox: 12, oy: -92, w: 72, h: 40 }, 12,
      { damageType: 'heavy', knockback: PX(5.6), hitstunMs: 340, stunMs: 130 })],
  }),
  mv({
    id: 'dagger_riposte', weaponClass: 'dagger', buttons: ['hand'], dirs: ['back'],
    startupMs: 75, activeMs: 55, recoveryMs: 175, damage: 9, energyGain: 7,
    priority: 4,
    hitboxes: [hb(75, 130, { ox: 6, oy: -96, w: 56, h: 26 }, 9,
      { damageType: 'crit', knockback: PX(4.4), hitstunMs: 330 })],
  }),
  mv({
    id: 'dagger_airslash', weaponClass: 'dagger', buttons: ['hand'], dirs: ['neutral', 'forward'],
    stance: 'air', startupMs: 85, activeMs: 90, recoveryMs: 190, damage: 9, energyGain: 7,
    priority: 3,
    hitboxes: [hb(85, 175, { ox: 14, oy: -76, w: 60, h: 30 }, 9,
      { knockback: PX(4.6), hitstunMs: 310 })],
  }),
  mv({
    id: 'dagger_super', weaponClass: 'dagger', buttons: ['hand', 'hand', 'foot'], dirs: ['forward'],
    startupMs: 160, activeMs: 260, recoveryMs: 380, damage: 26, energyGain: 0, energyCost: 100,
    isSuper: true, advance: PX(14), priority: 10, moveWeight: Math.round(0.6 * S) | 0,
    hitboxes: [
      hb(160, 240, { ox: 16, oy: -96, w: 66, h: 30 }, 9,
        { damageType: 'heavy', knockback: PX(4) }),
      hb(250, 330, { ox: 20, oy: -92, w: 70, h: 32 }, 9,
        { damageType: 'heavy', knockback: PX(4.5) }),
      hb(340, 420, { ox: 22, oy: -90, w: 76, h: 36 }, 8,
        { damageType: 'crit', breaksBlock: true, knockback: PX(8), hitstunMs: 480, stunMs: 360, hitstopMs: 160 }),
    ],
  }),

  // ------------------------------------------------------------------ sword
  mv({
    id: 'sword_slash', weaponClass: 'sword', buttons: ['hand'], dirs: ['neutral'],
    startupMs: 100, activeMs: 65, recoveryMs: 175, damage: 9, energyGain: 7,
    advance: PX(6), priority: 2,
    hitboxes: [hb(100, 165, { ox: 18, oy: -98, w: 76, h: 34 }, 9,
      { knockback: PX(4.4) })],
  }),
  mv({
    id: 'sword_combo1', weaponClass: 'sword', buttons: ['hand', 'hand'], dirs: ['neutral'],
    startupMs: 95, activeMs: 180, recoveryMs: 200, damage: 8, energyGain: 6,
    advance: PX(7), priority: 2,
    hitboxes: [
      hb(95, 155, { ox: 18, oy: -98, w: 76, h: 32 }, 8),
      hb(215, 275, { ox: 22, oy: -70, w: 78, h: 34 }, 8,
        { damageType: 'heavy', knockback: PX(4.8) }),
    ],
  }),
  mv({
    id: 'sword_combo2', weaponClass: 'sword', buttons: ['hand', 'hand', 'hand'], dirs: ['forward'],
    startupMs: 90, activeMs: 285, recoveryMs: 250, damage: 7, energyGain: 6,
    advance: PX(9), priority: 3,
    hitboxes: [
      hb(90, 150, { ox: 18, oy: -98, w: 76, h: 32 }, 7),
      hb(200, 260, { ox: 20, oy: -56, w: 80, h: 34 }, 7),
      hb(310, 375, { ox: 24, oy: -104, w: 82, h: 40 }, 9,
        { damageType: 'heavy', knockback: PX(6.6), hitstunMs: 360, stunMs: 150 }),
    ],
  }),
  mv({
    id: 'sword_overhead', weaponClass: 'sword', buttons: ['hand'], dirs: ['down'],
    startupMs: 165, activeMs: 75, recoveryMs: 285, damage: 14, energyGain: 10,
    advance: PX(5), priority: 4,
    hitboxes: [hb(165, 240, { ox: 14, oy: -122, w: 58, h: 62 }, 14,
      { damageType: 'heavy', breaksBlock: true, knockback: PX(5.4), hitstunMs: 360, stunMs: 160 })],
  }),
  mv({
    id: 'sword_thrust', weaponClass: 'sword', buttons: ['hand'], dirs: ['forward'],
    startupMs: 115, activeMs: 65, recoveryMs: 215, damage: 11, energyGain: 8,
    advance: PX(13), priority: 3,
    hitboxes: [hb(115, 180, { ox: 20, oy: -96, w: 92, h: 26 }, 11,
      { damageType: 'heavy', knockback: PX(5.0), hitstunMs: 330 })],
  }),
  mv({
    id: 'sword_lowsweep', weaponClass: 'sword', buttons: ['foot'], dirs: ['down'],
    startupMs: 135, activeMs: 70, recoveryMs: 275, damage: 9, energyGain: 8,
    stance: 'crouch', priority: 3,
    hitboxes: [hb(135, 205, { ox: 16, oy: -20, w: 88, h: 24 }, 9,
      { knockback: PX(3.6), liftup: PX(-2.6), hitstunMs: 310 })],
  }),
  mv({
    id: 'sword_crosscut', weaponClass: 'sword', buttons: ['hand', 'foot'], dirs: ['neutral'],
    startupMs: 145, activeMs: 80, recoveryMs: 255, damage: 13, energyGain: 10,
    advance: PX(8), priority: 5,
    hitboxes: [hb(145, 225, { ox: 16, oy: -96, w: 84, h: 44 }, 13,
      { damageType: 'heavy', knockback: PX(6.0), hitstunMs: 350, stunMs: 140 })],
  }),
  mv({
    id: 'sword_spincut', weaponClass: 'sword', buttons: ['foot', 'foot'], dirs: ['forward'],
    startupMs: 185, activeMs: 95, recoveryMs: 310, damage: 15, energyGain: 12,
    advance: PX(7), priority: 6,
    hitboxes: [hb(185, 280, { ox: 10, oy: -94, w: 92, h: 46 }, 15,
      { damageType: 'heavy', breaksBlock: true, knockback: PX(7.0), hitstunMs: 380, stunMs: 180, hitstopMs: 115 })],
  }),
  mv({
    id: 'sword_pommel', weaponClass: 'sword', buttons: ['hand'], dirs: ['back'],
    startupMs: 80, activeMs: 55, recoveryMs: 165, damage: 7, energyGain: 6,
    priority: 2,
    hitboxes: [hb(80, 135, { ox: 6, oy: -96, w: 48, h: 28 }, 7,
      { damageType: 'heavy', knockback: PX(5.2), hitstunMs: 300 })],
  }),
  mv({
    id: 'sword_jumpslash', weaponClass: 'sword', buttons: ['hand'], dirs: ['neutral', 'forward'],
    stance: 'air', startupMs: 105, activeMs: 105, recoveryMs: 215, damage: 12, energyGain: 9,
    priority: 4,
    hitboxes: [hb(105, 210, { ox: 16, oy: -80, w: 78, h: 40 }, 12,
      { damageType: 'heavy', knockback: PX(5.6), hitstunMs: 330 })],
  }),
  mv({
    id: 'sword_super', weaponClass: 'sword', buttons: ['hand', 'hand', 'foot'], dirs: ['forward'],
    startupMs: 200, activeMs: 300, recoveryMs: 450, damage: 32, energyGain: 0, energyCost: 100,
    isSuper: true, advance: PX(12), priority: 10, moveWeight: Math.round(0.55 * S) | 0,
    hitboxes: [
      hb(200, 300, { ox: 18, oy: -100, w: 88, h: 40 }, 11,
        { damageType: 'heavy', knockback: PX(5) }),
      hb(310, 400, { ox: 22, oy: -64, w: 92, h: 44 }, 11,
        { damageType: 'heavy', knockback: PX(5.5) }),
      hb(410, 500, { ox: 24, oy: -110, w: 96, h: 56 }, 10,
        { damageType: 'crit', breaksBlock: true, knockback: PX(9.8), liftup: PX(-4),
          hitstunMs: 540, stunMs: 440, hitstopMs: 190 }),
    ],
  }),

  // -------------------------------------------------------------------- axe
  mv({
    id: 'axe_chop', weaponClass: 'axe', buttons: ['hand'], dirs: ['neutral'],
    startupMs: 130, activeMs: 75, recoveryMs: 235, damage: 12, energyGain: 8,
    advance: PX(5), priority: 3,
    hitboxes: [hb(130, 205, { ox: 16, oy: -104, w: 72, h: 44 }, 12,
      { damageType: 'heavy', knockback: PX(5.6), hitstunMs: 330 })],
  }),
  mv({
    id: 'axe_horizontalswing', weaponClass: 'axe', buttons: ['hand'], dirs: ['forward'],
    startupMs: 155, activeMs: 85, recoveryMs: 275, damage: 14, energyGain: 10,
    advance: PX(8), priority: 4,
    hitboxes: [hb(155, 240, { ox: 18, oy: -92, w: 88, h: 40 }, 14,
      { damageType: 'heavy', knockback: PX(6.6), hitstunMs: 350, stunMs: 130 })],
  }),
  mv({
    id: 'axe_overheadchop', weaponClass: 'axe', buttons: ['hand'], dirs: ['down'],
    startupMs: 210, activeMs: 85, recoveryMs: 360, damage: 18, energyGain: 13,
    advance: PX(4), priority: 6,
    hitboxes: [hb(210, 295, { ox: 14, oy: -128, w: 62, h: 68 }, 18,
      { damageType: 'heavy', breaksBlock: true, knockback: PX(6.2), hitstunMs: 400, stunMs: 220, hitstopMs: 130 })],
  }),
  mv({
    id: 'axe_lowsplit', weaponClass: 'axe', buttons: ['foot'], dirs: ['down'],
    startupMs: 170, activeMs: 80, recoveryMs: 330, damage: 11, energyGain: 9,
    stance: 'crouch', priority: 4,
    hitboxes: [hb(170, 250, { ox: 16, oy: -22, w: 86, h: 26 }, 11,
      { knockback: PX(4.2), liftup: PX(-3.0), hitstunMs: 330 })],
  }),
  mv({
    id: 'axe_spinswing', weaponClass: 'axe', buttons: ['foot', 'foot'], dirs: ['forward'],
    startupMs: 225, activeMs: 105, recoveryMs: 395, damage: 17, energyGain: 14,
    advance: PX(6), priority: 7,
    hitboxes: [hb(225, 330, { ox: 10, oy: -96, w: 96, h: 52 }, 17,
      { damageType: 'heavy', breaksBlock: true, knockback: PX(7.6), hitstunMs: 400, stunMs: 200, hitstopMs: 140 })],
  }),
  mv({
    id: 'axe_buttstroke', weaponClass: 'axe', buttons: ['hand'], dirs: ['back'],
    startupMs: 95, activeMs: 60, recoveryMs: 195, damage: 8, energyGain: 6,
    priority: 2,
    hitboxes: [hb(95, 155, { ox: 6, oy: -96, w: 52, h: 30 }, 8,
      { damageType: 'heavy', knockback: PX(5.4), hitstunMs: 300 })],
  }),
  mv({
    id: 'axe_jumpchop', weaponClass: 'axe', buttons: ['hand'], dirs: ['neutral', 'forward'],
    stance: 'air', startupMs: 135, activeMs: 115, recoveryMs: 245, damage: 15, energyGain: 11,
    priority: 5,
    hitboxes: [hb(135, 250, { ox: 16, oy: -84, w: 76, h: 44 }, 15,
      { damageType: 'heavy', knockback: PX(6.4), hitstunMs: 350, stunMs: 140 })],
  }),
  mv({
    id: 'axe_combo1', weaponClass: 'axe', buttons: ['hand', 'hand'], dirs: ['neutral'],
    startupMs: 125, activeMs: 205, recoveryMs: 265, damage: 10, energyGain: 8,
    advance: PX(6), priority: 3,
    hitboxes: [
      hb(125, 195, { ox: 16, oy: -104, w: 72, h: 42 }, 10),
      hb(255, 330, { ox: 20, oy: -66, w: 78, h: 44 }, 10,
        { damageType: 'heavy', knockback: PX(6.0), hitstunMs: 340, stunMs: 120 }),
    ],
  }),
  mv({
    id: 'axe_super', weaponClass: 'axe', buttons: ['hand', 'hand', 'foot'], dirs: ['forward'],
    startupMs: 240, activeMs: 180, recoveryMs: 500, damage: 36, energyGain: 0, energyCost: 100,
    isSuper: true, advance: PX(10), priority: 10, moveWeight: Math.round(0.5 * S) | 0,
    hitboxes: [hb(240, 420, { ox: 12, oy: -116, w: 104, h: 72 }, 36,
      { damageType: 'crit', breaksBlock: true, knockback: PX(10.5), liftup: PX(-6),
        hitstunMs: 560, stunMs: 480, hitstopMs: 210 })],
  }),

  // ------------------------------------------------------------------ spear
  mv({
    id: 'spear_thrust', weaponClass: 'spear', buttons: ['hand'], dirs: ['neutral'],
    startupMs: 110, activeMs: 70, recoveryMs: 205, damage: 9, energyGain: 7,
    advance: PX(9), priority: 2,
    hitboxes: [hb(110, 180, { ox: 22, oy: -96, w: 118, h: 24 }, 9,
      { knockback: PX(4.6) })],
  }),
  mv({
    id: 'spear_longthrust', weaponClass: 'spear', buttons: ['hand'], dirs: ['forward'],
    startupMs: 145, activeMs: 75, recoveryMs: 265, damage: 12, energyGain: 9,
    advance: PX(16), priority: 4,
    hitboxes: [hb(145, 220, { ox: 24, oy: -96, w: 152, h: 24 }, 12,
      { damageType: 'heavy', knockback: PX(5.8), hitstunMs: 340 })],
  }),
  mv({
    id: 'spear_lowpoke', weaponClass: 'spear', buttons: ['foot'], dirs: ['down'],
    startupMs: 125, activeMs: 70, recoveryMs: 255, damage: 8, energyGain: 7,
    stance: 'crouch', priority: 3,
    hitboxes: [hb(125, 195, { ox: 20, oy: -22, w: 122, h: 22 }, 8,
      { knockback: PX(3.8), hitstunMs: 310 })],
  }),
  mv({
    id: 'spear_sweep', weaponClass: 'spear', buttons: ['foot'], dirs: ['neutral'],
    startupMs: 160, activeMs: 90, recoveryMs: 300, damage: 11, energyGain: 9,
    advance: PX(6), priority: 4,
    hitboxes: [hb(160, 250, { ox: 14, oy: -58, w: 126, h: 44 }, 11,
      { damageType: 'heavy', knockback: PX(6.2), liftup: PX(-3.2), hitstunMs: 340, stunMs: 130 })],
  }),
  mv({
    id: 'spear_leapstrike', weaponClass: 'spear', buttons: ['hand'], dirs: ['down'],
    startupMs: 150, activeMs: 90, recoveryMs: 320, damage: 13, energyGain: 10,
    advance: PX(12), priority: 5,
    hitboxes: [hb(150, 240, { ox: 20, oy: -110, w: 112, h: 52 }, 13,
      { damageType: 'heavy', breaksBlock: true, knockback: PX(5.4), hitstunMs: 360, stunMs: 160 })],
  }),
  mv({
    id: 'spear_spinthrust', weaponClass: 'spear', buttons: ['hand', 'hand'], dirs: ['forward'],
    startupMs: 170, activeMs: 175, recoveryMs: 310, damage: 13, energyGain: 10,
    advance: PX(14), priority: 5,
    hitboxes: [
      hb(170, 235, { ox: 22, oy: -96, w: 130, h: 26 }, 7),
      hb(275, 345, { ox: 24, oy: -94, w: 148, h: 26 }, 6,
        { damageType: 'heavy', knockback: PX(6.4), hitstunMs: 350, stunMs: 140 }),
    ],
  }),
  mv({
    id: 'spear_buttend', weaponClass: 'spear', buttons: ['hand'], dirs: ['back'],
    startupMs: 90, activeMs: 60, recoveryMs: 185, damage: 7, energyGain: 6,
    priority: 2,
    hitboxes: [hb(90, 150, { ox: 4, oy: -94, w: 46, h: 28 }, 7,
      { damageType: 'heavy', knockback: PX(5.0), hitstunMs: 300 })],
  }),
  mv({
    id: 'spear_combo1', weaponClass: 'spear', buttons: ['hand', 'hand'], dirs: ['neutral'],
    startupMs: 105, activeMs: 195, recoveryMs: 240, damage: 8, energyGain: 6,
    advance: PX(10), priority: 2,
    hitboxes: [
      hb(105, 170, { ox: 22, oy: -96, w: 118, h: 24 }, 8),
      hb(230, 300, { ox: 24, oy: -74, w: 124, h: 30 }, 8,
        { damageType: 'heavy', knockback: PX(5.2), hitstunMs: 330 }),
    ],
  }),
  mv({
    id: 'spear_super', weaponClass: 'spear', buttons: ['hand', 'hand', 'foot'], dirs: ['forward'],
    startupMs: 190, activeMs: 320, recoveryMs: 470, damage: 31, energyGain: 0, energyCost: 100,
    isSuper: true, advance: PX(18), priority: 10, moveWeight: Math.round(0.55 * S) | 0,
    hitboxes: [
      hb(190, 300, { ox: 24, oy: -96, w: 156, h: 26 }, 10,
        { damageType: 'heavy', knockback: PX(5) }),
      hb(310, 410, { ox: 26, oy: -94, w: 160, h: 28 }, 10,
        { damageType: 'heavy', knockback: PX(5.5) }),
      hb(420, 510, { ox: 28, oy: -92, w: 164, h: 30 }, 11,
        { damageType: 'crit', breaksBlock: true, knockback: PX(10), hitstunMs: 540, stunMs: 430, hitstopMs: 195 }),
    ],
  }),

  // --------------------------------------------------------------- nunchaku
  mv({
    id: 'nunchaku_swipe', weaponClass: 'nunchaku', buttons: ['hand'], dirs: ['neutral'],
    startupMs: 75, activeMs: 55, recoveryMs: 135, damage: 6, energyGain: 5,
    advance: PX(5), priority: 1,
    hitboxes: [hb(75, 130, { ox: 16, oy: -96, w: 66, h: 28 }, 6)],
  }),
  mv({
    id: 'nunchaku_dualswipe', weaponClass: 'nunchaku', buttons: ['hand', 'hand'], dirs: ['neutral'],
    startupMs: 70, activeMs: 170, recoveryMs: 170, damage: 5, energyGain: 5,
    advance: PX(6), priority: 1,
    hitboxes: [
      hb(70, 125, { ox: 16, oy: -96, w: 66, h: 26 }, 5),
      hb(185, 240, { ox: 18, oy: -64, w: 70, h: 30 }, 5),
    ],
  }),
  mv({
    id: 'nunchaku_lowpoke', weaponClass: 'nunchaku', buttons: ['foot'], dirs: ['down'],
    startupMs: 95, activeMs: 60, recoveryMs: 200, damage: 6, energyGain: 6,
    stance: 'crouch', priority: 2,
    hitboxes: [hb(95, 155, { ox: 16, oy: -20, w: 74, h: 22 }, 6,
      { knockback: PX(3.4), hitstunMs: 300 })],
  }),
  mv({
    id: 'nunchaku_overhead', weaponClass: 'nunchaku', buttons: ['hand'], dirs: ['down'],
    startupMs: 140, activeMs: 75, recoveryMs: 260, damage: 11, energyGain: 9,
    advance: PX(6), priority: 4,
    hitboxes: [hb(140, 215, { ox: 14, oy: -120, w: 58, h: 58 }, 11,
      { damageType: 'heavy', breaksBlock: true, knockback: PX(5.6), hitstunMs: 350, stunMs: 150 })],
  }),
  mv({
    id: 'nunchaku_lowsweep', weaponClass: 'nunchaku', buttons: ['foot'], dirs: ['neutral'],
    startupMs: 120, activeMs: 70, recoveryMs: 240, damage: 8, energyGain: 7,
    advance: PX(7), priority: 3,
    hitboxes: [hb(120, 190, { ox: 18, oy: -46, w: 78, h: 34 }, 8,
      { knockback: PX(4.2), liftup: PX(-2.2), hitstunMs: 310 })],
  }),
  mv({
    id: 'nunchaku_spinstrike', weaponClass: 'nunchaku', buttons: ['foot', 'foot'], dirs: ['forward'],
    startupMs: 150, activeMs: 85, recoveryMs: 285, damage: 12, energyGain: 10,
    advance: PX(8), priority: 5,
    hitboxes: [hb(150, 235, { ox: 12, oy: -92, w: 84, h: 44 }, 12,
      { damageType: 'heavy', knockback: PX(6.4), hitstunMs: 350, stunMs: 150, hitstopMs: 110 })],
  }),
  mv({
    id: 'nunchaku_airswipe', weaponClass: 'nunchaku', buttons: ['hand'], dirs: ['neutral', 'forward'],
    stance: 'air', startupMs: 90, activeMs: 95, recoveryMs: 195, damage: 9, energyGain: 7,
    priority: 3,
    hitboxes: [hb(90, 185, { ox: 14, oy: -74, w: 68, h: 34 }, 9,
      { knockback: PX(4.8), hitstunMs: 310 })],
  }),
  mv({
    id: 'nunchaku_combo1', weaponClass: 'nunchaku', buttons: ['hand', 'hand'], dirs: ['forward'],
    startupMs: 85, activeMs: 170, recoveryMs: 220, damage: 7, energyGain: 6,
    advance: PX(8), priority: 2,
    hitboxes: [
      hb(85, 140, { ox: 16, oy: -96, w: 68, h: 28 }, 7),
      hb(200, 255, { ox: 20, oy: -88, w: 72, h: 30 }, 7,
        { damageType: 'heavy', knockback: PX(5.0), hitstunMs: 330 }),
    ],
  }),
  mv({
    id: 'nunchaku_super', weaponClass: 'nunchaku', buttons: ['hand', 'hand', 'foot'], dirs: ['forward'],
    startupMs: 170, activeMs: 300, recoveryMs: 440, damage: 28, energyGain: 0, energyCost: 100,
    isSuper: true, advance: PX(12), priority: 10, moveWeight: Math.round(0.6 * S) | 0,
    hitboxes: [
      hb(170, 250, { ox: 16, oy: -98, w: 74, h: 30 }, 9,
        { damageType: 'heavy', knockback: PX(4) }),
      hb(260, 340, { ox: 18, oy: -60, w: 78, h: 34 }, 9,
        { damageType: 'heavy', knockback: PX(4.5) }),
      hb(350, 430, { ox: 20, oy: -104, w: 82, h: 44 }, 10,
        { damageType: 'crit', breaksBlock: true, knockback: PX(9), liftup: PX(-4),
          hitstunMs: 500, stunMs: 400, hitstopMs: 175 }),
    ],
  }),

  // -------------------------------------------------------------- universal
  mv({
    id: 'universal_throw', weaponClass: 'universal', buttons: ['hand', 'foot'], dirs: ['back'],
    startupMs: 130, activeMs: 70, recoveryMs: 380, damage: 16, energyGain: 12,
    priority: 9, moveWeight: Math.round(0.7 * S) | 0,
    hitboxes: [hb(130, 200, { ox: 8, oy: -96, w: 52, h: 44 }, 16,
      { damageType: 'crit', breaksBlock: true, knockback: PX(8.2), liftup: PX(-5.5),
        hitstunMs: 480, stunMs: 420, hitstopMs: 160 })],
  }),
  mv({
    id: 'universal_dashattack', weaponClass: 'universal', buttons: ['hand'], dirs: ['forward'],
    startupMs: 120, activeMs: 75, recoveryMs: 245, damage: 10, energyGain: 8,
    advance: PX(16), priority: 4,
    hitboxes: [hb(120, 195, { ox: 16, oy: -94, w: 70, h: 36 }, 10,
      { damageType: 'heavy', knockback: PX(6.8), hitstunMs: 340, stunMs: 130 })],
  }),
];

/** @type {Map<string, import('./types.js').MoveConfig>} */
export const MOVES_BY_ID = new Map(MOVES.map((m) => [m.id, m]));

/**
 * @param {string} id
 * @returns {import('./types.js').MoveConfig}
 * @throws {RangeError} when the move id is unknown
 */
export function getMove(id) {
  const m = MOVES_BY_ID.get(id);
  if (!m) throw new RangeError(`unknown move id: ${id}`);
  return m;
}

/**
 * Moves a fighter may use with a given weapon class.
 * @param {import('./types.js').WeaponClass} wc
 * @returns {import('./types.js').MoveConfig[]}
 */
export function movesForWeapon(wc) {
  return MOVES.filter((m) => m.weaponClass === wc || m.weaponClass === 'universal');
}
