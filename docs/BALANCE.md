# Balance (Shadow Fight — offline 1v1 vs AI)

## Roster (baseline)
- shadow: maxHp 120, maxEnergy 100, height 146, width 46, walkSpeed 390 (Q16.16)
- hermit: maxHp 108, maxEnergy 120, height 142, width 44, walkSpeed 360

## Weapons (rangePx)
- w_unarmed 60
- w_dagger 72
- w_sword 96

## Unarmed baseline
- unarmed_jab: damage 6, hitstun 260ms, blockstun 180ms, energyCost 0, isSuper false

## Round
- intro 1800ms (108 ticks), fight 3600 ticks (60s), outro 144, break 90
- roundsToWin 2 (ROUNDS config)

## AI difficulty scaling (high-level)
- EASY/NORMAL/HARD differ by reactionDelayMs, decisionsPerSecond, inputLatencyMs, inputJitterMs, aimErrorPx, stateReadErrorChance, aggression/defense/spacing, punish/whiffPunish, comboFollowup, throwWhenBlocked, superThreshold, blockReactionChance, jumpUsage, dashUsage, rngSeed.

## Super
- Triggered only via combo sequence `f:hand,f:foot,f:hand` (matcher prio 20). Sim does not consume BTN.SUPER as a direct button in controlState/tryStartMove paths listed.

## Notes
- All numbers Q16.16; no float in hot loop. Damage/defense via config (cloth def 0 in unarmed mult 1.0).
- Spacing: gap 45px at spawn (shadow 46, hermit 44), center clamp 83 / 1197, ground 620.
- Test budget: dummy vs AI EASY 3 hits, NORMAL 13, HARD 24 @1500 ticks (ai.test.js).
