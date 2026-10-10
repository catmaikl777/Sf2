/**
 * Round/match flow state machine: intro, fighting, outro, break and the match
 * verdict. Pure integer time; the simulator calls step() each tick.
 *
 * @module shared/sim/round
 */

import { msToTicks } from './timing.js';

/**
 * @typedef {'intro'|'fighting'|'outro'|'break'|'matchEnd'} RoundPhase
 */

/**
 * @typedef {Object} RoundState
 * @property {RoundPhase} phase
 * @property {number} phaseTicks
 * @property {number} roundNum        1-based
 * @property {number} p0Rounds
 * @property {number} p1Rounds
 * @property {number} roundTimerTicks  remaining fighting ticks
 * @property {number|null} winner     0|1|null
 * @property {number|null} matchWinner
 * @property {number|null} koBy       id of the winning fighter on knockout
 * @property {string|null} endReason  'ko'|'timeout'|'superFinish'
 */

/**
 * Create a fresh match-level round state.
 * @param {import('../config/types.js').RoundConfig} rc
 * @returns {RoundState}
 */
export function createRoundState(rc) {
  return {
    phase: 'intro',
    phaseTicks: 0,
    roundNum: 1,
    p0Rounds: 0,
    p1Rounds: 0,
    roundTimerTicks: msToTicks(rc.roundTimeSec * 1000),
    winner: null,
    matchWinner: null,
    koBy: null,
    endReason: null,
  };
}

/**
 * Advance one tick of the round flow. Returns a copy-friendly event hint when
 * a phase transition happened.
 * @param {RoundState} rs
 * @param {import('../config/types.js').RoundConfig} rc
 * @param {Partial<{p0Dead:boolean, p1Dead:boolean}>} flags
 * @returns {string|null} phase transition label or null
 */
export function stepRound(rs, rc, flags) {
  rs.phaseTicks++;

  switch (rs.phase) {
    case 'intro': {
      const intro = msToTicks(rc.introMs);
      if (rs.phaseTicks >= intro) {
        rs.phase = 'fighting';
        rs.phaseTicks = 0;
        return 'fight';
      }
      return null;
    }
    case 'fighting': {
      rs.roundTimerTicks = Math.max(0, rs.roundTimerTicks - 1);
      if (rs.roundTimerTicks <= 0) {
        return finishRound(rs, rc, { reason: 'timeout', winner: null });
      }
      if (flags.p0Dead || flags.p1Dead) {
        const killer = flags.p0Dead ? 1 : 0;
        return finishRound(rs, rc, { reason: 'ko', winner: killer });
      }
      return null;
    }
    case 'outro': {
      const outro = msToTicks(rc.outroMs);
      if (rs.phaseTicks >= outro) {
        if (rs.matchWinner !== null) {
          rs.phase = 'matchEnd';
          return 'matchEnd';
        }
        rs.phase = 'break';
        rs.phaseTicks = 0;
        return 'break';
      }
      return null;
    }
    case 'break': {
      const brk = msToTicks(rc.breakMs);
      if (rs.phaseTicks >= brk) {
        rs.phase = 'intro';
        rs.phaseTicks = 0;
        rs.roundNum++;
        rs.roundTimerTicks = msToTicks(rc.roundTimeSec * 1000);
        rs.winner = null;
        rs.koBy = null;
        rs.endReason = null;
        return 'nextRound';
      }
      return null;
    }
    case 'matchEnd':
      return null;
    default:
      return null;
  }
}

/**
 * Close a round, score it and decide whether the match is over.
 * @param {RoundState} rs
 * @param {import('../config/types.js').RoundConfig} rc
 * @param {{reason:string, winner:0|1|null}} outcome
 * @returns {string}
 */
export function finishRound(rs, rc, outcome) {
  const winner = outcome.winner;
  rs.endReason = outcome.reason;
  rs.phase = 'outro';
  rs.phaseTicks = 0;
  rs.winner = winner;
  rs.koBy = winner === null ? null : winner;

  if (winner !== null) {
    if (winner === 0) rs.p0Rounds++;
    else rs.p1Rounds++;
    if (rs.p0Rounds >= rc.roundsToWin || rs.p1Rounds >= rc.roundsToWin) {
      rs.matchWinner = winner;
    }
  }
  return 'outro';
}