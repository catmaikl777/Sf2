/**
 * Combat geometry: converts the fighter-origin-relative hitbox windows into
 * world-space AABBs and performs the hurtbox intersection checks. Pure
 * integer AABB math from shared/aabb; Phaser physics is not involved.
 *
 * @module shared/sim/collision
 */

import { rect, intersects } from '../aabb.js';
import { add } from '../fp.js';

/**
 * Build the world-space rect of an active hitbox window for a fighter.
 * Hitbox offsets are relative to the feet-center origin, X positive in the
 * facing direction; the box is mirrored for a left-facing fighter.
 *
 * @param {import('./types.js').FighterState} f
 * @param {import('./types.js').HitboxTiming} h
 * @returns {ReturnType<typeof rect>}
 */
export function hitboxRect(f, h) {
  const w = h.window;
  const originX = f.x;
  const originY = f.y;
  const localX = f.facing > 0 ? w.ox : -w.ox - w.w;
  const x = add(originX, localX);
  // window.oy is screen-style (negative up, relative to feet); the sim tracks
  // Y positive-up (height above ground), so the box bottom sits at -oy.
  const y = add(originY, -w.oy - w.h);
  return rect(x, y, w.w, w.h);
}

/**
 * World-space hurtbox of a fighter. Hurtboxes shrink slightly while blocking
 * so attacks that would have touched the extended limb now whiff.
 * @param {import('./types.js').FighterState} f
 * @returns {ReturnType<typeof rect>}
 */
export function hurtboxRect(f) {
  const w = f.blockedHurtbox ? mulInt(f.hurtRectW, 3, 4) : f.hurtRectW;
  const h = f.blockedHurtbox ? mulInt(f.hurtRectH, 3, 4) : f.hurtRectH;
  const x = add(f.x, -shr(w, 1));
  const y = f.y;
  return rect(x, y, w, h);
}

/**
 * @param {number} a
 * @param {number} n
 * @param {number} d
 * @returns {number}
 */
function mulInt(a, n, d) {
  return Math.floor((a * n) / d) | 0;
}

/**
 * @param {number} v
 * @param {number} s
 * @returns {number}
 */
function shr(v, s) {
  return (v / Math.pow(2, s)) | 0;
}

/**
 * Does an active hitbox touch the defender's hurtbox this tick?
 * @param {import('./types.js').FighterState} attacker
 * @param {import('./types.js').FighterState} defender
 * @param {import('./types.js').HitboxTiming} h
 * @returns {boolean}
 */
export function hitboxHits(attacker, defender, h) {
  return intersects(hitboxRect(attacker, h), hurtboxRect(defender));
}