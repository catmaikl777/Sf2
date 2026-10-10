/**
 * Select screen: pick difficulty and weapon, then start the match. The
 * opponent is always a bot (single-player game).
 *
 * @module client/scenes/SelectScene
 */

import Phaser from 'phaser';
import { GAME_WIDTH, SCENES, TEXT_COLORS, ROSTER, DEFAULT_MATCHUP } from '../config/index.js';
import { loadProfile } from '../storage/index.js';
import { tr } from '../i18n/index.js';
import { button } from '../ui/button.js';
import { getWeapon } from '@sf/shared';

/** @type {import('../config/index.js').Difficulty[]} */
const DIFFICULTIES = ['EASY', 'NORMAL', 'HARD'];

export class SelectScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.SELECT });
    /** @type {ReturnType<typeof loadProfile>} */
    this.profile = loadProfile();
    /** @type {import('../config/index.js').Difficulty} */
    this.difficulty = 'NORMAL';
    this.weaponIdx = 0;
    /** @type {import('phaser').GameObjects.Text[]} */
    this.diffTexts = [];
    /** @type {import('phaser').GameObjects.Text} */
    this.weaponText = /** @type {any} */ (null);
  }

  /** @param {{profile?: ReturnType<typeof loadProfile>}} [data] */
  init(data = {}) {
    this.profile = data.profile ?? loadProfile();
    this.difficulty = this.profile.settings.difficulty;
    this.weaponIdx = 0;
    this.diffTexts = [];
  }

  create() {
    const cx = GAME_WIDTH / 2;
    this.add
      .text(cx, 110, tr('select.weapon'), { fontFamily: 'monospace', fontSize: '30px', color: TEXT_COLORS.text })
      .setOrigin(0.5);

    this.diffTexts = DIFFICULTIES.map((d, i) => {
      const t = this.add
        .text(cx + (i - 1) * 230, 240, tr(`difficulty.${d}`), { fontFamily: 'monospace', fontSize: '28px', color: TEXT_COLORS.dim })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => {
        this.difficulty = d;
        this.refresh();
      });
      return t;
    });

    this.weaponText = this.add
      .text(cx, 380, '', { fontFamily: 'monospace', fontSize: '32px', color: TEXT_COLORS.accent })
      .setOrigin(0.5);
    button(this, cx - 300, 380, '<', () => this.cycleWeapon(-1));
    button(this, cx + 300, 380, '>', () => this.cycleWeapon(1));

    button(this, cx, 520, tr('select.start'), () => this.start());
    button(this, cx, 590, tr('select.back'), () => this.scene.start(SCENES.MENU, { profile: this.profile }));

    this.refresh();
  }

  /** @param {number} d */
  cycleWeapon(d) {
    const n = ROSTER.weapons.length;
    this.weaponIdx = (this.weaponIdx + d + n) % n;
    this.refresh();
  }

  refresh() {
    DIFFICULTIES.forEach((d, i) => {
      const t = this.diffTexts[i];
      if (t) t.setColor(d === this.difficulty ? TEXT_COLORS.accent : TEXT_COLORS.dim);
    });
    const wid = ROSTER.weapons[this.weaponIdx] ?? 'w_unarmed';
    this.weaponText.setText(tr(getWeapon(wid).nameKey));
  }

  start() {
    const wid = ROSTER.weapons[this.weaponIdx] ?? 'w_unarmed';
    const matchup = {
      p0: { ...DEFAULT_MATCHUP.p0, weaponId: wid },
      p1: { ...DEFAULT_MATCHUP.p1 },
    };
    this.scene.start(SCENES.BATTLE, { matchup, difficulty: this.difficulty, profile: this.profile });
  }
}
