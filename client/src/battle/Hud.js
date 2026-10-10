/**
 * Battle HUD: health/energy bars, round pips and the round timer. Drawn with
 * plain shapes and text so it works before any art exists.
 *
 * @module client/battle/Hud
 */

import { GAME_WIDTH, COLORS, TEXT_COLORS } from '../config/index.js';
import { tr } from '../i18n/index.js';
import { getFighter, createSim } from '@sf/shared'; // eslint-disable-line no-unused-vars

const MARGIN = 36;
const TOP = 30;
const BAR_W = 400;
const BAR_H = 24;
const ENERGY_H = 9;
const PIP = 12;

export class Hud {
  /**
   * @param {import('phaser').Scene} scene
   * @param {import('../config/index.js').Matchup} matchup
   */
  constructor(scene, matchup) {
    this.scene = scene;
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(10);

    const p0Key = getFighter(matchup.p0.fighterId).nameKey;
    const p1Key = getFighter(matchup.p1.fighterId).nameKey;

    this.name0 = scene.add
      .text(MARGIN, TOP - 22, tr(p0Key), { fontFamily: 'monospace', fontSize: '18px', color: TEXT_COLORS.text })
      .setDepth(11);
    this.name1 = scene.add
      .text(GAME_WIDTH - MARGIN, TOP - 22, tr(p1Key), { fontFamily: 'monospace', fontSize: '18px', color: TEXT_COLORS.text })
      .setOrigin(1, 0)
      .setDepth(11);
    this.timer = scene.add
      .text(GAME_WIDTH / 2, TOP - 6, '60', { fontFamily: 'monospace', fontSize: '30px', color: TEXT_COLORS.accent })
      .setOrigin(0.5, 0)
      .setDepth(11);
  }

  /** @param {ReturnType<typeof createSim>} sim */
  update(sim) {
    const g = this.graphics;
    g.clear();

    this.bar(g, MARGIN, sim.p0.hp / sim.p0.maxHp, sim.p0.energy / sim.p0.maxEnergy, false);
    this.bar(g, GAME_WIDTH - MARGIN - BAR_W, sim.p1.hp / sim.p1.maxHp, sim.p1.energy / sim.p1.maxEnergy, true);

    const seconds = Math.ceil(sim.round.roundTimerTicks / 60);
    this.timer.setText(String(seconds));

    this.pips(MARGIN, sim.round.p0Rounds, false);
    this.pips(GAME_WIDTH - MARGIN, sim.round.p1Rounds, true);
  }

  /**
   * @param {import('phaser').GameObjects.Graphics} g
   * @param {number} x
   * @param {number} hpFrac
   * @param {number} energyFrac
   * @param {boolean} mirrored
   */
  bar(g, x, hpFrac, energyFrac, mirrored) {
    g.fillStyle(COLORS.barBg, 1);
    g.fillRect(x, TOP, BAR_W, BAR_H);
    g.fillRect(x, TOP + BAR_H + 4, BAR_W, ENERGY_H);

    const hpW = Math.max(0, Math.min(1, hpFrac)) * BAR_W;
    g.fillStyle(hpFrac <= 0.3 ? COLORS.hpLow : COLORS.hp, 1);
    g.fillRect(mirrored ? x + BAR_W - hpW : x, TOP, hpW, BAR_H);

    const enW = Math.max(0, Math.min(1, energyFrac)) * BAR_W;
    g.fillStyle(COLORS.energy, 1);
    g.fillRect(mirrored ? x + BAR_W - enW : x, TOP + BAR_H + 4, enW, ENERGY_H);
  }

  /**
   * @param {number} x
   * @param {number} won
   * @param {boolean} mirrored
   */
  pips(x, won, mirrored) {
    const g = this.graphics;
    const y = TOP + BAR_H + ENERGY_H + 10;
    for (let i = 0; i < 2; i++) {
      const px = mirrored ? x - PIP - i * (PIP + 4) : x + i * (PIP + 4);
      g.fillStyle(i < won ? COLORS.accent : COLORS.barBg, 1);
      g.fillRect(px, y, PIP, PIP);
    }
  }

  destroy() {
    this.graphics.destroy();
    this.name0.destroy();
    this.name1.destroy();
    this.timer.destroy();
  }
}
