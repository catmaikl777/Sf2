/**
 * Client entry point: boot the Phaser game with the five scenes.
 *
 * @module client/main
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from './config/index.js';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { SelectScene } from './scenes/SelectScene.js';
import { BattleScene } from './scenes/BattleScene.js';
import { ResultScene } from './scenes/ResultScene.js';

export const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: COLORS.bg,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, SelectScene, BattleScene, ResultScene],
});

export default game;
