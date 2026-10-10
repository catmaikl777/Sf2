/**
 * Round / match meta parameters.
 *
 * @module shared/config/rounds
 */

import { FP_SCALE } from '../constants.js';

/** @type {import('./types.js').RoundConfig} */
export const ROUNDS = {
  roundsToWin: 2,
  roundTimeSec: 60,
  introMs: 1800,
  outroMs: 2400,
  breakMs: 1500,
  maxHp: 0, // 0 means "use fighter maxHp"
  startingEnergy: 0,
  drawTimeOutDamageShare: Math.round(0.5 * FP_SCALE) | 0,
};
