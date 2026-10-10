import { describe, it, expect } from 'vitest';
import { fp, toFloat, mul, div, add, sub, abs, sign, clamp, sqrt, lerp, hDir } from '../src/fp.js';
import { FP_SCALE } from '../src/constants.js';

describe('fp fixed-point arithmetic', () => {
  it('converts between float and Q16.16 exactly for representable values', () => {
    expect(fp(1)).toBe(FP_SCALE);
    expect(fp(0.5)).toBe(FP_SCALE / 2);
    expect(fp(-2)).toBe(-2 * FP_SCALE);
    expect(toFloat(fp(3.25))).toBeCloseTo(3.25, 10);
  });

  it('multiplies in fixed point', () => {
    expect(mul(fp(2), fp(3))).toBe(fp(6));
    expect(mul(fp(0.5), fp(0.5))).toBe(fp(0.25));
    expect(mul(fp(-2), fp(3))).toBe(fp(-6));
    expect(mul(fp(1.5), fp(4))).toBe(fp(6));
  });

  it('divides in fixed point', () => {
    expect(div(fp(6), fp(3))).toBe(fp(2));
    expect(div(fp(1), fp(4))).toBe(fp(0.25));
    expect(div(fp(-6), fp(3))).toBe(fp(-2));
  });

  it('throws on division by zero', () => {
    expect(() => div(fp(1), 0)).toThrow(RangeError);
  });

  it('saturates addition instead of wrapping', () => {
    expect(add(0x7fffffff, FP_SCALE)).toBe(0x7fffffff);
    expect(add(-0x80000000, -FP_SCALE)).toBe(-0x80000000);
    expect(add(fp(1), fp(2))).toBe(fp(3));
    expect(sub(fp(5), fp(3))).toBe(fp(2));
  });

  it('computes abs and sign', () => {
    expect(abs(fp(-3))).toBe(fp(3));
    expect(abs(fp(3))).toBe(fp(3));
    expect(sign(fp(-1))).toBe(-1);
    expect(sign(fp(0))).toBe(0);
    expect(sign(fp(1))).toBe(1);
  });

  it('clamps values', () => {
    expect(clamp(fp(5), fp(1), fp(3))).toBe(fp(3));
    expect(clamp(fp(0), fp(1), fp(3))).toBe(fp(1));
    expect(clamp(fp(2), fp(1), fp(3))).toBe(fp(2));
  });

  it('square-roots in fixed point', () => {
    expect(sqrt(fp(4))).toBe(fp(2));
    expect(sqrt(fp(1))).toBe(fp(1));
    expect(sqrt(fp(0.25))).toBe(fp(0.5));
    expect(sqrt(0)).toBe(0);
    expect(sqrt(fp(-1))).toBe(0);
    // large value path (int32 overflow branch)
    const big = fp(4000);
    expect(toFloat(sqrt(big))).toBeCloseTo(63.24, 1);
  });

  it('interpolates linearly', () => {
    expect(lerp(fp(0), fp(10), fp(0.5))).toBe(fp(5));
    expect(lerp(fp(10), fp(20), fp(0))).toBe(fp(10));
    expect(lerp(fp(10), fp(20), fp(1))).toBe(fp(20));
  });

  it('buckets horizontal direction with a deadzone', () => {
    const dz = fp(0.5);
    expect(hDir(fp(-1), dz)).toBe('left');
    expect(hDir(fp(1), dz)).toBe('right');
    expect(hDir(fp(0.1), dz)).toBe('center');
    expect(hDir(fp(-0.6), dz)).toBe('left');
  });
});
