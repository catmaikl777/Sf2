/**
 * Public surface of @sf/shared. The client and the tests import everything
 * combat-related through this entry point.
 *
 * @module shared
 */

export * from './constants.js';
export * as fp from './fp.js';
export { createRng } from './rng.js';
export * as aabb from './aabb.js';
export * from './config/index.js';
export { PROFILE_VERSION, defaultProfile, migrateProfile, profileStats } from './profile/profileSchema.js';
export { createSim } from './sim/sim.js';
export { createMatcher } from './sim/matcher.js';
export { createBot, observe } from './ai/index.js';
export * from './replay/index.js';
