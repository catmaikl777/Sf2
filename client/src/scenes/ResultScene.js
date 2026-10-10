/**
 * Result screen: outcome banner, reward and rematch/menu actions.
 *
 * @module client/scenes/ResultScene
 */

import Phaser from 'phaser';
import { GAME_WIDTH, SCENES, TEXT_COLORS, DEFAULT_MATCHUP } from '../config/index.js';
import { tr } from '../i18n/index.js';
import { button } from '../ui/button.js';

export class ResultScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.RESULT });
    this.winner = null;
    this.playerSide = 0;
    /** @type {import('../config/index.js').Matchup} */
    this.matchup = DEFAULT_MATCHUP;
    /** @type {import('../config/index.js').Difficulty} */
    this.difficulty = 'NORMAL';
    this.reward = 0;
  }

  /** @param {{winner?: 0|1|null, playerSide?: 0|1, matchup?: import('../config/index.js').Matchup, difficulty?: import('../config/index.js').Difficulty, reward?: number}} [data] */
  init(data = {}) {
    this.winner = data.winner ?? null;
    this.playerSide = data.playerSide ?? 0;
    this.matchup = data.matchup ?? DEFAULT_MATCHUP;
    this.difficulty = data.difficulty ?? 'NORMAL';
    this.reward = data.reward ?? 0;
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const playerWon = this.winner === this.playerSide;
    const draw = this.winner === null;
    const label = draw ? tr('round.draw') : playerWon ? tr('round.win') : tr('round.lose');

    this.add
      .text(cx, 240, label, {
        fontFamily: 'monospace',
        fontSize: '72px',
        color: playerWon ? TEXT_COLORS.accent : TEXT_COLORS.hp,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 350, tr('result.reward', { amount: this.reward }), {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: TEXT_COLORS.text,
      })
      .setOrigin(0.5);

    button(this, cx, 480, tr('result.rematch'), () =>
      this.scene.start(SCENES.BATTLE, { matchup: this.matchup, difficulty: this.difficulty }),
    );
    button(this, cx, 550, tr('result.menu'), () => this.scene.start(SCENES.MENU));
  }
}
