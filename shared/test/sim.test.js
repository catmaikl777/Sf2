import { describe, it, expect } from 'vitest';
import { createSim } from '../src/sim/sim.js';
import { createGameConfig, getStage } from '../src/config/index.js';
import { BTN, PX } from '../src/constants.js';
import { toFloat } from '../src/fp.js';

/**
 * Sprint 2 acceptance: the battle simulation is deterministic, framerate
 * independent and uses pure BTN bitmask input frames. Identical input streams
 * yield bit-identical state and events.
 */

const defaultPair = {
  p0: { fighterId: 'shadow', weaponId: 'w_unarmed', armorId: 'a_cloth' },
  p1: { fighterId: 'hermit', weaponId: 'w_unarmed', armorId: 'a_cloth' },
};

/** @typedef {ReturnType<typeof makeSim>} Sim */

/**
 * @param {*} cfg
 * @param {*} pair
 * @returns {import('../src/sim/sim.js').Sim}
 */
function makeSim(cfg = createGameConfig(), pair = defaultPair) {
  return createSim(cfg, pair);
}

/** @param {import('../src/sim/sim.js').Sim} sim @param {number} maxTicks */
function approach(sim, maxTicks = 400) {
  let prev = sim.p0.x;
  for (let i = 0; i < maxTicks; i++) {
    const p0Dir = sim.p0.x < sim.p1.x ? BTN.RIGHT : BTN.LEFT;
    const p1Dir = sim.p1.x < sim.p0.x ? BTN.RIGHT : BTN.LEFT;
    sim.step({ buttons: p0Dir }, { buttons: p1Dir });
    if (sim.p0.x === prev && sim.p1.x === sim.p1.x && i > 60) break;
    prev = sim.p0.x;
  }
}

/** Neutral step repeated n times, returning the collected events.
 * @param {import('../src/sim/sim.js').Sim} sim
 * @param {number} n
 * @param {number} p0
 * @param {number} p1
 */
function tick(sim, n, p0 = BTN.NONE, p1 = BTN.NONE) {
  const ev = [];
  for (let i = 0; i < n; i++) ev.push(...sim.step({ buttons: p0 }, { buttons: p1 }));
  return ev;
}

/** Advance a fresh sim through the intro and return to a standing target.
 * @param {import('../src/sim/sim.js').Sim} sim
 */
function readyFighters(sim) {
  tick(sim, 110); // intro ticks until phase === 'fighting'
  approach(sim);
  expect(sim.round.phase).toBe('fighting');
}

describe('sim determinism', () => {
  it('produces bit-identical state and events from the same input stream', () => {
    const cfg = createGameConfig();
    const a = makeSim(cfg);
    const b = makeSim(cfg);
    const evA = [];
    const evB = [];
    for (let i = 0; i < 400; i++) {
      const btn = i % 17 === 0 ? BTN.HAND : i % 23 === 0 ? BTN.FOOT : i % 5 === 0 ? BTN.DOWN : BTN.NONE;
      evA.push(...a.step({ buttons: btn }, { buttons: btn }));
      evB.push(...b.step({ buttons: btn }, { buttons: btn }));
    }
    expect(a.p0.x).toBe(b.p0.x);
    expect(a.p1.x).toBe(b.p1.x);
    expect(a.p0.hp).toBe(b.p0.hp);
    expect(a.p1.hp).toBe(b.p1.hp);
    expect(a.p0.state).toBe(b.p0.state);
    expect(a.p1.state).toBe(b.p1.state);
    expect(a.round.phase).toBe(b.round.phase);
    expect(JSON.stringify(evA)).toBe(JSON.stringify(evB));
  });

  it('replay events are stable across separate sims', () => {
    const seq = [
      { buttons: BTN.RIGHT },
      { buttons: BTN.HAND },
      { buttons: BTN.NONE },
      { buttons: BTN.HAND },
      { buttons: BTN.LEFT },
      { buttons: BTN.NONE },
    ];
    const a = makeSim();
    const b = makeSim();
    const evA = [];
    const evB = [];
    for (let i = 0; i < 200; i++) {
      const f = /** @type {{buttons:number}} */ (seq[i % seq.length]);
      evA.push(...a.step(f, { buttons: BTN.NONE }));
      evB.push(...b.step(f, { buttons: BTN.NONE }));
    }
    expect(evA.length).toBe(evB.length);
    for (let i = 0; i < evA.length; i++) {
      /** @type {import('../src/sim/sim.js').SimEvent} */
      const ea = /** @type {*} */ (evA[i]);
      /** @type {import('../src/sim/sim.js').SimEvent} */
      const eb = /** @type {*} */ (evB[i]);
      expect(ea.tick).toBe(eb.tick);
      expect(ea.type).toBe(eb.type);
    }
  });
});

describe('movement', () => {
  it('walks forward and collides softly without overlapping', () => {
    const sim = makeSim();
    tick(sim, 110);
    const x0 = sim.p0.x;
    const x1 = sim.p1.x;
    approach(sim);
    expect(sim.p0.x).toBeGreaterThan(x0);
    expect(sim.p1.x).toBeLessThan(x1);
    const gap = toFloat(sim.p1.x) - toFloat(sim.p0.x);
    const minNeeded = (toFloat(sim.p0.hurtRectW) + toFloat(sim.p1.hurtRectW)) / 2;
    expect(gap).toBeGreaterThanOrEqual(minNeeded - 1);
  });

  it('clamps to the stage walls', () => {
    const sim = makeSim();
    tick(sim, 110);
    // p0 pushes toward the right wall (facing p1 to the right)
    for (let i = 0; i < 800; i++) sim.step({ buttons: BTN.RIGHT }, { buttons: BTN.NONE });
    const rightLimit = toFloat(sim.stage.rightPx) - toFloat(sim.p0.hurtRectW) / 2;
    // p1 got cornered and clamps just short of p0; the far wall bound holds
    expect(toFloat(sim.p0.x)).toBeLessThanOrEqual(rightLimit);
    expect(toFloat(sim.p0.x)).toBeGreaterThan(rightLimit - 48);
    // walk p0 back to the left wall unopposed
    for (let i = 0; i < 2000; i++) sim.step({ buttons: BTN.LEFT }, { buttons: BTN.NONE });
    const leftLimit = toFloat(sim.stage.leftPx) + toFloat(sim.p0.hurtRectW) / 2;
    expect(toFloat(sim.p0.x)).toBeGreaterThanOrEqual(leftLimit - 1);
    expect(toFloat(sim.p0.x)).toBeLessThan(leftLimit + 48);
  });
});

describe('round flow', () => {
  it('runs intro -> fighting -> outro', () => {
    const sim = makeSim();
    expect(sim.round.phase).toBe('intro');
    tick(sim, 108);
    expect(sim.round.phase).toBe('fighting');
  });

  it('ends a round by KO and awards the round to the winner', () => {
    const sim = makeSim();
    tick(sim, 110);
    approach(sim);
    sim.p1.hp = 1; // prime the KO
    const ev = [];
    ev.push(...sim.step({ buttons: BTN.HAND }, { buttons: BTN.NONE }));
    for (let i = 0; i < 8; i++) ev.push(...sim.step({ buttons: BTN.NONE }, { buttons: BTN.NONE }));
    const roundEv = ev.find((e) => e.type === 'round' && e.data.reason === 'ko');
    expect(sim.p1.hp).toBe(0);
    expect(roundEv).toBeTruthy();
    /** @type {import('../src/sim/sim.js').SimEvent} */ (/** @type {*} */ (roundEv));
    expect(/** @type {import('../src/sim/sim.js').SimEvent} */ (/** @type {*} */ (roundEv)).data.winner).toBe(0);
    expect(sim.round.p0Rounds).toBe(1);
    expect(sim.round.phase).toBe('outro');
  });

  it('resolves a timeout by remaining HP share', () => {
    const cfg = createGameConfig();
    cfg.rounds.roundTimeSec = 1; // shorten the test
    const sim = makeSim(cfg);
    tick(sim, 10);
    sim.p0.hp = 40; // p0 wounded
    // intro (108) + 1s fighting -> timeout
    tick(sim, 108 + 60 + 10);
    expect(sim.round.endReason).toBe('timeout');
    // p1 has the larger HP share -> winner 1
    expect(sim.round.winner).toBe(1);
    expect(sim.round.p1Rounds).toBe(1);
  });

  it('escalates to match end when roundsToWin is reached', () => {
    const cfg = createGameConfig();
    cfg.rounds.roundsToWin = 1;
    const sim = makeSim(cfg);
    tick(sim, 110);
    approach(sim);
    sim.p1.hp = 1;
    sim.step({ buttons: BTN.HAND }, { buttons: BTN.NONE });
    for (let i = 0; i < 8; i++) sim.step({ buttons: BTN.NONE }, { buttons: BTN.NONE });
    expect(sim.round.matchWinner).toBe(0);
    expect(sim.round.phase).toBe('outro');
    // outroMs -> matchEnd
    tick(sim, 200, BTN.NONE, BTN.NONE);
    expect(sim.round.phase).toBe('matchEnd');
  });
});

describe('combat', () => {
  it('clean hand lands, reduces HP, awards energy and stuns the target', () => {
    const sim = makeSim();
    readyFighters(sim);
    const hpBefore = sim.p1.hp;
    const ev = [];
    ev.push(...sim.step({ buttons: BTN.HAND }, { buttons: BTN.NONE }));
    ev.push(...tick(sim, 10));
    const hit = ev.find((e) => e.type === 'hit' && e.data.kind === 'hit');
    expect(sim.p1.hp).toBeLessThan(hpBefore);
    expect(hit).toBeTruthy();
    expect(/** @type {import('../src/sim/sim.js').SimEvent} */ (/** @type {*} */ (hit)).data.kind).toBe('hit');
    expect(sim.p0.energy).toBeGreaterThanOrEqual(5);
    expect(sim.p1.state).toBe('hitstun');
  });

  it('a blocked hand deals chip damage and stuns the blocker in blockstun', () => {
    const sim = makeSim();
    readyFighters(sim);
    // defender holds block so the next hand press lands on the guard
    const ev = [];
    ev.push(...tick(sim, 2, BTN.NONE, BTN.BLOCK));
    const hpBefore = sim.p1.hp;
    ev.push(...sim.step({ buttons: BTN.HAND }, { buttons: BTN.BLOCK }));
    ev.push(...tick(sim, 10, BTN.NONE, BTN.BLOCK));
    const hit = ev.find((e) => e.type === 'hit' && e.data.kind === 'block');
    expect(hit).toBeTruthy();
    expect(sim.p1.hp).toBeLessThan(hpBefore);
    expect(sim.p1.hp).toBe(hpBefore - 1); // 8% chip, min 1
    expect(sim.p1.state).toBe('blockstun');
    expect(sim.p1.energy).toBeGreaterThan(0);
  });

  it('a launching hit sends the defender into knockdown', () => {
    const sim = makeSim();
    readyFighters(sim);
    const ev = sim.step({ buttons: BTN.DOWN | BTN.HAND }, { buttons: BTN.NONE });
    const upp = ev.find((e) => e.type === 'move' && e.data.moveId === 'unarmed_uppercut');
    expect(upp).toBeTruthy();
    const events = [];
    for (let i = 0; i < 12; i++) events.push(...sim.step({ buttons: BTN.NONE }, { buttons: BTN.NONE }));
    const kd = events.find((e) => e.type === 'hit' && e.data.kind === 'knockdown');
    expect(kd).toBeTruthy();
    expect(sim.p1.state).toBe('knockdown');
    expect(sim.p1.victimTicksRemaining).toBeGreaterThan(0);
    expect(sim.p1.y).toBeGreaterThan(0);
  });

  it('recovers from hitstun back to a controllable state', () => {
    const sim = makeSim();
    readyFighters(sim);
    sim.step({ buttons: BTN.HAND }, { buttons: BTN.NONE });
    tick(sim, 8);
    expect(sim.p1.state).toBe('hitstun');
    // hitstun 260ms = 16 ticks
    tick(sim, 20);
    expect(sim.p1.state).toBe('idle');
  });
});

describe('queueMove and staging', () => {
  it('queueMove refuses a move while attacking', () => {
    const sim = makeSim();
    readyFighters(sim);
    const ok = sim.queueMove(0, 'unarmed_jab');
    expect(ok).toBe(true);
    expect(sim.p0.state).toBe('attack');
    const again = sim.queueMove(0, 'unarmed_jab');
    expect(again).toBe(false);
  });

  it('stages fighters into formation at spawn', () => {
    const cfg = createGameConfig();
    const sim = makeSim(cfg);
    expect(sim.p0.facing).toBe(1);
    expect(sim.p1.facing).toBe(-1);
    expect(toFloat(sim.p0.x)).toBeLessThan(toFloat(sim.p1.x));
  });
});

describe('sim scaffolding', () => {
  it('exposes p0/p1/stage/tick helpers', () => {
    const sim = makeSim();
    tick(sim, 5);
    expect(typeof sim.positionX).toBe('function');
    expect(typeof sim.hp).toBe('function');
    expect(sim.hp(0)).toBe(sim.p0.hp);
    expect(sim.positionX(1)).toBe(sim.p1.x);
    expect(typeof sim.stage.rightPx).toBe('number');
    expect(sim.tick).toBe(5);
  });

  it('throws away hitboxes once consumed', () => {
    const sim = makeSim();
    readyFighters(sim);
    sim.step({ buttons: BTN.HAND }, { buttons: BTN.NONE });
    // jab lands during active ticks 5..8; let the move play out completely
    tick(sim, 20);
    const hpAfterFirst = sim.p1.hp;
    expect(hpAfterFirst).toBeLessThan(108);
    // the consumed window must not chip again on later ticks
    const deltas = [];
    for (let i = 0; i < 6; i++) {
      const before = sim.p1.hp;
      sim.step({ buttons: BTN.NONE }, { buttons: BTN.NONE });
      deltas.push(hpAfterFirst - before);
    }
    expect(Math.max(...deltas)).toBe(0);
  });
});

describe('stage bounds data feed', () => {
  it('fixed-point constants flow into the sim', () => {
    const cfg = createGameConfig();
    const sim = makeSim(cfg);
    const defaultStage = getStage('dojang');
    expect(sim.stage.leftPx).toBe(PX(defaultStage.leftPx));
    expect(sim.stage.rightPx).toBe(PX(defaultStage.rightPx));
  });
});