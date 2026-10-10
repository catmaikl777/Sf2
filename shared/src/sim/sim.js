/**
 * Deterministic battle simulation orchestrator. Owns the two fighters, their
 * combo matchers, and the round state machine. step() consumes per-tick input
 * pairs and produces per-tick events; identical inputs always yield identical
 * state and events, so replays are bit-exact.
 *
 * @module shared/sim/sim
 */

import { BTN, PX } from '../constants.js';
import { add, sub, mul, div, clamp } from '../fp.js';
import {
  createFighter,
  setState,
  startBlock,
  startMove,
  endMove,
  pickDirectMove,
  separate,
  isGrounded,
} from './fighter.js';
import { resolveHit, windowActive } from './combat.js';
import { createRoundState, stepRound } from './round.js';
import { createMatcher } from './matcher.js';
import { combosForWeapon } from '../config/combos.js';
import { getFighter, getWeapon, getArmor } from '../config/index.js';
import { DEFAULT_STAGE_ID } from '../config/stages.js';

/** Knocked-back velocity is quartered each tick (friction). */
const FRICTION_DIV = 4;

/**
 * @typedef {Object} SimEvent
 * @property {number} tick
 * @property {string} type  'state'|'move'|'hit'|'round'|'energy'
 * @property {Record<string, unknown>} data
 */

/**
 * @typedef {Object} SimSetup
 * @property {{fighterId:string, weaponId:string, armorId:string}} p0
 * @property {{fighterId:string, weaponId:string, armorId:string}} p1
 */

/**
 * @typedef {Object} Sim
 * @property {import('./types.js').FighterState} p0
 * @property {import('./types.js').FighterState} p1
 * @property {import('./round.js').RoundState} round
 * @property {number} tick
 * @property {import('./types.js').StageBounds} stage
 * @property {(p0In:{buttons:number}, p1In:{buttons:number}) => SimEvent[]} step
 * @property {(side:0|1, moveId:string) => boolean} queueMove
 * @property {(side:0|1) => number} positionX
 * @property {(side:0|1) => number} hp
 */

/**
 * Create a match simulation.
 * @param {import('../config/types.js').GameConfig} cfg
 * @param {SimSetup} setup
 * @returns {Sim}
 */
export function createSim(cfg, setup) {
  const stageCfg = cfg.stages.find((s) => s.id === DEFAULT_STAGE_ID) ?? cfg.stages[0];
  if (!stageCfg) throw new RangeError('no stage configured');

  const stage = {
    leftPx: PX(stageCfg.leftPx),
    rightPx: PX(stageCfg.rightPx),
    groundYPx: PX(stageCfg.groundYPx),
  };

  /** @param {{fighterId:string}} p @returns {number} */
  const halfWidth = (p) => PX(getFighter(p.fighterId).widthPx) >> 1;

  /** @param {import('./types.js').StageBounds} stg @param {number} t @param {number} halfW @returns {number} */
  const spawnX = (stg, t, halfW) => {
    const from = stg.leftPx + halfW;
    const to = stg.rightPx - halfW;
    return add(from, Math.floor((to - from) * t));
  };

  const f0 = createFighter(getFighter(setup.p0.fighterId), getWeapon(setup.p0.weaponId), getArmor(setup.p0.armorId), spawnX(stage, 0.35, halfWidth(setup.p0)), 1);
  const f1 = createFighter(getFighter(setup.p1.fighterId), getWeapon(setup.p1.weaponId), getArmor(setup.p1.armorId), spawnX(stage, 0.65, halfWidth(setup.p1)), -1);

  const matcher0 = createMatcher(combosForWeapon(f0.weapon.weaponClass));
  const matcher1 = createMatcher(combosForWeapon(f1.weapon.weaponClass));
  const fighters = [f0, f1];

  /** Index into the constant pair of fighters without undefined checks.
   * @param {0|1} side
   * @returns {import('./types.js').FighterState}
   */
  const getF = (side) => (side === 0 ? f0 : f1);

  /** @param {0|1} side @returns {import('../config/types.js').MoveConfig[]} */
  const getMoveset = (side) => (side === 0 ? movesets0 : movesets1);

  const round = createRoundState(cfg.rounds);
  const moveById = new Map(cfg.moves.map((m) => [m.id, m]));
  const movesets0 = /** @type {import('../config/types.js').MoveConfig[]} */ (f0.weapon.moveIds.map((id) => moveById.get(id)).filter(Boolean));
  const movesets1 = /** @type {import('../config/types.js').MoveConfig[]} */ (f1.weapon.moveIds.map((id) => moveById.get(id)).filter(Boolean));
  /** @type {SimEvent[]} */
  const buf = [];
  let tick = 0;

  /**
   * @param {string} type
   * @param {Record<string, unknown>} data
   */
  const emit = (type, data) => {
    buf.push({ tick, type, data });
  };

  /**
   * Decide and start a move for a fighter when its state allows.
   * @param {0|1} side
   * @param {number} buttons
   * @param {number} prevButtons
   */
  const tryStartMove = (side, buttons, prevButtons) => {
    const f = getF(side);
    const move = pickDirectMove(getMoveset(side), { buttons }, prevButtons, f.facing, stanceOf(f));
    if (!move) return;
    if (move.isSuper && f.energy < move.energyCost) return;
    startMove(f, move, false);
    emit('move', { side, moveId: move.id });
  };

  /** @param {import('./types.js').FighterState} f
   * @returns {'stand'|'crouch'|'air'}
   */
  const stanceOf = (f) => (isGrounded(f) ? (f.state === 'crouch' ? 'crouch' : 'stand') : 'air');

  /**
   * @param {0|1} side
   * @param {{buttons:number}} input
   */
  const handleFighter = (side, input) => {
    const f = getF(side);
    const m = f.move;
    if (m) {
      // advance attacking move
      m.tick++;
      const t = m.timing;
      if (m.tick >= t.totalTicks) {
        endMove(f);
        emit('state', { side, state: f.state });
        return;
      }
      if (m.tick < t.startActiveTick) {
        f.x = add(f.x, t.move.advance * f.facing);
      }
      f.vx = 0;
      f.pendingCancel = m.tick >= t.cancelStartTick && m.tick < t.cancelEndTick;
      return;
    }

    // victim states
    if (f.state === 'hitstun' || f.state === 'blockstun') {
      f.stunTicks = Math.max(0, f.stunTicks - 1);
      if (f.stunTicks === 0) {
        setState(f, 'idle');
        f.blockedHurtbox = false;
        emit('state', { side, state: 'idle' });
      }
      return;
    }
    if (f.state === 'knockdown') {
      advanceKnockdown(f, side);
      return;
    }

    // control states
    controlState(side, f, input.buttons);
    tryStartMove(side, input.buttons, f.lastButtons);
    f.lastButtons = input.buttons;
  };

  /**
   * @param {import('./types.js').FighterState} f
   * @param {0|1} side
   */
  const advanceKnockdown = (f, side) => {
    f.victimTicksRemaining = Math.max(0, f.victimTicksRemaining - 1);
    // internal vy is positive up; config gravity is positive down
    f.vy = sub(f.vy, f.config.gravity);
    f.y = add(f.y, f.vy);
    if (f.y > 0) return;
    f.y = 0;
    f.vy = 0;
    if (f.hp <= 0) {
      setState(f, 'dead');
      emit('state', { side, state: 'dead' });
    } else {
      setState(f, 'idle');
      emit('state', { side, state: 'idle' });
    }
  };

  /**
   * Idle/walk/crouch/jump/block control from held buttons.
   * @param {0|1} side
   * @param {import('./types.js').FighterState} f
   * @param {number} buttons
   */
  const controlState = (side, f, buttons) => {
    const down = (buttons & BTN.DOWN) !== 0;
    const heldJump = (buttons & BTN.JUMP) !== 0;
    const heldBlock = (buttons & BTN.BLOCK) !== 0;
    const left = (buttons & BTN.LEFT) !== 0;
    const right = (buttons & BTN.RIGHT) !== 0;

    // internal vy is positive up; config jumpVelocity is negative up and
    // gravity is positive down
    const inAir = f.y > 0;
    if (!inAir && heldJump) {
      f.vy = -f.config.jumpVelocity;
      setState(f, 'jump');
      emit('state', { side, state: 'jump' });
    }
    if (inAir || f.vy > 0) {
      f.vy = sub(f.vy, f.config.gravity);
      f.y = add(f.y, f.vy);
      if (f.y <= 0) {
        f.y = 0;
        f.vy = 0;
        setState(f, 'idle');
      }
      // air control only sets vx; the motion pass applies it once
      if (left) f.vx = -mul(f.config.walkSpeed, PX(1));
      else if (right) f.vx = mul(f.config.walkSpeed, PX(1));
      else f.vx = 0;
      return;
    }

    // grounded control
    if (heldBlock) {
      startBlock(f);
      setState(f, 'block');
      emit('state', { side, state: 'block' });
      f.vx = 0;
      return;
    }
    if (down) {
      setState(f, 'crouch');
      f.vx = 0;
      return;
    }

    let vx = 0;
    if (right !== left) {
      const fwd = (right && f.facing > 0) || (left && f.facing < 0);
      const base = fwd ? f.config.walkSpeed : f.config.backSpeed;
      const spd = mul(base, f.armor.speedPenalty);
      vx = (right && !left) ? spd : -spd;
      setState(f, 'walk');
      emit('state', { side, state: 'walk' });
    } else {
      setState(f, 'idle');
      emit('state', { side, state: 'idle' });
    }
    f.vx = vx;
  };

  /**
   * Resolve every active hitbox of the attacker against the defender.
   * @param {import('./types.js').FighterState} attacker
   * @param {import('./types.js').FighterState} defender
   */
  const resolveCombat = (attacker, defender) => {
    const ms = attacker.move;
    if (!ms) return;
    const t = ms.timing;
    for (let i = 0; i < t.hitboxes.length; i++) {
      const h = /** @type {import('./types.js').HitboxTiming} */ (t.hitboxes[i]);
      if (ms.consumed[i] || !windowActive(h, ms.tick)) continue;
      const res = resolveHit(attacker, defender, h, t, ms);
      if (res.kind === 'whiff' || res.kind === 'invulnerable') continue;
      emit('hit', { side: attacker === f0 ? 0 : 1, target: defender === f0 ? 0 : 1, moveId: res.moveId, kind: res.kind, damage: res.damage, blockDamage: res.blockDamage });
      // a consumed knockdown/clean hit ends multi-hit windows
      if (res.kind === 'knockdown') break;
    }
  };

  /**
   * Step the whole simulation one tick.
   * @param {{buttons:number}} p0In
   * @param {{buttons:number}} p1In
   * @returns {SimEvent[]}
   */
  const step = (p0In, p1In) => {
    tick++;
    buf.length = 0;

    if (round.phase === 'fighting') {
      // face the opponent
      for (const side of [0, 1]) {
        const f = getF(/** @type {0|1} */ (side));
        const o = getF(/** @type {0|1} */ (1 - side));
        const mat = side === 0 ? matcher0 : matcher1;
        const inp = side === 0 ? p0In : p1In;
        if (!f.move && f.state !== 'hitstun' && f.state !== 'blockstun' && f.state !== 'knockdown') {
          if (Math.abs(o.x - f.x) > PX(2)) f.facing = o.x > f.x ? 1 : -1;
        }
        // feed inputs into the sticky matcher (held buttons produce tokens)
        mat.push(inp.buttons, f.facing, tick);
      }

      // first pass: state, movement, move execution
      handleFighter(0, p0In);
      handleFighter(1, p1In);

      // matcher-derived combos (only when controllable, after direct pass)
      for (const side of [0, 1]) {
        const f = getF(/** @type {0|1} */ (side));
        const mat = side === 0 ? matcher0 : matcher1;
        if (f.move || f.state === 'hitstun' || f.state === 'blockstun' || f.state === 'knockdown' || f.state === 'dead') continue;
        const combo = mat.poll(tick);
        if (!combo) continue;
        const mv = moveById.get(combo.moveId);
        if (!mv) continue;
        if (mv.isSuper && f.energy < mv.energyCost) continue;
        startMove(f, mv, false);
        emit('move', { side, moveId: mv.id, combo: true });
        mat.clear();
      }

      // motion pass: apply horizontal velocities exactly once (walk, knockback)
      for (const f of fighters) {
        if (f.move) continue;
        f.x = clamp(f.x + f.vx, stage.leftPx + (f.hurtRectW >> 1), stage.rightPx - (f.hurtRectW >> 1));
        f.vx = sub(f.vx, div(f.vx, FRICTION_DIV));
      }

      // soft collision
      separate(f0, f1, stage);

      // combat resolution
      resolveCombat(f0, f1);
      resolveCombat(f1, f0);
    }

    const flags = { p0Dead: f0.hp <= 0 || f0.state === 'dead', p1Dead: f1.hp <= 0 || f1.state === 'dead' };
    const trans = stepRound(round, cfg.rounds, flags);

    // A round was decided (KO or timeout): both leave winner null for a
    // timeout draw-only outcome that we resolve by remaining HP share.
    if (trans === 'outro' && round.winner === null) {
      const p0share = f0.hp * f1.maxHp;
      const p1share = f1.hp * f0.maxHp;
      round.winner = /** @type {0|1} */ (p0share >= p1share ? 0 : 1);
      scoreRound(/** @type {0|1} */ (round.winner));
    }
    if (trans === 'outro' || trans === 'matchEnd') {
      emit('round', { kind: round.matchWinner !== null ? 'match' : 'round', phase: round.phase, winner: round.winner, reason: round.endReason });
    } else if (trans === 'nextRound') {
      resetRound();
      emit('round', { kind: 'round', phase: round.phase, winner: null, reason: null });
    }

    return buf.slice();
  };

  /**
   * Reset fighters between rounds: full HP and original formation.
   */
  const resetRound = () => {
    /** @param {import('./types.js').FighterState} f */
    const setupState = (f) => {
      f.hp = f.maxHp;
      f.energy = cfg.rounds.startingEnergy;
      f.x = f === f0 ? spawnX(stage, 0.35, halfWidth(setup.p0)) : spawnX(stage, 0.65, halfWidth(setup.p1));
      f.y = 0;
      f.vx = 0;
      f.vy = 0;
      f.facing = f === f0 ? 1 : -1;
      f.move = null;
      f.hitstopTicks = 0;
      f.blockTicks = 0;
      f.blockReleaseTicks = 0;
      f.blockedHurtbox = false;
      f.comboTicks = 0;
      f.hitsDealt = 0;
      f.stunTicks = 0;
      f.lastButtons = 0;
      f.pendingCancel = false;
      f.victimTicksRemaining = 0;
      f.lastComboMove = null;
      setState(f, 'idle');
    };
    setupState(f0);
    setupState(f1);
    matcher0.clear();
    matcher1.clear();
  };

  /**
   * Credit a round win and flag the total-victory condition.
   * @param {0|1} winner
   */
  const scoreRound = (winner) => {
    if (winner === 0) round.p0Rounds++;
    else round.p1Rounds++;
    if (round.p0Rounds >= cfg.rounds.roundsToWin || round.p1Rounds >= cfg.rounds.roundsToWin) {
      round.matchWinner = winner;
    }
  };

  /**
   * Queue a move directly by id (bots/tests use this).
   * @param {0|1} side
   * @param {string} moveId
   * @returns {boolean}
   */
  const queueMove = (side, moveId) => {
    const mv = moveById.get(moveId);
    if (!mv) return false;
    const f = getF(side);
    if (f.move || f.state === 'hitstun' || f.state === 'blockstun' || f.state === 'knockdown' || f.state === 'dead') return false;
    if (mv.isSuper && f.energy < mv.energyCost) return false;
    startMove(f, mv, false);
    emit('move', { side, moveId: mv.id, queued: true });
    return true;
  };

  return {
    p0: f0,
    p1: f1,
    round,
    get tick() {
      return tick;
    },
    stage,
    step,
    queueMove,
    positionX: (side) => getF(side).x,
    hp: (side) => getF(side).hp,
  };
}