/**
 * Hit resolution pipeline. Runs entirely on Q16.16 integers; writes only into
 * the FighterState objects passed in. No global state, randomness or clock.
 *
 * @module shared/sim/combat
 */

import { mul, div, add, clamp } from '../fp.js';
import { FP_SCALE, PX } from '../constants.js';
import { msToTicks } from './timing.js';
import { hitboxRect, hurtboxRect } from './collision.js';
import { intersects } from '../aabb.js';

/** Q16.16 share of HP dealt when the defender blocks (chip). */
const CHIP_FACTOR = PX(0.08);

/**
 * Active-phase check for a hitbox window.
 * @param {import('./types.js').HitboxTiming} h
 * @param {number} moveTick
 * @returns {boolean}
 */
export function windowActive(h, moveTick) {
  return moveTick >= h.startTick && moveTick < h.endTick;
}

/**
 * Effective weight of a fighter (config + armor + weapon), Q16.16.
 * @param {import('./types.js').FighterState} f
 * @returns {number}
 */
export function effectiveWeight(f) {
  return f.config.weight + f.armor.weight + f.weapon.weight;
}

/**
 * Resolve one active hitbox against the defender. Applies damage, chip,
 * stun/knockdown state and energy, and consumes the window on any touchable
 * contact. Returns a result record for the event log.
 *
 * @param {import('./types.js').FighterState} attacker
 * @param {import('./types.js').FighterState} defender
 * @param {import('./types.js').HitboxTiming} h
 * @param {import('./types.js').MoveTiming} timing
 * @param {import('./types.js').MoveState} moveState
 * @returns {import('./types.js').HitResult}
 */
export function resolveHit(attacker, defender, h, timing, moveState) {
  const w = h.window;
  const atk = hitboxRect(attacker, h);
  const hurt = hurtboxRect(defender);

  if (!intersects(atk, hurt)) {
    return whiff(timing);
  }
  if (isUntouchable(defender, timing.move)) {
    markConsumed(moveState, h);
    return { kind: 'invulnerable', damage: 0, blockDamage: 0, defenderEnergy: 0, attackerEnergy: 0, moveId: timing.move.id };
  }

  markConsumed(moveState, h);

  const blocking = defender.state === 'block' || defender.state === 'blockstun';
  const raw = damageAfterScaling(w.damage, attacker.weapon.damageMult, defender.armor.defense);

  const attackerEnergy = timing.move.energyGain;

  if (blocking && !w.breaksBlock) {
    const chip = Math.max(1, mul(raw, CHIP_FACTOR));
    defender.hp = Math.max(0, defender.hp - chip);
    defender.energy = clamp(defender.energy + Math.round(raw * 0.1), 0, defender.maxEnergy);
    attacker.energy = clamp(attacker.energy + attackerEnergy, 0, attacker.maxEnergy);
    enterBlockstun(defender, msToTicks(w.blockstunMs));
    return { kind: 'block', damage: chip, blockDamage: chip, defenderEnergy: Math.round(raw * 0.1), attackerEnergy, moveId: timing.move.id };
  }

  // clean hit
  defender.hp = Math.max(0, defender.hp - raw);
  defender.energy = clamp(defender.energy + 0, 0, defender.maxEnergy);
  attacker.energy = clamp(attacker.energy + attackerEnergy, 0, attacker.maxEnergy);

  if (w.liftup < 0 || defender.hp <= 0) {
    // launch or KO -> knockdown
    enterKnockdown(defender, msToTicks(w.hitstunMs + 220), w.liftup < 0 ? w.liftup : PX(4.5), attacker);
    return { kind: 'knockdown', damage: raw, blockDamage: 0, defenderEnergy: 0, attackerEnergy, moveId: timing.move.id };
  }

  applyKnockback(defender, w.knockback, attacker);
  enterHitstun(defender, msToTicks(w.hitstunMs));
  return { kind: 'hit', damage: raw, blockDamage: 0, defenderEnergy: 0, attackerEnergy, moveId: timing.move.id };
}

/**
 * Mark a hitbox window as spent in the owning move's identity-local flags.
 * @param {import('./types.js').MoveState} moveState
 * @param {import('./types.js').HitboxTiming} h
 */
function markConsumed(moveState, h) {
  const idx = moveState.timing.hitboxes.indexOf(h);
  if (idx >= 0) moveState.consumed[idx] = true;
}

/**
 * @param {import('./types.js').MoveTiming} timing
 * @returns {import('./types.js').HitResult}
 */
function whiff(timing) {
  return { kind: 'whiff', damage: 0, blockDamage: 0, defenderEnergy: 0, attackerEnergy: 0, moveId: timing.move.id };
}

/**
 * A defender a move cannot grab.
 * @param {import('./types.js').FighterState} defender
 * @param {import('../config/types.js').MoveConfig} move
 * @returns {boolean}
 */
export function isUntouchable(defender, move) {
  if (defender.hp <= 0 || defender.state === 'dead') return true;
  if (defender.state === 'grabbed') return true;
  if (defender.state === 'knockdown') return true;
  void move;
  return false;
}

/**
 * Scale base damage by weapon and armor multipliers.
 * @param {number} base integer HP base
 * @param {number} weaponMult Q16.16
 * @param {number} armorDefense Q16.16 in [0, 1)
 * @returns {number} integer HP damage, minimum 1
 */
export function damageAfterScaling(base, weaponMult, armorDefense) {
  const afterWeapon = Math.floor((base * weaponMult) / FP_SCALE);
  const afterArmor = Math.floor((afterWeapon * Math.max(0, FP_SCALE - armorDefense)) / FP_SCALE);
  return Math.max(1, afterArmor);
}

/**
 * Apply horizontal knockback scaled by the defender's resist.
 * @param {import('./types.js').FighterState} defender
 * @param {number} knockbackFp
 * @param {import('./types.js').FighterState} attacker
 */
export function applyKnockback(defender, knockbackFp, attacker) {
  const share = knockbackShare(knockbackFp, attacker, defender);
  const dir = attacker.facing > 0 ? 1 : -1;
  defender.vx = add(defender.vx, dir * share);
}

/**
 * Knockback the defender travels is proportional to the attacker's weight
 * share: a heavier attacker pushes further, a heavier defender resists.
 * @param {number} knockbackFp
 * @param {import('./types.js').FighterState} attacker
 * @param {import('./types.js').FighterState} defender
 * @returns {number}
 */
export function knockbackShare(knockbackFp, attacker, defender) {
  const attW = effectiveWeight(attacker);
  const defW = effectiveWeight(defender);
  const total = attW + defW;
  if (total <= 0) return knockbackFp;
  return mul(knockbackFp, div(attW, total));
}

/**
 * Move a defender into hitstun.
 * @param {import('./types.js').FighterState} d
 * @param {number} ticks
 */
export function enterHitstun(d, ticks) {
  d.prevState = d.state;
  d.prevStateTicks = d.stateTicks;
  d.state = 'hitstun';
  d.stateTicks = 0;
  d.stunTicks = ticks;
  d.blockedHurtbox = false;
}

/**
 * Move a defender into blockstun.
 * @param {import('./types.js').FighterState} d
 * @param {number} ticks
 */
export function enterBlockstun(d, ticks) {
  d.prevState = d.state;
  d.prevStateTicks = d.stateTicks;
  d.state = 'blockstun';
  d.stateTicks = 0;
  d.stunTicks = ticks;
  d.blockedHurtbox = false;
}

/**
 * Launch the defender into a knockdown.
 * @param {import('./types.js').FighterState} d
 * @param {number} ticks
 * @param {number} liftupFp  Q16.16 upward velocity
 * @param {import('./types.js').FighterState} attacker
 */
export function enterKnockdown(d, ticks, liftupFp, attacker) {
  d.prevState = d.state;
  d.prevStateTicks = d.stateTicks;
  d.state = 'knockdown';
  d.stateTicks = 0;
  d.victimTicksRemaining = ticks;
  // lift off the ground: internal vy is positive up, config liftup is negative up
  d.vy = liftupFp !== 0 ? -liftupFp : PX(4);
  d.blockedHurtbox = false;
  // horizontal toss courtesy of the attacker's facing
  const share = knockbackShare(PX(3.5), attacker, d);
  const dir = attacker.facing > 0 ? 1 : -1;
  d.vx = add(d.vx, dir * share);
}

export { mul, add, clamp };