/**
 * Stage list: geometry used by the simulation, asset keys used by the client.
 *
 * @module shared/config/stages
 */

/** @type {import('./types.js').StageConfig[]} */
export const STAGES = [
  {
    id: 'dojang',
    nameKey: 'stage.dojang',
    leftPx: 60,
    rightPx: 1220,
    groundYPx: 620,
    backgroundKey: 'bg_dojang',
    musicKey: 'music_dojang',
    ambientLight: 45875,
  },
  {
    id: 'bamboo',
    nameKey: 'stage.bamboo',
    leftPx: 60,
    rightPx: 1220,
    groundYPx: 620,
    backgroundKey: 'bg_bamboo',
    musicKey: 'music_bamboo',
    ambientLight: 39322,
  },
  {
    id: 'shrine',
    nameKey: 'stage.shrine',
    leftPx: 60,
    rightPx: 1220,
    groundYPx: 620,
    backgroundKey: 'bg_shrine',
    musicKey: 'music_shrine',
    ambientLight: 32768,
  },
];

export const DEFAULT_STAGE_ID = 'dojang';

/**
 * @param {string} id
 * @returns {import('./types.js').StageConfig}
 * @throws {RangeError} when the id is unknown
 */
export function getStage(id) {
  const s = STAGES.find((x) => x.id === id);
  if (!s) throw new RangeError(`unknown stage id: ${id}`);
  return s;
}
