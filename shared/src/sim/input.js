/**
 * Deterministic combo matcher. The simulation owns move recognition: raw
 * per-tick button bitmasks are converted into semantic direction-action pairs
 * (relative to the fighter's facing) and matched against the combo table. No
 * external library, RNG or clock is involved, so replays match bit-exact.
 *
 * @module shared/sim/input
 */

import { BTN } from '../constants.js';

const DIR_BIT = BTN.UP | BTN.DOWN | BTN.RIGHT | BTN.LEFT;

/**
 * Decode the semantic direction token of an input relative to facing.
 * Returns the semantic letter: 'f', 'b', 'u', 'd' or 'n'.
 * @param {number} buttons raw BTN bitmask
 * @param {-1|1} facing
 * @returns {'f'|'b'|'u'|'d'|'n'}
 */
export function semDir(buttons, facing) {
  const left = (buttons & BTN.LEFT) !== 0;
  const right = (buttons & BTN.RIGHT) !== 0;
  const up = (buttons & BTN.UP) !== 0;
  const down = (buttons & BTN.DOWN) !== 0;
  if (up && !down) return 'u';
  if (down && !up) return 'd';
  if (left && !right) {
    // semantic forward is the direction the fighter faces
    return facing > 0 ? 'b' : 'f';
  }
  if (right && !left) {
    return facing > 0 ? 'f' : 'b';
  }
  if (up && down) return 'n';
  return 'n';
}

/**
 * List of the action buttons pressed this tick that can form a combo token.
 * @param {number} buttons
 * @returns {string[]} e.g. ['hand', 'foot', 'super']
 */
export function pressedActions(buttons) {
  const out = [];
  if (buttons & BTN.HAND) out.push('hand');
  if (buttons & BTN.FOOT) out.push('foot');
  if (buttons & BTN.SUPER) out.push('super');
  return out;
}

/** Deep copy of an input frame. */
export function cloneInput(/** @type {{ buttons: number }} */ f) {
  return { buttons: f.buttons };
}

/**
 * Whether a button was just pressed (edge detection: is down now, was not
 * down during the previous frame).
 * @param {number} buttons
 * @param {number} prevButtons
 * @param {number} mask
 * @returns {boolean}
 */
export function justPressed(buttons, prevButtons, mask) {
  return (buttons & mask) !== 0 && (prevButtons & mask) === 0;
}

export { DIR_BIT };