/**
 * Owns one live match: the deterministic simulation, the AI opponent, the
 * fixed-timestep accumulator and the replay recorder. Phaser's update loop
 * feeds it real wall-clock deltas; the sim always advances in exact 60 Hz
 * steps so rendering never affects the outcome.
 *
 * @module client/battle/BattleController
 */

import { createSim, createBot, observe, createMatchRecorder, createGameConfig } from '@sf/shared'; // eslint-disable-line no-unused-vars

const STEP_MS = 1000 / 60;

/** @typedef {import('../config/index.js').Matchup} Matchup */

export class BattleController {
  /**
   * @param {ReturnType<typeof createGameConfig>} cfg
   * @param {Matchup} matchup
   * @param {{ playerSide?:0|1, difficulty?:import('../config/index.js').Difficulty, seed?:number }} [opts]
   */
  constructor(cfg, matchup, opts = {}) {
    this.cfg = cfg;
    this.matchup = matchup;
    this.playerSide = /** @type {0|1} */ (opts.playerSide ?? 0);
    this.aiSide = /** @type {0|1} */ (this.playerSide === 0 ? 1 : 0);
    this.difficulty = opts.difficulty ?? 'NORMAL';
    this.seed = opts.seed ?? 1;

    this.sim = createSim(cfg, matchup);
    const aiWeapon = this.aiSide === 0 ? matchup.p0.weaponId : matchup.p1.weaponId;
    this.bot = createBot(cfg, {
      difficulty: this.difficulty,
      side: this.aiSide,
      seed: this.seed,
      weaponId: aiWeapon,
    });
    const stageId = cfg.stages[0] ? cfg.stages[0].id : '';
    this.recorder = createMatchRecorder(matchup, stageId);

    this.acc = 0;
    this.done = false;
    /** @type {ReturnType<ReturnType<typeof createSim>['step']>} */
    this.events = [];
  }

  /**
   * Advance the simulation with a real-time delta.
   * @param {number} deltaMs
   * @param {number} playerButtons raw BTN mask from the player
   * @returns {ReturnType<ReturnType<typeof createSim>['step']>} events emitted this frame
   */
  advance(deltaMs, playerButtons) {
    this.acc += deltaMs;
    this.events = [];
    while (this.acc >= STEP_MS && !this.done) {
      this.acc -= STEP_MS;
      const aiButtons = this.bot.step(observe(this.sim, this.aiSide)).buttons;
      const p0 = this.playerSide === 0 ? playerButtons : aiButtons;
      const p1 = this.playerSide === 1 ? playerButtons : aiButtons;
      this.recorder.record({ buttons: p0 }, { buttons: p1 });
      this.events.push(...this.sim.step({ buttons: p0 }, { buttons: p1 }));
      if (this.sim.round.matchWinner !== null) this.done = true;
    }
    return this.events;
  }

  /** Seal the recorded inputs into a replay.
   * @returns {ReturnType<ReturnType<typeof createMatchRecorder>['build']>}
   */
  buildReplay() {
    return this.recorder.build({
      createdAt: Date.now(),
      p0Control: this.playerSide === 0 ? 'player' : 'bot',
      p1Control: this.playerSide === 1 ? 'player' : 'bot',
      ...(this.playerSide !== 0 ? { p0Difficulty: this.difficulty } : {}),
      ...(this.playerSide !== 1 ? { p1Difficulty: this.difficulty } : {}),
      ...(this.sim.round.matchWinner === 0 || this.sim.round.matchWinner === 1
        ? { winner: /** @type {0|1} */ (this.sim.round.matchWinner) }
        : {}),
    });
  }
}
