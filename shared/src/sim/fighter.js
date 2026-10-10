/**
 * Fighter state construction, movement, collision separation and move setup.
 * All functions mutate the passed FighterState; nothing here reads clocks,
 * RNG or the DOM, so the sim stays deterministic and replayable.
 *
 * @module shared/sim/fighter
 */

import { BTN, PX, FP_SCALE } from '../constants.js';
import { add, sub, clamp, mul } from '../fp.js';
import { msToTicks } from './timing.js';
import { justPressed } from './input.js';
import { getMoveTiming } from './movetiming.js';

/** Q16.16 half. */
const HALF = FP_SCALE >> 1;

/**
 * Spawn a fighter's runtime state for a round.
 * @param {import('../config/types.js').FighterConfig} cfg
 * @param {import('../config/types.js').WeaponConfig} weapon
 * @param {import('../config/types.js').ArmorConfig} armor
 * @param {number} startX   Q16.16 feet-center world x
 * @param {-1|1} facing
 * @returns {import('./types.js').FighterState}
 */
export function createFighter(cfg, weapon, armor, startX, facing) {
  const maxHp = cfg.maxHp;
  return {
    fighterId: cfg.id,
    config: cfg,
    weapon,
    armor,
    x: startX,
    y: 0,
    vx: 0,
    vy: 0,
    facing,
    hp: maxHp,
    maxHp,
    energy: 0,
    maxEnergy: cfg.maxEnergy,
    state: 'idle',
    stateTicks: 0,
    prevState: 'idle',
    prevStateTicks: 0,
    move: null,
    hitstopTicks: 0,
    blockTicks: 0,
    blockReleaseTicks: 0,
    blockedHurtbox: false,
    comboTicks: 0,
    hitsDealt: 0,
    roundsWon: 0,
    hurtRectW: PX(cfg.widthPx),
    hurtRectH: PX(cfg.heightPx),
    lastComboMove: null,
    superUsedThisRound: 0,
    stunTicks: 0,
    dashRemainingTicks: 0,
    lastButtons: 0,
    pendingCancel: false,
    victimTicksRemaining: 0,
  };
}

/** Feet on the ground? */
export const isGrounded = (/** @type {import('./types.js').FighterState} */ f) => f.y === 0;

/**
 * Replace the current state, keeping history for event reporting.
 * @param {import('./types.js').FighterState} f
 * @param {import('../config/types.js').FighterState} s
 */
export function setState(f, s) {
  f.prevState = f.state;
  f.prevStateTicks = f.stateTicks;
  f.state = s;
  f.stateTicks = 0;
}

/**
 * Start blocking.
 * @param {import('./types.js').FighterState} f
 */
export function startBlock(f) {
  f.blockedHurtbox = true;
  f.blockTicks = msToTicks(800);
  f.blockReleaseTicks = msToTicks(120);
}

/**
 * Begin an attack move.
 * @param {import('./types.js').FighterState} f
 * @param {import('../config/types.js').MoveConfig} move
 * @param {boolean} cancelFollowup
 * @returns {import('./types.js').MoveState}
 */
export function startMove(f, move, cancelFollowup) {
  const timing = getMoveTiming(move);
  const ms = {
    timing,
    tick: 0,
    cancelledTick: f.move ? f.move.tick : 0,
    isCancelFollowup: cancelFollowup,
    consumed: timing.hitboxes.map(() => false),
  };
  f.move = ms;
  f.pendingCancel = false;
  setState(f, 'attack');
  return ms;
}

/**
 * Leave the attack, returning to a controllable state.
 * @param {import('./types.js').FighterState} f
 */
export function endMove(f) {
  f.move = null;
  f.pendingCancel = false;
  setState(f, isGrounded(f) ? 'idle' : 'jump');
}

/**
 * Pick the direct (single-button) move this input wants to begin, if any.
 * Combined-direction moves are left to the combo matcher.
 * @param {import('../config/types.js').MoveConfig[]} moveset
 * @param {{buttons:number}} input
 * @param {number} prevButtons
 * @param {-1|1} facing
 * @param {'stand'|'crouch'|'air'} stance  current stance gate
 * @returns {import('../config/types.js').MoveConfig|null}
 */
export function pickDirectMove(moveset, input, prevButtons, facing, stance) {
  for (const m of moveset) {
    if (m.stance !== stance && !(stance === 'stand' && m.stance === 'crouch')) continue;
    if (m.buttons.length !== 1 || m.dirs.length > 1) continue;
    const btnName = /** @type {string} */ (m.buttons[0]);
    const mask = BTN_BY_NAME[btnName];
    if (!mask) continue;
    if (!justPressed(input.buttons, prevButtons, mask)) continue;
    const needDir = /** @type {string|undefined} */ (m.dirs[0]);
    if (needDir !== undefined && !dirMatches(needDir, input.buttons, facing)) continue;
    return m;
  }
  return null;
}

/** @type {Record<string, number>} */
const BTN_BY_NAME = {
  hand: BTN.HAND,
  foot: BTN.FOOT,
  block: BTN.BLOCK,
  jump: BTN.JUMP,
  dash: BTN.DASH,
  throw: BTN.THROW,
  super: BTN.SUPER,
};

/**
 * Semantic direction check.
 * @param {string} want
 * @param {number} buttons
 * @param {-1|1} facing
 * @returns {boolean}
 */
export function dirMatches(want, buttons, facing) {
  const left = (buttons & BTN.LEFT) !== 0;
  const right = (buttons & BTN.RIGHT) !== 0;
  switch (want) {
    case 'neutral':
      return !left && !right;
    case 'forward':
      return facing > 0 ? right : left;
    case 'back':
      return facing > 0 ? left : right;
    case 'down':
      return (buttons & BTN.DOWN) !== 0;
    case 'up':
      return (buttons & BTN.UP) !== 0;
    default:
      return true;
  }
}

/**
 * Soft collision: push apart overlapping hurtboxes proportionally to weight.
 * @param {import('./types.js').FighterState} a
 * @param {import('./types.js').FighterState} b
 * @param {import('./types.js').StageBounds} stage
 */
export function separate(a, b, stage) {
  const halfA = shr(a.hurtRectW, 1);
  const halfB = shr(b.hurtRectW, 1);
  const minGap = halfA + halfB;
  const gap = sub(b.x, a.x);
  const absGap = gap < 0 ? -gap : gap;
  if (absGap >= minGap) return;

  const overlap = minGap - absGap;
  const wA = a.config.weight + a.armor.weight;
  const wB = b.config.weight + b.armor.weight;
  const total = wA + wB;
  const shareA = total > 0 ? limitedDiv(wB, total) : HALF;
  const pushA = mul(overlap, shareA);
  const pushB = overlap - pushA;
  const dir = gap < 0 ? -1 : 1;
  a.x = clamp(a.x - dir * pushA, stage.leftPx + halfA, stage.rightPx - halfA);
  b.x = clamp(b.x + dir * pushB, stage.leftPx + halfB, stage.rightPx - halfB);
}

/**
 * @param {number} numFp
 * @param {number} denFp
 * @returns {number}
 */
function limitedDiv(numFp, denFp) {
  if (denFp <= 0) return HALF;
  return Math.floor((numFp * FP_SCALE) / denFp) | 0;
}

/**
 * @param {number} v
 * @param {number} s
 * @returns {number}
 */
function shr(v, s) {
  return Math.floor(v / Math.pow(2, s)) | 0;
}

export { add, sub, clamp, mul, msToTicks, HALF };