/**
 * AI difficulty parameters. Difficulty changes only perception and decision
 * parameters — never combat stats of the bot's fighter.
 *
 * @module shared/config/ai
 */

/** @type {Record<import('./types.js').Difficulty, import('./types.js').AiConfig>} */
export const AI_CONFIGS = {
  EASY: {
    difficulty: 'EASY',
    reactionDelayMs: 350,
    decisionsPerSecond: 4,
    inputLatencyMs: 160,
    inputJitterMs: 90,
    aimErrorPx: 46,
    stateReadErrorChance: 0.32,
    aggression: 0.42,
    defense: 0.55,
    spacing: 0.5,
    punish: 0.35,
    whiffPunish: 0.2,
    comboFollowup: 0.25,
    throwWhenBlocked: 0.12,
    superThreshold: 0.95,
    blockReactionChance: 0.35,
    jumpUsage: 0.25,
    dashUsage: 0.3,
    rngSeed: 1013904223,
  },
  NORMAL: {
    difficulty: 'NORMAL',
    reactionDelayMs: 200,
    decisionsPerSecond: 8,
    inputLatencyMs: 90,
    inputJitterMs: 45,
    aimErrorPx: 24,
    stateReadErrorChance: 0.15,
    aggression: 0.6,
    defense: 0.6,
    spacing: 0.55,
    punish: 0.6,
    whiffPunish: 0.45,
    comboFollowup: 0.5,
    throwWhenBlocked: 0.25,
    superThreshold: 0.8,
    blockReactionChance: 0.6,
    jumpUsage: 0.35,
    dashUsage: 0.45,
    rngSeed: 2236111171,
  },
  HARD: {
    difficulty: 'HARD',
    reactionDelayMs: 100,
    decisionsPerSecond: 15,
    inputLatencyMs: 45,
    inputJitterMs: 20,
    aimErrorPx: 10,
    stateReadErrorChance: 0.05,
    aggression: 0.72,
    defense: 0.7,
    spacing: 0.6,
    punish: 0.85,
    whiffPunish: 0.75,
    comboFollowup: 0.78,
    throwWhenBlocked: 0.38,
    superThreshold: 0.65,
    blockReactionChance: 0.85,
    jumpUsage: 0.45,
    dashUsage: 0.6,
    rngSeed: 3735928559,
  },
};

/**
 * @param {import('./types.js').Difficulty} d
 * @returns {import('./types.js').AiConfig}
 * @throws {RangeError} on unknown difficulty
 */
export function getAiConfig(d) {
  const c = AI_CONFIGS[d];
  if (!c) throw new RangeError(`unknown difficulty: ${d}`);
  return c;
}
