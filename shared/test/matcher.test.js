import { describe, it, expect } from 'vitest';
import { createMatcher } from '../src/sim/matcher.js';
import { combosForWeapon } from '../src/config/index.js';
import { BTN } from '../src/constants.js';

/** Build an unarmed matcher.
 * @returns {ReturnType<typeof createMatcher>}
 */
function unarmedMatcher() {
  return createMatcher(combosForWeapon('unarmed'));
}

describe('matcher combo recognition', () => {
  it('recognizes a single neutral hand as a jab', () => {
    const m = unarmedMatcher();
    m.push(BTN.HAND, 1, 0);
    const best = m.poll(0);
    expect(best).toBeTruthy();
    expect(best?.moveId).toBe('unarmed_jab');
    expect(best?.len).toBe(1);
    expect(best?.priority).toBe(1);
  });

  it('chains two neutral hands into the doublejab within the window', () => {
    const m = unarmedMatcher();
    m.push(BTN.HAND, 1, 0);
    m.push(BTN.HAND, 1, 6);
    const best = m.poll(6);
    expect(best?.moveId).toBe('unarmed_doublejab');
    expect(best?.len).toBe(2);
    expect(best?.priority).toBe(3);
  });

  it('debounces a held button so it never fires a doublejab', () => {
    const m = unarmedMatcher();
    // three consecutive holds within the 3-tick debounce collapse to one token
    m.push(BTN.HAND, 1, 0);
    m.push(BTN.HAND, 1, 1);
    m.push(BTN.HAND, 1, 2);
    const best = m.poll(2);
    expect(best?.moveId).toBe('unarmed_jab');
    expect(best?.len).toBe(1);
  });

  it('falls back to a jab when the second hand is outside the combo window', () => {
    const m = unarmedMatcher();
    m.push(BTN.HAND, 1, 0);
    m.push(BTN.HAND, 1, 50); // doublejab windowMs 700 -> 42 ticks
    const best = m.poll(50);
    expect(best?.moveId).toBe('unarmed_jab');
    expect(best?.len).toBe(1);
  });

  it('ignores inputs once the finishing press goes stale', () => {
    const m = unarmedMatcher();
    m.push(BTN.HAND, 1, 0);
    // jab stepMs 400 -> 24 ticks; polling past that window matches nothing
    expect(m.poll(26)).toBeNull();
  });

  it('emits nothing for a direction with no attack button', () => {
    const m = unarmedMatcher();
    m.push(BTN.RIGHT, 1, 0);
    m.push(BTN.RIGHT, 1, 3);
    expect(m.poll(3)).toBeNull();
  });

  it('maps forward/back relative to facing', () => {
    // facing right: RIGHT is forward -> straight, LEFT is back -> elbow
    const right = unarmedMatcher();
    right.push(BTN.RIGHT | BTN.HAND, 1, 100);
    expect(right.poll(100)?.moveId).toBe('unarmed_straight');
    right.clear();
    right.push(BTN.LEFT | BTN.HAND, 1, 101);
    expect(right.poll(101)?.moveId).toBe('unarmed_elbow');

    // facing left: the roles swap
    const left = unarmedMatcher();
    left.push(BTN.LEFT | BTN.HAND, -1, 100);
    expect(left.poll(100)?.moveId).toBe('unarmed_straight');
    left.clear();
    left.push(BTN.RIGHT | BTN.HAND, -1, 101);
    expect(left.poll(101)?.moveId).toBe('unarmed_elbow');
  });

  it('matches a direction-intent token then an attack (dash attack)', () => {
    const m = unarmedMatcher();
    m.push(BTN.RIGHT, 1, 20); // direction-intent 'f:f'
    m.push(BTN.RIGHT | BTN.HAND, 1, 30); // forward hand
    const best = m.poll(30);
    expect(best?.moveId).toBe('universal_dashattack');
    expect(best?.priority).toBe(10);
    expect(best?.len).toBe(2);
  });

  it('matches an up-intent then a foot (flying kick)', () => {
    const m = unarmedMatcher();
    m.push(BTN.UP, 1, 200); // up intent 'u:f'
    m.push(BTN.RIGHT | BTN.FOOT, 1, 210); // forward foot
    const best = m.poll(210);
    expect(best?.moveId).toBe('unarmed_flyingkick');
    expect(best?.len).toBe(2);
  });

  it('matches a forward hand then a neutral hand (hook)', () => {
    const m = unarmedMatcher();
    m.push(BTN.RIGHT | BTN.HAND, 1, 301); // f:hand
    m.push(BTN.HAND, 1, 306); // n:hand
    const best = m.poll(306);
    expect(best?.moveId).toBe('unarmed_hook');
    expect(best?.priority).toBe(4);
  });

  it('resolves priority: super beats a concurrently-matching lower combo', () => {
    const m = unarmedMatcher();
    m.push(BTN.RIGHT | BTN.HAND, 1, 400); // f:hand
    m.push(BTN.HAND, 1, 404); // n:hand -> hook (prio 4) matches
    m.push(BTN.RIGHT | BTN.FOOT, 1, 408); // f:foot
    m.push(BTN.RIGHT | BTN.HAND, 1, 412); // f:hand -> super (prio 20)
    const best = m.poll(412);
    expect(best?.moveId).toBe('unarmed_super');
    expect(best?.priority).toBe(20);
    expect(best?.len).toBe(3);
  });

  it('clear() empties the token buffer', () => {
    const m = unarmedMatcher();
    m.push(BTN.HAND, 1, 0);
    m.clear();
    expect(m.poll(5)).toBeNull();
  });

  it('is deterministic: identical inputs yield identical matches', () => {
    const a = unarmedMatcher();
    const b = unarmedMatcher();
    /** @type {[number, -1|1, number][]} */
    const stream = [
      [BTN.RIGHT, 1, 10],
      [BTN.RIGHT | BTN.HAND, 1, 16],
      [BTN.HAND, 1, 22],
      [BTN.LEFT | BTN.FOOT, 1, 30],
      [BTN.NONE, 1, 40],
    ];
    for (const [btn, facing, tick] of stream) {
      a.push(btn, facing, tick);
      b.push(btn, facing, tick);
    }
    const pollsA = stream.map(([, , tick]) => a.poll(tick));
    const pollsB = stream.map(([, , tick]) => b.poll(tick));
    expect(JSON.stringify(pollsA)).toBe(JSON.stringify(pollsB));
  });
});
