/**
 * Audio manager. It owns the mix volumes and provides a stable API for music
 * and SFX cues. No audio assets ship yet, so playback is a graceful no-op; the
 * volume model and key lookups are already wired so assets can be dropped in
 * without touching the scenes.
 *
 * @module client/audio/AudioManager
 */

export class AudioManager {
  constructor() {
    this.master = 80;
    this.music = 60;
    this.sfx = 85;
    /** @type {import('phaser').Scene|null} */
    this.scene = null;
    /** @type {import('phaser').Sound.BaseSound|null} */
    this.currentMusic = null;
  }

  /** @param {import('phaser').Scene} scene */
  attach(scene) {
    this.scene = scene;
  }

  /**
   * @param {{master?:number, music?:number, sfx?:number}} volumes 0..100
   */
  setVolumes(volumes) {
    if (typeof volumes.master === 'number') this.master = volumes.master;
    if (typeof volumes.music === 'number') this.music = volumes.music;
    if (typeof volumes.sfx === 'number') this.sfx = volumes.sfx;
  }

  /** @param {string} key @param {number} [volume] 0..100 */
  play(key, volume = this.sfx) {
    if (!this.scene || !key) return;
    const snd = /** @type {import('phaser').Sound.BaseSound | null} */ (this.scene.sound.get(key));
    if (!snd) return;
    snd.play({ volume: (volume / 100) * (this.master / 100) });
  }

  /** @param {string} key */
  playMusic(key) {
    if (!this.scene || !key) return;
    this.stopMusic();
    const snd = /** @type {import('phaser').Sound.BaseSound | null} */ (this.scene.sound.get(key));
    if (!snd) return;
    snd.play({ loop: true, volume: (this.music / 100) * (this.master / 100) });
    this.currentMusic = snd;
  }

  stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic = null;
    }
  }
}

export const audio = new AudioManager();
