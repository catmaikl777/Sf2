import { describe, it, expect } from 'vitest';
import {
  config,
  validateConfig,
  createGameConfig,
  getFighter,
  getWeapon,
  getArmor,
  getMove,
  movesForWeapon,
  combosForWeapon,
  getAiConfig,
  getStage,
  t,
  COMBOS,
  MOVES,
} from '../src/config/index.js';
import { FP_SCALE } from '../src/constants.js';

describe('game configuration', () => {
  it('validates with zero errors', () => {
    expect(validateConfig(config)).toEqual([]);
  });

  it('detects cross-reference problems', () => {
    const broken = createGameConfig();
    const fighter = broken.fighters[0];
    const move = broken.moves[0];
    const weapon = broken.weapons[1];
    if (!fighter || !move || !weapon) throw new Error('expected seeded config');
    fighter.weaponIds = ['w_missing'];
    move.cancelsInto = ['move_missing'];
    weapon.moveIds = ['nope'];
    const errors = validateConfig(broken);
    expect(errors.some((e) => e.includes('unknown weapon'))).toBe(true);
    expect(errors.some((e) => e.includes('unknown move'))).toBe(true);
  });

  it('detects a hitbox window that exceeds the active phase', () => {
    const broken = createGameConfig();
    const move = /** @type {import('../src/config/types.js').MoveConfig} */ (broken.moves[0]);
    move.activeMs = 10;
    /** @type {import('../src/config/types.js').HitboxWindow} */ (move.hitboxes[0]).startMs = 100;
    /** @type {import('../src/config/types.js').HitboxWindow} */ (move.hitboxes[0]).endMs = 500;
    const errors = validateConfig(broken);
    expect(errors.some((e) => e.includes('exceeds startup+active'))).toBe(true);
  });

  it('rejects a super move without energy cost', () => {
    const broken = createGameConfig();
    const superMove = broken.moves.find((m) => m.isSuper);
    if (!superMove) throw new Error(); superMove.energyCost = 0;
    const errors = validateConfig(broken);
    expect(errors.some((e) => e.includes('super requires energyCost'))).toBe(true);
  });

  it('provides lookups that throw on unknown ids', () => {
    expect(getFighter('shadow').maxHp).toBeGreaterThan(0);
    expect(() => getFighter('nobody')).toThrow(RangeError);
    expect(() => getWeapon('w_nope')).toThrow(RangeError);
    expect(() => getArmor('a_nope')).toThrow(RangeError);
    expect(() => getMove('move_nope')).toThrow(RangeError);
    expect(() => getStage('stage_nope')).toThrow(RangeError);
    expect(() => getAiConfig(/** @type {any} */ ('IMPOSSIBLE'))).toThrow(RangeError);
  });

  it('exposes at least 40 combos spread over all weapon classes', () => {
    expect(COMBOS.length).toBeGreaterThanOrEqual(40);
    const classes = new Set(COMBOS.map((c) => c.weaponClass));
    for (const c of /** @type {const} */ (['unarmed', 'dagger', 'sword', 'axe', 'spear', 'nunchaku', 'universal'])) {
      expect(classes.has(c)).toBe(true);
    }
  });

  it('every combo target exists and every weapon moveset is complete', () => {
    const moveIds = new Set(MOVES.map((m) => m.id));
    for (const c of COMBOS) {
      expect(moveIds.has(c.moveId)).toBe(true);
    }
    for (const w of config.weapons) {
      expect(w.moveIds.length).toBeGreaterThan(0);
      expect(combosForWeapon(w.weaponClass).length).toBeGreaterThan(0);
      expect(movesForWeapon(w.weaponClass).length).toBeGreaterThan(0);
    }
  });

  it('hitboxes of every move start after its startup phase begins and fit the active window', () => {
    for (const m of MOVES) {
      for (const h of m.hitboxes) {
        expect(h.startMs).toBeGreaterThanOrEqual(0);
        expect(h.endMs).toBeLessThanOrEqual(m.startupMs + m.activeMs);
      }
    }
  });

  it('AI difficulties differ only in perception/decision parameters', () => {
    const easy = getAiConfig('EASY');
    const normal = getAiConfig('NORMAL');
    const hard = getAiConfig('HARD');
    expect(easy.reactionDelayMs).toBeGreaterThan(normal.reactionDelayMs);
    expect(normal.reactionDelayMs).toBeGreaterThan(hard.reactionDelayMs);
    expect(easy.decisionsPerSecond).toBeLessThan(normal.decisionsPerSecond);
    expect(normal.decisionsPerSecond).toBeLessThan(hard.decisionsPerSecond);
    expect(easy.stateReadErrorChance).toBeGreaterThan(hard.stateReadErrorChance);
    // difficulty must not carry combat stats
    for (const a of [easy, normal, hard]) {
      expect(Object.keys(a)).not.toContain('damageMult');
      expect(Object.keys(a)).not.toContain('maxHp');
    }
  });

  it('has integer Q16.16 stats in fighters', () => {
    for (const f of config.fighters) {
      expect(Number.isInteger(f.walkSpeed)).toBe(true);
      expect(f.walkSpeed).toBeGreaterThan(0);
      expect(Number.isInteger(f.weight)).toBe(true);
      expect(f.weight).toBeGreaterThan(0);
      expect(Number.isInteger(f.jumpVelocity)).toBe(true);
      expect(f.jumpVelocity).toBeLessThan(0);
      expect(Number.isInteger(f.gravity)).toBe(true);
      expect(f.gravity).toBeGreaterThan(0);
      expect(f.maxHp).toBeGreaterThan(0); // energy always defined
      expect(f.maxEnergy).toBeGreaterThan(0);
    }
  });

  it('defense multipliers stay below 1 so damage is never healed', () => {
    for (const a of config.armors) {
      expect(a.defense).toBeGreaterThanOrEqual(0);
      expect(a.defense).toBeLessThan(FP_SCALE);
    }
  });

  it('translates known keys in both languages and falls back safely', () => {
    expect(t('ru', 'menu.play')).toBe('Играть');
    expect(t('en', 'menu.play')).toBe('Play');
    expect(t('ru', 'missing.key')).toBe('missing.key');
    expect(t('xx', 'menu.play')).toBe('Play');
    expect(t('ru', 'result.reward', { amount: 50 })).toBe('Награда: 50');
  });

  it('round meta supports best-of-three', () => {
    expect(config.rounds.roundsToWin).toBe(2);
    expect(config.rounds.roundTimeSec).toBeGreaterThan(0);
  });

  it('flags duplicates, empty move timelines and missing AI configs', () => {
    const dup = createGameConfig();
    for (const f of dup.fighters) f.maxHp = 1;
    const firstMove = /** @type {import('../src/config/types.js').MoveConfig} */ (dup.moves[0]);
    dup.moves.push(structuredClone(firstMove));
    const dupErrs = validateConfig(dup);
    expect(dupErrs.some((e) => e.includes('duplicate move ids'))).toBe(true);

    const timeline = createGameConfig();
    const m = /** @type {import('../src/config/types.js').MoveConfig} */ (timeline.moves.find((v) => v.startupMs > 0));
    if (!m) throw new Error('expected a move with startup');
    m.startupMs = -1;
    m.hitboxes = [];
    const tErrs = validateConfig(timeline);
    expect(tErrs.some((e) => e.includes('invalid timeline'))).toBe(true);
    expect(tErrs.some((e) => e.includes('no hitbox windows'))).toBe(true);

    const noAi = createGameConfig();
    delete /** @type {any} */ (noAi).ai['NORMAL'];
    const aErrs = validateConfig(noAi);
    expect(aErrs.some((e) => e.includes('missing AI config'))).toBe(true);
  });
});
