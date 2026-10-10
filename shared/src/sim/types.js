/**
 * JSDoc type definitions for the deterministic combat simulation. The sim is
 * a pure state machine driven by per-tick input frames; it never touches the
 * DOM, Date or Math.random, so a replay is bit-exact.
 *
 * @module shared/sim/types
 */

/**
 * One fighter's input for a single 60 Hz tick: a bitmask of BTN flags.
 *
 * @typedef {{ buttons: number }} InputFrame
 */

/**
 * Both fighters' inputs for one tick.
 *
 * @typedef {{ p0: number, p1: number }} TickInput
 */

/**
 * Facing: +1 looks right, -1 looks left.
 *
 * @typedef {-1|1} Facing
 */

/**
 * Precomputed integer tick timeline for one move. Converted once from the
 * millisecond config so the hot loop only does integer comparisons.
 *
 * @typedef {Object} HitboxTiming
 * @property {number} startTick        inclusive tick offset of the window
 * @property {number} endTick          exclusive tick offset of the window
 * @property {import('../config/types.js').HitboxWindow} window  original data
 */

/**
 * Precomputed integer tick timeline for one move.
 *
 * @typedef {Object} MoveTiming
 * @property {import('../config/types.js').MoveConfig} move
 * @property {number} startupTicks
 * @property {number} activeTicks
 * @property {number} recoveryTicks
 * @property {number} totalTicks        startup + active + recovery
 * @property {number} startActiveTick   == startupTicks
 * @property {number} startRecoveryTick == startupTicks + activeTicks
 * @property {number} cancelStartTick   recovery-relative cancel window open
 * @property {number} cancelEndTick     recovery-relative cancel window close
 * @property {number} advance           Q16.16 forward slide on start
 * @property {HitboxTiming[]} hitboxes
 */

/**
 * Runtime state of a single fighter inside a round.
 *
 * @typedef {Object} FighterState
 * @property {string} fighterId
 * @property {import('../config/types.js').FighterConfig} config
 * @property {import('../config/types.js').WeaponConfig} weapon
 * @property {import('../config/types.js').ArmorConfig} armor
 * @property {number} x                 Q16.16 world x of feet center
 * @property {number} y                 Q16.16 height above ground (0 = grounded)
 * @property {number} vx                Q16.16 horizontal velocity px/tick
 * @property {number} vy                Q16.16 vertical velocity px/tick
 * @property {Facing} facing
 * @property {number} hp                integer hit points
 * @property {number} maxHp             integer
 * @property {number} energy            integer energy points
 * @property {number} maxEnergy         integer
 * @property {import('../config/types.js').FighterState} state
 * @property {number} stateTicks        ticks since the state began
 * @property {import('../config/types.js').FighterState} prevState
 * @property {number} prevStateTicks
 * @property {MoveState|null} move      non-null while attacking
 * @property {number} hitstopTicks      leftover freeze from a landed window
 * @property {number} blockTicks        holding block
 * @property {number} blockReleaseTicks cooldown before block re-engage
 * @property {boolean} blockedHurtbox    True while blocking (smaller hurtbox)
 * @property {number} comboTicks        ticks since the last landed hit
 * @property {number} hitsDealt         hits landed this round
 * @property {number} roundsWon         rounds won this match
 * @property {number} hurtRectW         Q16.16 hurtbox width
 * @property {number} hurtRectH         Q16.16 hurtbox height
 * @property {number|null} lastComboMove  id of the move that started this combo
 * @property {number} superUsedThisRound boolean as 0|1
 * @property {number} stunTicks         remaining stun for hitstun/blockstun
 * @property {number} dashRemainingTicks
 * @property {number} lastButtons       previous tick button mask (edge detection)
 * @property {boolean} pendingCancel    true while a cancel window is open
 * @property {number} victimTicksRemaining  remaining knockdown/wakeup ticks
 */

/**
 * In-flight move execution state of a fighter.
 *
 * @typedef {Object} MoveState
 * @property {MoveTiming} timing
 * @property {number} tick               ticks since the move began
 * @property {number} cancelledTick      tick at which a cancel into another move
 * @property {boolean} isCancelFollowup
 * @property {boolean[]} consumed        per-hitbox consumed flags (identity-local)
 */

/**
 * Result of applying a hit to a defender.
 *
 * @typedef {'hit'|'block'|'whiff'|'invulnerable'|'knockdown'} HitResultKind
 */

/**
 * A resolved hit event.
 *
 * @typedef {Object} HitResult
 * @property {HitResultKind} kind
 * @property {number} damage             raw integer damage applied
 * @property {number} blockDamage        integer chip damage on block
 * @property {number} defenderEnergy     energy delta to the defender
 * @property {number} attackerEnergy     energy delta to the attacker
 * @property {string|null} moveId
 */

/**
 * A stage geometry snapshot the sim enforces.
 *
 * @typedef {Object} StageBounds
 * @property {number} leftPx
 * @property {number} rightPx
 * @property {number} groundYPx
 */

export {};