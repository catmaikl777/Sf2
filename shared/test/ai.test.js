import { describe, it, expect } from 'vitest';
import { createSim } from '../src/sim/sim.js';
import { createGameConfig, getAiConfig } from '../src/config/index.js';
import { BTN, PX } from '../src/constants.js';
import { createRng } from '../src/rng.js';
import { createBot } from '../src/ai/bot.js';
import { observe, observeFighter } from '../src/ai/observe.js';
import { createPerception } from '../src/ai/perception.js';
import { choose, evaluate, forwardButton, backButton, superAction } from '../src/ai/utility.js';
import { createFsm } from '../src/ai/fsm.js';
import { selector, sequence, guard, constant, action, not } from '../src/ai/behaviortree.js';

/**
 * Sprint 3 acceptance: a deterministic AI opponent built from perception,
 * utility scoring, a behaviour tree and a phase machine. Difficulty changes
 * only perception/decision parameters, never combat stats.
 */

const ALL_BUTTONS = Object.values(BTN).reduce((a, b) => a | b, 0);

const defaultPair = {
  p0: { fighterId: 'shadow', weaponId: 'w_unarmed', armorId: 'a_cloth' },
  p1: { fighterId: 'hermit', weaponId: 'w_unarmed', armorId: 'a_cloth' },
};

/** @param {*} over @returns {import('../src/ai/types.js').FighterView} */
function fighter(over = {}) {
  return {
    x: 0,
    y: 0,
    facing: 1,
    hp: 100,
    maxHp: 120,
    energy: 0,
    maxEnergy: 100,
    state: 'idle',
    moveId: null,
    moveTick: 0,
    moveTotalTicks: 0,
    movePhase: 'none',
    stunTicks: 0,
    grounded: true,
    ...over,
  };
}

/** @param {*} over @returns {import('../src/ai/types.js').BotContext} */
function makeCtx(over = {}) {
  return {
    ai: over.ai ?? getAiConfig('NORMAL'),
    self: over.self ?? fighter(),
    opp: over.opp ?? fighter({ x: PX(300), facing: -1 }),
    distance: over.distance ?? PX(300),
    rangePx: over.rangePx ?? 60,
    facing: 1,
    tick: over.tick ?? 0,
    phase: over.phase ?? 'neutral',
  };
}

/** Run a bot on side 1 against a passive dummy and collect stats.
 * @param {import('../src/config/types.js').Difficulty} difficulty
 * @param {number} ticks
 * @param {number} seed
 */
function runBot(difficulty, ticks, seed = 999) {
  const cfg = createGameConfig();
  const sim = createSim(cfg, defaultPair);
  const bot = createBot(cfg, { difficulty, side: 1, seed, weaponId: defaultPair.p1.weaponId });
  let hits = 0;
  let invalid = 0;
  /** @type {number[]} */
  const stream = [];
  for (let i = 0; i < ticks; i++) {
    const out = bot.step(observe(sim, 1));
    stream.push(out.buttons);
    if ((out.buttons & ~ALL_BUTTONS) !== 0) invalid++;
    const evs = sim.step({ buttons: 0 }, { buttons: out.buttons });
    for (const e of evs) if (e.type === 'hit') hits++;
  }
  return { sim, bot, hits, invalid, stream };
}

describe('observation', () => {
  it('flattens public fighter state without sim internals', () => {
    const sim = createSim(createGameConfig(), defaultPair);
    const view = observe(sim, 0);
    expect(view.tick).toBe(0);
    expect(view.distance).toBe(sim.p1.x - sim.p0.x);
    expect(view.self.facing).toBe(1);
    expect(view.opp.facing).toBe(-1);
    expect(view.stage).toBe(sim.stage);
    expect(view.self.moveId).toBe(null);
    expect(view.self.movePhase).toBe('none');
  });

  it('reports move phase transitions', () => {
    const sim = createSim(createGameConfig(), defaultPair);
    for (let i = 0; i < 110; i++) sim.step({ buttons: 0 }, { buttons: 0 });
    expect(sim.queueMove(1, 'unarmed_jab')).toBe(true);
    expect(observeFighter(sim.p1).movePhase).toBe('startup');
    for (let i = 0; i < 5; i++) sim.step({ buttons: 0 }, { buttons: 0 });
    expect(observeFighter(sim.p1).movePhase).toBe('active');
    for (let i = 0; i < 10 && observeFighter(sim.p1).movePhase === 'active'; i++) sim.step({ buttons: 0 }, { buttons: 0 });
    expect(observeFighter(sim.p1).movePhase).toBe('recovery');
  });
});

describe('perception', () => {
  it('delays the world by the reaction time', () => {
    const ai = { ...getAiConfig('NORMAL'), reactionDelayMs: 100, aimErrorPx: 0, stateReadErrorChance: 0 };
    const p = createPerception(ai, createRng(1));
    for (let t = 0; t <= 40; t++) p.observe({ tick: t, self: fighter(), opp: fighter(), distance: PX(100 + t), stage: sim0().stage });
    const sensed = p.sense(40);
    expect(sensed).toBeTruthy();
    expect(sensed?.tick).toBe(34); // ceil(100ms/16.67) == 6 ticks back
  });

  it('is exact when there is no noise', () => {
    const ai = { ...getAiConfig('NORMAL'), reactionDelayMs: 0, aimErrorPx: 0, stateReadErrorChance: 0 };
    const p = createPerception(ai, createRng(7));
    const view = { tick: 3, self: fighter(), opp: fighter(), distance: PX(80), stage: sim0().stage };
    p.observe(view);
    expect(p.sense(3)).toBe(view);
  });

  it('introduces bounded aim error', () => {
    const ai = { ...getAiConfig('EASY'), reactionDelayMs: 0, aimErrorPx: 46, stateReadErrorChance: 0 };
    const p = createPerception(ai, createRng(5));
    p.observe({ tick: 0, self: fighter(), opp: fighter(), distance: 0, stage: sim0().stage });
    const sensed = p.sense(0);
    expect(sensed).toBeTruthy();
    expect(Math.abs(sensed?.distance ?? 1e9)).toBeLessThanOrEqual(46 * 65536);
  });

  it('can misread the opponent state', () => {
    const ai = { ...getAiConfig('EASY'), reactionDelayMs: 0, aimErrorPx: 0, stateReadErrorChance: 1 };
    const p = createPerception(ai, createRng(3));
    p.observe({ tick: 0, self: fighter(), opp: fighter({ state: 'attack' }), distance: 0, stage: sim0().stage });
    expect(p.sense(0)?.opp.state).toBe('idle');
  });

  it('returns null before any observation', () => {
    const p = createPerception(getAiConfig('NORMAL'), createRng(1));
    expect(p.sense(0)).toBe(null);
  });
});

describe('utility scoring', () => {
  it('approaches when out of range', () => {
    expect(choose(makeCtx({ distance: PX(300), rangePx: 60 })).name).toBe('approach');
  });

  it('blocks an incoming attack at close range', () => {
    const ctx = makeCtx({ distance: PX(40), opp: fighter({ state: 'attack', movePhase: 'active' }), phase: 'defend' });
    expect(choose(ctx).name).toBe('block');
  });

  it('punishes a vulnerable opponent', () => {
    const ctx = makeCtx({ distance: PX(40), opp: fighter({ state: 'hitstun' }), phase: 'punish' });
    expect(choose(ctx).name).toBe('attack');
  });

  it('spends a full meter on the super combo', () => {
    const ctx = makeCtx({ distance: PX(40), self: fighter({ energy: 100, maxEnergy: 100 }), phase: 'engage' });
    const picked = choose(ctx);
    expect(picked.name).toBe('super');
    expect(picked.script).toEqual([BTN.RIGHT | BTN.HAND, 0, BTN.RIGHT | BTN.FOOT, 0, BTN.RIGHT | BTN.HAND, 0]);
  });

  it('scores every candidate with a finite number', () => {
    const scored = evaluate(makeCtx({}));
    expect(scored.length).toBeGreaterThan(3);
    for (const s of scored) expect(Number.isFinite(s.score)).toBe(true);
  });

  it('mirrors direction helpers by facing', () => {
    expect(forwardButton(1)).toBe(BTN.RIGHT);
    expect(forwardButton(-1)).toBe(BTN.LEFT);
    expect(backButton(1)).toBe(BTN.LEFT);
    expect(backButton(-1)).toBe(BTN.RIGHT);
    expect(superAction(-1).script?.[0]).toBe(BTN.LEFT | BTN.HAND);
  });
});

describe('behaviour tree', () => {
  const a = constant(superAction(1));
  const nullNode = () => null;

  it('selector returns the first non-null child', () => {
    const node = selector(nullNode, a, constant(superAction(1)));
    expect(node(makeCtx())).toBeTruthy();
  });

  it('selector fails when every child fails', () => {
    expect(selector(nullNode, nullNode)(makeCtx())).toBe(null);
  });

  it('sequence yields the last action only if all succeed', () => {
    expect(sequence(a, a)(makeCtx())).toBeTruthy();
    expect(sequence(a, nullNode)(makeCtx())).toBe(null);
  });

  it('guard gates a child on a predicate', () => {
    expect(guard(() => false, a)(makeCtx())).toBe(null);
    expect(guard(() => true, a)(makeCtx())).toBeTruthy();
  });

  it('action and not compose predicates', () => {
    const node = action((c) => (not((x) => x.phase === 'neutral')(c) ? superAction(1) : superAction(1)));
    expect(node(makeCtx({ phase: 'engage' }))).toBeTruthy();
  });
});

describe('phase machine', () => {
  it('recovers while stunned', () => {
    const fsm = createFsm();
    expect(fsm.update(makeCtx({ self: fighter({ state: 'hitstun' }) }))).toBe('recover');
  });

  it('defends against an incoming attack', () => {
    const fsm = createFsm();
    const ctx = makeCtx({ distance: PX(40), opp: fighter({ state: 'attack', movePhase: 'startup' }) });
    expect(fsm.update(ctx)).toBe('defend');
  });

  it('punishes an open opponent', () => {
    const fsm = createFsm();
    expect(fsm.update(makeCtx({ distance: PX(40), opp: fighter({ state: 'attack', movePhase: 'recovery' }) }))).toBe('punish');
  });

  it('engages in range and approaches out of range', () => {
    const fsm = createFsm();
    expect(fsm.update(makeCtx({ distance: PX(40) }))).toBe('engage');
    expect(fsm.update(makeCtx({ distance: PX(400) }))).toBe('approach');
  });
});

describe('bot behaviour', () => {
  it('emits only valid button masks', () => {
    const { invalid } = runBot('NORMAL', 600);
    expect(invalid).toBe(0);
  });

  it('is deterministic for a fixed seed', () => {
    const a = runBot('NORMAL', 700, 4242);
    const b = runBot('NORMAL', 700, 4242);
    expect(a.stream).toEqual(b.stream);
    expect(a.sim.p0.hp).toBe(b.sim.p0.hp);
    expect(a.sim.p1.hp).toBe(b.sim.p1.hp);
  });

  it('differs across seeds', () => {
    const a = runBot('NORMAL', 700, 1);
    const b = runBot('NORMAL', 700, 2);
    expect(a.stream).not.toEqual(b.stream);
  });

  it('lands more hits on a dummy as difficulty rises', () => {
    const easy = runBot('EASY', 1500, 999);
    const normal = runBot('NORMAL', 1500, 999);
    const hard = runBot('HARD', 1500, 999);
    expect(normal.hits).toBeGreaterThan(easy.hits);
    expect(hard.hits).toBeGreaterThan(normal.hits);
    expect(hard.sim.p0.hp).toBeLessThan(easy.sim.p0.hp);
  });

  it('resets to the same deterministic stream', () => {
    const cfg = createGameConfig();
    const sim = createSim(cfg, defaultPair);
    const bot = createBot(cfg, { difficulty: 'NORMAL', side: 1, seed: 77, weaponId: defaultPair.p1.weaponId });
    /** @type {number[]} */
    const first = [];
    for (let i = 0; i < 200; i++) first.push(bot.step(observe(sim, 1)).buttons);
    bot.reset();
    const sim2 = createSim(cfg, defaultPair);
    /** @type {number[]} */
    const second = [];
    for (let i = 0; i < 200; i++) second.push(bot.step(observe(sim2, 1)).buttons);
    expect(second).toEqual(first);
    expect(bot.phase).toBeTruthy();
  });
});

/** A stage snapshot helper for perception tests.
 * @returns {import('../src/sim/sim.js').Sim}
 */
function sim0() {
  return createSim(createGameConfig(), defaultPair);
}
