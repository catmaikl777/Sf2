# ADR 0002: AI (perception + utility + behavior tree + FSM)
Date: 2025-10-09
Status: Accepted

## Context
Need scalable difficulty with testable behavior and controllable noise.

## Decision
- `observe(sim, side)` produces `FighterView` + `WorldView` (movePhase none/startup/active/recovery).
- `perception.createPerception` adds reactionDelayMs delay ring, aimErrorPx, stateReadErrorChance and seeded RNG; can emit MISREAD map.
- `utility.evaluate/choose` ranks candidates (idle/approach/retreat/block/crouch/jump/attack/super) with PHASE_BIAS and helpers.
- `behaviortree` (selector/sequence/guard/constant/action/not) for execution; `fsm` (neutral/approach/engage/defend/punish/recover) for high-level phase.
- `bot.createBot` combines cadence + input-latency delay line and tree.

## Consequences
- Deterministic given same seed.
- Difficulty tuned via AiConfig per EASY/NORMAL/HARD.
- Tests assert hit-count scaling vs dummy.
