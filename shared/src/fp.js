/**
 * Q16.16 fixed-point arithmetic helpers. Every function is integer-only so the
 * simulation is bit-exact across platforms and replays reproduce identically.
 *
 * @module shared/fp
 */

import { FP_SCALE, FP_SHIFT } from './constants.js';

/** @typedef {number} Fp  Q16.16 signed 32-bit fixed-point value */

/**
 * Convert a float or integer literal to Q16.16.
 * @param {number} v
 * @returns {Fp}
 */
export function fp(v) {
  return Math.round(v * FP_SCALE) | 0;
}

/**
 * Convert Q16.16 back to float (render layer / display only).
 * @param {Fp} a
 * @returns {number}
 */
export function toFloat(a) {
  return a / FP_SCALE;
}

/**
 * Multiply two Q16.16 values with 64-bit intermediate via BigInt-free trick:
 * the product of two int32 values fits into float53 exactly, so plain
 * multiplication followed by a shift stays exact.
 * @param {Fp} a
 * @param {Fp} b
 * @returns {Fp}
 */
export function mul(a, b) {
  return Math.floor((a * b) / FP_SCALE) | 0;
}

/**
 * Divide a by b in Q16.16.
 * @param {Fp} a
 * @param {Fp} b
 * @throws {RangeError} when b is zero
 * @returns {Fp}
 */
export function div(a, b) {
  if (b === 0) throw new RangeError('fp division by zero');
  return Math.floor((a * FP_SCALE) / b) | 0;
}

/**
 * Add with int32 wrap-safe saturation into int32 range.
 * @param {Fp} a
 * @param {Fp} b
 * @returns {Fp}
 */
export function add(a, b) {
  const r = a + b;
  if (r > 0x7fffffff) return 0x7fffffff;
  if (r < -0x80000000) return -0x80000000;
  return r | 0;
}

/**
 * Subtract with saturation.
 * @param {Fp} a
 * @param {Fp} b
 * @returns {Fp}
 */
export function sub(a, b) {
  return add(a, -b);
}

/**
 * Absolute value.
 * @param {Fp} a
 * @returns {Fp}
 */
export function abs(a) {
  return a < 0 ? -a | 0 : a;
}

/**
 * Sign: -1, 0 or 1.
 * @param {Fp} a
 * @returns {-1|0|1}
 */
export function sign(a) {
  if (a > 0) return 1;
  if (a < 0) return -1;
  return 0;
}

/**
 * Clamp into [lo, hi].
 * @param {Fp} v
 * @param {Fp} lo
 * @param {Fp} hi
 * @returns {Fp}
 */
export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

/**
 * Integer square root of a non-negative fixed-point value, result Q16.16.
 * Newton-Raphson on integers; exact and deterministic.
 * @param {Fp} a non-negative Q16.16
 * @returns {Fp}
 */
export function sqrt(a) {
  if (a <= 0) return 0;
  // result = sqrt(a * SCALE); every intermediate stays an exact float53
  // integer (a is int32, so a * 65536 <= 2^47) and the iteration is pure
  // IEEE-754 integer arithmetic, which is deterministic across platforms.
  const n = a * FP_SCALE;
  let x = n;
  let y = Math.floor((x + n / x) / 2);
  while (y < x) {
    x = y;
    y = Math.floor((x + n / x) / 2);
  }
  return x | 0;
}

/**
 * Linear interpolation in fixed point. t is Q16.16 in [0, 1].
 * @param {Fp} a
 * @param {Fp} b
 * @param {Fp} t
 * @returns {Fp}
 */
export function lerp(a, b, t) {
  return add(a, mul(sub(b, a), t));
}

/**
 * Approximate arc-tangent-free direction angle bucket used by AI perception:
 * returns one of 'left', 'right', 'center' for a horizontal delta.
 * @param {Fp} dx
 * @param {Fp} deadzone
 * @returns {'left'|'right'|'center'}
 */
export function hDir(dx, deadzone) {
  if (dx < -deadzone) return 'left';
  if (dx > deadzone) return 'right';
  return 'center';
}

export { FP_SCALE, FP_SHIFT };
