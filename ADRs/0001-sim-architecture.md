# ADR 0001: Deterministic 60Hz simulation core
Date: 2025-10-09
Status: Accepted

## Context
Need offline 1v1 vs AI with reproducible replays and testable logic. Rendering must not affect outcome.

## Decision
- Keep all game state/evolution in `@sf/shared/sim` (no Phaser). 60Hz fixed-step, no wall-clock in hot paths except via inputs/replay.
- Use Q16.16 fixed-point (`fp.js`) for positions/velocities; avoid floats in motion/combat/collision hot loops.
- Event model: `SimEvent.type`, `tick`, `data: Record<string, unknown>`.
- Inputs are BTN bitmasks (0x7ff). No sim-side consumption of DASH/THROW/SUPER as direct control buttons in controlState/tryStartMove (by current design); super is combo-triggered.
- Determinism: no `Date.now()` in sim; RNG via injected/seeded `createRng`.

## Consequences
- Replay: record inputs framewise, playback = exact step sequence.
- Easy to test (sim + matcher + ai) headlessly.
- Strict typing + noUncheckedIndexedAccess helps catch indexing bugs.
