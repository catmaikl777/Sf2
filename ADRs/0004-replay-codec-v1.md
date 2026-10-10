# ADR 0004: Replay format v1 (inputs-only)
Date: 2025-10-09
Status: Accepted

## Context
Reproducibility and lightweight saves.

## Decision
- `REPLAY_VERSION=1`. Header: createdAt, stageId, setup(p0/p1), p0Control/p1Control, p0Difficulty/p1Difficulty, winner.
- Frames: array of {t, b0, b1} where b0/b1 are BTN masks clamped to 0x7ff.
- Codec: `encodeReplay/decodeReplay/sanitizeReplay`, `replaySignature`. Playback via `playReplay(sim, r, opts)`.
- Recorder builds from recorded input pairs in tick order.

## Consequences
- Inputs-only replay: given same cfg+setup, stepping with recorded inputs gives identical outcome (deterministic sim).
- Small, easy to validate and sanitize.
