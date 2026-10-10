/**
 * Shared JSDoc type definitions for every configuration structure used by the
 * simulation, the AI and the client. All configuration is data-driven; the
 * engine never hardcodes fighter stats, damage, movesets, AI behaviour or
 * round parameters.
 *
 * @module shared/config/types
 */

/**
 * @typedef {'light'|'heavy'|'crit'} DamageType
 */

/**
 * @typedef {'unarmed'|'dagger'|'sword'|'axe'|'spear'|'nunchaku'} WeaponClass
 * @typedef {string} MoveId
 */

/**
 * @typedef {'stand'|'crouch'|'air'} Stance
 */

/**
 * @typedef {'idle'|'walk'|'jump'|'crouch'|'attack'|'block'|'hitstun'|'blockstun'|'knockdown'|'wakeup'|'dash'|'throw'|'grabbed'|'dead'} FighterState
 */

/**
 * One active hitbox window inside an attack timeline.
 * All coordinates are relative to the fighter origin (feet center),
 * X positive in facing direction, Y negative upward, Q16.16 fixed point.
 *
 * @typedef {Object} HitboxWindow
 * @property {number} startMs   offset from attack start, inclusive
 * @property {number} endMs     offset from attack start, exclusive
 * @property {number} ox        Q16.16 offset X
 * @property {number} oy        Q16.16 offset Y (negative = above origin)
 * @property {number} w         Q16.16 width
 * @property {number} h         Q16.16 height
 * @property {number} damage    base damage in HP points (integer)
 * @property {DamageType} damageType
 * @property {boolean} breaksBlock
 * @property {number} hitstunMs
 * @property {number} blockstunMs
 * @property {number} knockback  Q16.16 horizontal impulse
 * @property {number} liftup     Q16.16 vertical impulse (negative = up)
 * @property {number} stunMs     combined stun on clean hit
 * @property {number} hitstopMs  freeze frames applied to both fighters
 */

/**
 * Full attack timeline: startup / active / recovery as one data record.
 *
 * @typedef {Object} MoveConfig
 * @property {string} id
 * @property {string} nameKey        i18n key for UI
 * @property {WeaponClass|'universal'} weaponClass
 * @property {string[]} buttons      ordered button presses that trigger the move
 * @property {string[]} dirs         allowed direction prefix (['neutral'] etc.)
 * @property {Stance} stance
 * @property {number} startupMs
 * @property {number} activeMs
 * @property {number} recoveryMs
 * @property {number} hitstunMs      default hitstun if window omits it
 * @property {number} blockstunMs
 * @property {number} damage
 * @property {number} knockback
 * @property {number} energyGain
 * @property {number} energyCost
 * @property {boolean} isSuper
 * @property {number} moveWeight     Q16.16 weight factor affecting walk speed while active
 * @property {number} cancelWindowStartMs  recovery offset where cancels open
 * @property {number} cancelWindowEndMs
 * @property {number} advance        Q16.16 forward slide applied during startup
 * @property {string} animId         animation clip id in the atlas
 * @property {HitboxWindow[]} hitboxes
 * @property {MoveId[]} cancelsInto  move ids cancelable from this move
 * @property {number} priority       hit-resolve priority when both hit
 */

/**
 * @typedef {Object} WeaponConfig
 * @property {string} id
 * @property {string} nameKey
 * @property {WeaponClass} weaponClass
 * @property {number} damageMult   Q16.16 multiplier applied to move damage
 * @property {number} speedMult    Q16.16 multiplier applied to startup/recovery
 * @property {number} weight       Q16.16 weight affecting walk speed & knockback taken
 * @property {number} rangePx      effective range in pixels (AI scoring)
 * @property {string[]} moveIds
 * @property {number} price        progression cost, 0 = unlocked from start
 * @property {string} iconKey
 */

/**
 * @typedef {Object} ArmorConfig
 * @property {string} id
 * @property {string} nameKey
 * @property {number} defense      damage reduction Q16.16 in [0, 1)
 * @property {number} weight       Q16.16 added weight (slower walk, harder knockdown)
 * @property {number} speedPenalty Q16.16 walk speed multiplier
 * @property {number} price
 * @property {string} iconKey
 */

/**
 * @typedef {Object} FighterConfig
 * @property {string} id
 * @property {string} nameKey
 * @property {number} maxHp
 * @property {number} maxEnergy
 * @property {number} walkSpeed    Q16.16 px per tick
 * @property {number} backSpeed    Q16.16 px per tick
 * @property {number} dashSpeed    Q16.16 px per tick
 * @property {number} dashMs
 * @property {number} jumpVelocity Q16.16 px per tick (negative = up)
 * @property {number} gravity      Q16.16 px per tick^2 (positive = down)
 * @property {number} weight       Q16.16 base weight
 * @property {number} heightPx     hurtbox height in pixels
 * @property {number} widthPx      hurtbox width in pixels
 * @property {string[]} weaponIds
 * @property {string[]} armorIds
 * @property {string} bodyAtlas
 * @property {number} unlockPrice  progression cost, 0 = starting fighter
 */

/**
 * @typedef {Object} RoundConfig
 * @property {number} roundsToWin
 * @property {number} roundTimeSec
 * @property {number} introMs
 * @property {number} outroMs
 * @property {number} breakMs
 * @property {number} maxHp
 * @property {number} startingEnergy
 * @property {number} drawTimeOutDamageShare  Q16.16 share of remaining HP compared on timeout
 */

/**
 * @typedef {'EASY'|'NORMAL'|'HARD'} Difficulty
 */

/**
 * Perception + decision parameters for one difficulty. Only perception and
 * decision parameters differ between difficulties, never combat stats.
 *
 * @typedef {Object} AiConfig
 * @property {Difficulty} difficulty
 * @property {number} reactionDelayMs      age of world snapshot the bot acts on
 * @property {number} decisionsPerSecond
 * @property {number} inputLatencyMs       delay before a chosen button press appears
 * @property {number} inputJitterMs        +/- randomization of input timing
 * @property {number} aimErrorPx           perception error on distance (pixels)
 * @property {number} stateReadErrorChance  probability of misreading opponent state
 * @property {number} aggression           base weight for attack utility
 * @property {number} defense              base weight for block utility
 * @property {number} spacing              base weight for movement utility
 * @property {number} punish               weight bonus when opponent is recovery/hitstun
 * @property {number} whiffPunish          weight bonus when opponent attack missed
 * @property {number} comboFollowup        probability of continuing a landed combo
 * @property {number} throwWhenBlocked      probability of throwing a turtling opponent
 * @property {number} superThreshold       energy fraction before super is considered
 * @property {number} blockReactionChance  chance to react to an incoming attack
 * @property {number} jumpUsage            relative weight of jump-ins
 * @property {number} dashUsage            relative weight of dashes
 * @property {number} rngSeed              seed offset folded into bot RNG
 */

/**
 * @typedef {Object} ProgressionConfig
 * @property {number} winReward
 * @property {number} lossReward
 * @property {number} roundReward
 * @property {number} perfectBonus         reward for winning with full HP
 * @property {number} superFinishBonus
 * @property {number} replayWinRewardShare Q16.16 share given when watching a replay win
 * @property {number} maxDailyReplayReward
 */

/**
 * @typedef {Object} StageConfig
 * @property {string} id
 * @property {string} nameKey
 * @property {number} leftPx
 * @property {number} rightPx
 * @property {number} groundYPx
 * @property {string} backgroundKey
 * @property {string} musicKey
 * @property {number} ambientLight  Q16.16 0..1 silhouette contrast
 */

/**
 * @typedef {Object} GameConfig
 * @property {FighterConfig[]} fighters
 * @property {WeaponConfig[]} weapons
 * @property {ArmorConfig[]} armors
 * @property {MoveConfig[]} moves
 * @property {RoundConfig} rounds
 * @property {Record<Difficulty, AiConfig>} ai
 * @property {ProgressionConfig} progression
 * @property {StageConfig[]} stages
 * @property {Record<string, string>} strings  i18n key -> text
 */

/**
 * Normalized Q16.16 rect used by the sim (mirrors shared/aabb.Rect).
 *
 * @typedef {import('../aabb.js').Rect} Rect
 */

export {};

