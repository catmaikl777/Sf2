import { describe, it, expect } from 'vitest';
import { rect, intersects, contains, overlapArea, offset, mirrorX } from '../src/aabb.js';

describe('aabb helpers', () => {
  it('detects overlapping boxes', () => {
    const a = rect(0, 0, 10, 10);
    const b = rect(5, 5, 10, 10);
    expect(intersects(a, b)).toBe(true);
    expect(intersects(b, a)).toBe(true);
  });

  it('rejects disjoint boxes', () => {
    const a = rect(0, 0, 10, 10);
    const b = rect(20, 0, 10, 10);
    expect(intersects(a, b)).toBe(false);
  });

  it('treats touching edges as a miss (strict comparison)', () => {
    const a = rect(0, 0, 10, 10);
    const b = rect(10, 0, 10, 10);
    expect(intersects(a, b)).toBe(false);
  });

  it('ignores zero-sized boxes', () => {
    expect(intersects(rect(0, 0, 0, 10), rect(0, 0, 10, 10))).toBe(false);
    expect(intersects(rect(0, 0, 10, 10), rect(0, 0, 10, 0))).toBe(false);
  });

  it('checks containment', () => {
    expect(contains(rect(2, 2, 4, 4), rect(0, 0, 10, 10))).toBe(true);
    expect(contains(rect(0, 0, 20, 10), rect(0, 0, 10, 10))).toBe(false);
  });

  it('computes overlap area', () => {
    expect(overlapArea(rect(0, 0, 10, 10), rect(5, 5, 10, 10))).toBe(25);
    expect(overlapArea(rect(0, 0, 10, 10), rect(30, 30, 5, 5))).toBe(0);
  });

  it('offsets boxes', () => {
    const r = offset(rect(1, 2, 3, 4), 10, 20);
    expect(r).toEqual({ x: 11, y: 22, w: 3, h: 4 });
  });

  it('mirrors boxes around a pivot', () => {
    const r = rect(10, 0, 4, 8);
    const m = mirrorX(r, 0);
    expect(m).toEqual({ x: -14, y: 0, w: 4, h: 8 });
    const back = mirrorX(m, 0);
    expect(back).toEqual(r);
  });
});
