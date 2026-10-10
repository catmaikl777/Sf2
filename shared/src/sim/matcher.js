/**
 * Deterministic combo recognizer. Keeps a rolling buffer of semantic tokens
 * (direction:action) with the tick they happened. Two kinds of tokens exist:
 *   - action tokens: a hand/foot/super press, e.g. 'f:hand'
 *   - direction-intent tokens: a directional press with no action button,
 *     e.g. 'u:f' or 'f:f' (jump/forward movement that precedes an attack)
 * On poll, for every weapon combo the buffer is walked newest-to-oldest and
 * the sequence must fit within the combo's window/step tick limits. Integer
 * ticks only; no RNG, no clock — identical inputs reproduce identical moves.
 *
 * @module shared/sim/matcher
 */

import { semDir, DIR_BIT } from './input.js';
import { BTN } from '../constants.js';
import { msToTicks } from './timing.js';

/** @typedef {{dir: string, act: string, tick: number}} Token */

/**
 * @typedef {Object} ComboMatch
 * @property {string} moveId
 * @property {number} priority
 * @property {number} len
 */

/**
 * Create a matcher bound to one weapon class.
 * @param {import('../config/combos.js').ComboEntry[]} combos
 * @returns {{
 *   push(inputButtons: number, facing: -1|1, tick: number): void,
 *   poll(tick: number): ComboMatch|null,
 *   clear(): void,
 * }}
 */
export function createMatcher(combos) {
  /** @type {Token[]} */
  const queue = [];
  const maxAgeTicks = msToTicks(1600);

  /**
   * Append the tokens triggered by this tick's buttons.
   * @param {number} buttons
   * @param {-1|1} facing
   * @param {number} tick
   */
  const push = (buttons, facing, tick) => {
    const dir = semDir(buttons, facing);
    if ((buttons & BTN.HAND) !== 0) pushToken(queue, 'hand', dir, tick, maxAgeTicks);
    if ((buttons & BTN.FOOT) !== 0) pushToken(queue, 'foot', dir, tick, maxAgeTicks);
    if ((buttons & BTN.SUPER) !== 0) pushToken(queue, 'super', dir, tick, maxAgeTicks);
    // direction intent: a directional press is its own token so entries like
    // 'u:f' or 'f:f' (movement leading into an attack) can match. Neutral is
    // not an intent.
    if ((buttons & DIR_BIT) !== 0 && dir !== 'n') {
      pushToken(queue, dir, dir, tick, maxAgeTicks);
    }
    if (queue.length > 24) queue.splice(0, queue.length - 24);
  };

  /**
   * Does the buffered sequence contain a weapon combo right now?
   * @param {number} tick
   * @returns {ComboMatch|null}
   */
  const poll = (tick) => {
    /** @type {ComboMatch|null} */
    let best = null;
    for (const c of combos) {
      if (c.sequence.length === 0) continue;
      const windowTicks = msToTicks(c.windowMs);
      const stepTicks = msToTicks(c.stepMs);
      const m = matchFromNewest(queue, c.sequence, tick, windowTicks, stepTicks);
      if (m && (!best || c.priority > best.priority || (c.priority === best.priority && c.sequence.length > best.len))) {
        best = { moveId: c.moveId, priority: c.priority, len: c.sequence.length };
      }
    }
    return best;
  };

  const clear = () => {
    queue.length = 0;
  };

  return { push, poll, clear };
}

/**
 * Append one token, debouncing an identical consecutive hold within 3 ticks.
 * @param {Token[]} queue
 * @param {string} act
 * @param {string} dir
 * @param {number} tick
 * @param {number} maxAgeTicks
 */
function pushToken(queue, act, dir, tick, maxAgeTicks) {
  const last = queue[queue.length - 1];
  if (last && last.act === act && last.dir === dir && tick - last.tick < 3) {
    // extend the hold rather than duplicate it
    last.tick = tick;
    return;
  }
  queue.push({ dir, act, tick });
  while (queue.length > 0) {
    const oldest = /** @type {Token} */ (queue[0]);
    if (tick - oldest.tick <= maxAgeTicks) break;
    queue.shift();
  }
}

/**
 * Walk the sequence from its newest element backwards through the queue.
 * @param {Token[]} queue
 * @param {string[]} seq
 * @param {number} tick
 * @param {number} windowTicks
 * @param {number} stepTicks
 * @returns {boolean}
 */
function matchFromNewest(queue, seq, tick, windowTicks, stepTicks) {
  // try every possible position of the LAST sequence element, newest first
  for (let lastIdx = queue.length - 1; lastIdx >= 0; lastIdx--) {
    const lastTok = /** @type {Token} */ (queue[lastIdx]);
    const lastWant = parse(/** @type {string} */ (seq[seq.length - 1]));
    if (!matches(lastTok, lastWant)) continue;
    if (tick - lastTok.tick > stepTicks) continue; // the finishing input is stale
    const lastTick = lastTok.tick;
    let prevMatchTick = lastTick;
    let searchIdx = lastIdx - 1;
    let oldestTick = lastTick;
    let ok = true;
    for (let i = seq.length - 2; i >= 0 && ok; i--) {
      const want = parse(/** @type {string} */ (seq[i]));
      let found = -1;
      for (let j = searchIdx; j >= 0; j--) {
        const tj = /** @type {Token} */ (queue[j]);
        if (lastTick - tj.tick > windowTicks) break; // outside the whole-combo window
        if (!matches(tj, want)) continue;
        if (prevMatchTick - tj.tick > stepTicks) break; // too far from the newer element
        found = j;
        prevMatchTick = tj.tick;
        searchIdx = j - 1;
        break;
      }
      if (found < 0) {
        ok = false;
      } else {
        oldestTick = prevMatchTick;
      }
    }
    if (!ok) continue;
    // the whole sequence must sit inside the window
    if (lastTick - oldestTick > windowTicks) continue;
    return true;
  }
  return false;
}

/**
 * Split 'f:hand' into {dir:'f', act:'hand'}.
 * @param {string} raw
 * @returns {{dir: string, act: string}}
 */
function parse(raw) {
  const idx = raw.indexOf(':');
  return { dir: raw.slice(0, idx), act: raw.slice(idx + 1) };
}

/**
 * Compare a buffered token against a wanted token.
 * A wanted direction 'n' accepts any direction.
 * Direction-intent tokens (wanted act is a directional letter, e.g. 'u:f',
 * 'f:f') match only buffered intent tokens of the same semantic direction;
 * a buffered intent token carries act === dir.
 * @param {Token} t
 * @param {{dir: string, act: string}} want
 * @returns {boolean}
 */
function matches(t, want) {
  if (isIntentWant(want.act)) {
    return t.act === t.dir && t.dir === want.dir;
  }
  if (t.act !== want.act) return false;
  if (want.dir === 'n') return true;
  return t.dir === want.dir;
}

/**
 * A wanted token whose action part is itself a direction letter denotes a
 * direction-intent element ('u:f', 'f:f') rather than a button press.
 * @param {string} act
 * @returns {boolean}
 */
function isIntentWant(act) {
  return act === 'f' || act === 'b' || act === 'u' || act === 'd' || act === 'n';
}