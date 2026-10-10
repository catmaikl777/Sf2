import { describe, it, expect } from 'vitest';
import { createRng } from '../src/rng.js';

describe('deterministic rng', () => {
  it('produces identical sequences for identical seeds', () => {
    const a = createRng(12345);
    const b = createRng(12345);
    const seqA = Array.from({ length: 64 }, () => a.next());
    const seqB = Array.from({ length: 64 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    const a = createRng(1);
    const b = createRng(2);
    const seqA = Array.from({ length: 16 }, () => a.next());
    const seqB = Array.from({ length: 16 }, () => b.next());
    expect(seqA).not.toEqual(seqB);
  });

  it('stays within [0, 1)', () => {
    const r = createRng(99);
    for (let i = 0; i < 1000; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('int() covers inclusive bounds', () => {
    const r = createRng(7);
    const seen = new Set();
    for (let i = 0; i < 500; i++) {
      const v = r.int(2, 5);
      expect(v).toBeGreaterThanOrEqual(2);
      expect(v).toBeLessThanOrEqual(5);
      seen.add(v);
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('pick() returns members of the array', () => {
    const r = createRng(11);
    const arr = ['a', 'b', 'c'];
    for (let i = 0; i < 100; i++) {
      expect(arr).toContain(r.pick(arr));
    }
  });

  it('chance() honours probability at the extremes', () => {
    const r = createRng(5);
    expect(r.chance(1)).toBe(true);
    expect(r.chance(0)).toBe(false);
  });

  it('state()/setState() round-trips a sequence', () => {
    const r = createRng(2024);
    r.next();
    r.next();
    const saved = r.state();
    const expected = Array.from({ length: 8 }, () => r.next());
    r.setState(saved);
    const replayed = Array.from({ length: 8 }, () => r.next());
    expect(replayed).toEqual(expected);
  });
});
