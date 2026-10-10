/**
 * Deterministic seeded PRNG (mulberry32). The simulation and the AI both draw
 * random numbers exclusively from instances of this generator so replays are
 * bit-exact.
 *
 * @module shared/rng
 */

/**
 * @typedef {Object} Rng
 * @property {() => number} next        float in [0, 1)
 * @property {(min: number, max: number) => number} int  int in [min, max]
 * @property {(arr: readonly any[]) => any} pick
 * @property {(p: number) => boolean} chance  p is float in [0, 1]
 * @property {() => number} state       current internal state (for replay)
 * @property {(s: number) => void} setState
 */

/**
 * Create a deterministic generator.
 * @param {number} seed 32-bit unsigned seed
 * @returns {Rng}
 */
export function createRng(seed = 1) {
  let s = seed >>> 0;
  const state = () => s >>> 0;
  const setState = (/** @type {number} */ v) => {
    s = v >>> 0;
  };
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (/** @type {number} */ min, /** @type {number} */ max) => min + Math.floor(next() * (max - min + 1));
  const pick = (/** @type {readonly any[]} */ arr) => arr[int(0, arr.length - 1)];
  const chance = (/** @type {number} */ p) => next() < p;
  return { next, int, pick, chance, state, setState };
}
