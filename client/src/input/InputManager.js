/**
 * Maps keyboard (and on-screen touch widgets) to a raw BTN bitmask for p0.
 * The manager is deliberately dumb: it only tracks which buttons are held.
 *
 * @module client/input/InputManager
 */

import { KEY_MAP } from '../config/index.js';

export class InputManager {
  /** @param {import('phaser').Scene} scene */
  constructor(scene) {
    this.scene = scene;
    this.buttons = 0;
    this.virtual = 0;
    /** @type {(e: KeyboardEvent) => void} */
    this.onKeyDown = (e) => {
      const bit = KEY_MAP[e.code];
      if (bit === undefined) return;
      this.buttons |= bit;
      if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
    };
    /** @type {(e: KeyboardEvent) => void} */
    this.onKeyUp = (e) => {
      const bit = KEY_MAP[e.code];
      if (bit === undefined) return;
      this.buttons &= ~bit;
    };
    scene.input.keyboard?.on('keydown', this.onKeyDown);
    scene.input.keyboard?.on('keyup', this.onKeyUp);
  }

  /**
   * Set a virtual (on-screen) button state, e.g. from a touch widget.
   * @param {number} bit
   * @param {boolean} down
   */
  setVirtual(bit, down) {
    if (down) this.virtual |= bit;
    else this.virtual &= ~bit;
  }

  /** @returns {{ buttons: number }} */
  sample() {
    return { buttons: this.buttons | this.virtual };
  }

  /** Release every held button (used when a scene loses focus). */
  reset() {
    this.buttons = 0;
    this.virtual = 0;
  }

  destroy() {
    this.scene.input.keyboard?.off('keydown', this.onKeyDown);
    this.scene.input.keyboard?.off('keyup', this.onKeyUp);
    this.reset();
  }
}
