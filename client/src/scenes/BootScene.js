/**
 * Boot scene: load the local profile, wire the audio mixer and move to menu.
 * No external assets ship yet, so nothing is preloaded here.
 *
 * @module client/scenes/BootScene
 */

import Phaser from 'phaser';
import { SCENES } from '../config/index.js';
import { loadProfile } from '../storage/index.js';
import { audio } from '../audio/AudioManager.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.BOOT });
  }

  create() {
    const profile = loadProfile();
    audio.attach(this);
    audio.setVolumes({
      master: profile.settings.masterVolume,
      music: profile.settings.musicVolume,
      sfx: profile.settings.sfxVolume,
    });
    this.scene.start(SCENES.MENU, { profile });
  }
}
