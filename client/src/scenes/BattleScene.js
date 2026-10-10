/**
 * Battle scene: renders the arena and fighters, drives the fixed-step
 * controller from Phaser's update loop, and persists the match on completion.
 *
 * @module client/scenes/BattleScene
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENES, COLORS, DEFAULT_MATCHUP } from '../config/index.js';
import { BattleController } from '../battle/BattleController.js';
import { Hud } from '../battle/Hud.js';
import { InputManager } from '../input/InputManager.js';
import { loadProfile, saveProfile, saveReplay } from '../storage/index.js';
import { createGameConfig, createSim, fp } from '@sf/shared'; // eslint-disable-line no-unused-vars

export class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.BATTLE });
    /** @type {import('../config/index.js').Matchup} */
    this.matchup = DEFAULT_MATCHUP;
    /** @type {import('../config/index.js').Difficulty} */
    this.difficulty = 'NORMAL';
    this.seed = 0;
    this.finished = false;
    this.flash = 0;
    /** @type {ReturnType<typeof createGameConfig>} */
    this.cfg = createGameConfig();
    /** @type {BattleController} */
    this.controller = /** @type {any} */ (null);
    /** @type {Hud} */
    this.hud = /** @type {any} */ (null);
    /** @type {InputManager} */
    this.playerInput = /** @type {any} */ (null);
    /** @type {import('phaser').GameObjects.Graphics} */
    this.g = /** @type {any} */ (null);
  }

  /** @param {{matchup?: import('../config/index.js').Matchup, difficulty?: import('../config/index.js').Difficulty, seed?: number}} [data] */
  init(data = {}) {
    this.matchup = data.matchup ?? DEFAULT_MATCHUP;
    this.difficulty = data.difficulty ?? 'NORMAL';
    this.seed = data.seed ?? ((Date.now() & 0x7fffffff) >>> 0);
    this.finished = false;
    this.flash = 0;
  }

  create() {
    this.cfg = createGameConfig();
    this.controller = new BattleController(this.cfg, this.matchup, {
      difficulty: this.difficulty,
      seed: this.seed,
    });
    this.playerInput = new InputManager(this);
    this.hud = new Hud(this, this.matchup);
    this.g = this.add.graphics().setDepth(1);
  }

  /** @param {number} _time @param {number} delta */
  update(_time, delta) {
    if (this.finished) return;
    const events = this.controller.advance(delta, this.playerInput.sample().buttons);
    for (const e of events) {
      if (e.type === 'hit') {
        const kind = e.data.kind;
        if (kind === 'hit' || kind === 'knockdown') this.flash = 6;
      }
    }
    if (this.flash > 0) this.flash -= 1;
    this.draw();
    this.hud.update(this.controller.sim);
    if (this.controller.done) this.finish();
  }

  draw() {
    const sim = this.controller.sim;
    const g = this.g;
    const groundY = fp.toFloat(sim.stage.groundYPx);
    g.clear();

    g.fillStyle(COLORS.ground, 1);
    g.fillRect(0, groundY, GAME_WIDTH, GAME_HEIGHT - groundY);
    g.lineStyle(2, COLORS.groundLine, 1);
    g.lineBetween(0, groundY, GAME_WIDTH, groundY);

    this.drawFighter(sim.p0, COLORS.shadow, groundY);
    this.drawFighter(sim.p1, COLORS.hermit, groundY);
  }

  /**
   * @param {ReturnType<typeof createSim>['p0']} f
   * @param {number} color
   * @param {number} groundY
   */
  drawFighter(f, color, groundY) {
    const g = this.g;
    const x = fp.toFloat(f.x);
    const h = f.config.heightPx;
    const w = f.config.widthPx;
    const yTop = groundY - fp.toFloat(f.y) - h;

    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(x, groundY, w * 1.2, 12);

    g.fillStyle(color, 1);
    g.fillRect(x - w / 2, yTop, w, h);

    if (this.flash > 0 && f.hp <= 0) {
      g.fillStyle(0xffffff, 0.5);
      g.fillRect(x - w / 2, yTop, w, h);
    }

    g.fillStyle(0xffffff, 0.6);
    g.fillRect(f.facing > 0 ? x + w / 2 - 6 : x - w / 2, yTop + 12, 6, 6);

    if (f.blockedHurtbox) {
      g.lineStyle(2, COLORS.block, 1);
      g.strokeRect(x - w / 2 - 2, yTop - 2, w + 4, h + 4);
    }
    if (f.move) {
      g.lineStyle(2, COLORS.hit, 1);
      g.strokeRect(x - w / 2, yTop - 6, w, h + 12);
    }
  }

  finish() {
    this.finished = true;
    this.playerInput.destroy();

    const winner = this.controller.sim.round.matchWinner;
    const replay = this.controller.buildReplay();
    const replayId = saveReplay(replay);

    const playerWon = winner === this.controller.playerSide;
    const reward = playerWon ? this.cfg.progression.winReward : this.cfg.progression.lossReward;

    const profile = loadProfile();
    profile.coins += reward;
    if (playerWon) profile.wins += 1;
    else profile.losses += 1;
    profile.matches.push({
      id: replayId ?? '',
      isoDate: new Date().toISOString(),
      fighterId: this.matchup.p0.fighterId,
      weaponId: this.matchup.p0.weaponId,
      armorId: this.matchup.p0.armorId,
      opponentFighterId: this.matchup.p1.fighterId,
      aiDifficulty: this.difficulty,
      playerWon,
      roundsWon: this.controller.sim.round.p0Rounds,
      roundsLost: this.controller.sim.round.p1Rounds,
      reward,
    });
    if (profile.matches.length > 200) profile.matches.splice(0, profile.matches.length - 200);
    saveProfile(profile);

    this.scene.start(SCENES.RESULT, {
      winner,
      playerSide: this.controller.playerSide,
      matchup: this.matchup,
      difficulty: this.difficulty,
      reward,
      replayId,
    });
  }
}
