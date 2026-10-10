/**
 * Minimal text-button factory shared by the menu and select scenes.
 *
 * @module client/ui/button
 */

import { TEXT_COLORS } from '../config/index.js';

/**
 * @param {import('phaser').Scene} scene
 * @param {number} x
 * @param {number} y
 * @param {string} label
 * @param {() => void} onClick
 * @returns {import('phaser').GameObjects.Text}
 */
export function button(scene, x, y, label, onClick) {
  const t = scene.add
    .text(x, y, label, { fontFamily: 'monospace', fontSize: '26px', color: TEXT_COLORS.text })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });
  t.on('pointerover', () => t.setColor(TEXT_COLORS.accent));
  t.on('pointerout', () => t.setColor(TEXT_COLORS.text));
  t.on('pointerdown', () => onClick());
  return t;
}
