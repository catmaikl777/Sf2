/**
 * Progression economy: local currency rewards and unlock prices live here.
 *
 * @module shared/config/progression
 */

import { FP_SCALE } from '../constants.js';

/** @type {import('./types.js').ProgressionConfig} */
export const PROGRESSION = {
  winReward: 120,
  lossReward: 35,
  roundReward: 25,
  perfectBonus: 60,
  superFinishBonus: 45,
  replayWinRewardShare: Math.round(0.25 * FP_SCALE) | 0,
  maxDailyReplayReward: 150,
};
