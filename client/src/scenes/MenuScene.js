/**
 * Main menu: title, coin balance and the entry points to combat.
 *
 * @module client/scenes/MenuScene
 */

import Phaser from 'phaser';
import { GAME_WIDTH, SCENES, TEXT_COLORS } from '../config/index.js';
import { loadProfile } from '../storage/index.js';
import { tr } from '../i18n/index.js';
import { button } from '../ui/button.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.MENU });
    /** @type {ReturnType<typeof loadProfile>} */
    this.profile = loadProfile();
  }

  /** @param {{profile?: ReturnType<typeof loadProfile>}} [data] */
  init(data = {}) {
    this.profile = data.profile ?? loadProfile();
  }

  create() {
    const cx = GAME_WIDTH / 2;
    this.add
      .text(cx, 150, tr('game.title'), { fontFamily: 'monospace', fontSize: '64px', color: TEXT_COLORS.accent })
      .setOrigin(0.5);

    button(this, cx, 360, tr('menu.play'), () => this.scene.start(SCENES.SELECT, { profile: this.profile }));
    button(this, cx, 430, tr('menu.quit'), () => this.game.destroy(true));

    this.add
      .text(cx, 640, `${tr('profile.coins')}: ${this.profile.coins}`, {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: TEXT_COLORS.text,
      })
      .setOrigin(0.5);
  }
}
