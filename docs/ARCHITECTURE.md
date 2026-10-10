# Architecture (Shadow Fight — offline 1v1 vs AI)

## Goals
- Deterministic 60Hz simulation: only inputs + fixed config affect outcome. No rendering in `@sf/shared`.
- Shared `@sf/shared` between headless (tests) and Phaser client; no Phaser types leaking into sim.
- Strict TypeScript-checkable JS: `jsconfig.check.json` (noUncheckedIndexedAccess, exactOptionalPropertyTypes).
- Keep hot loop in sim Q16.16; event data is `Record<string, unknown>`.

## Layers
- `shared/src/config/` — immutable-like configs, validation, `createGameConfig()`.
- `shared/src/sim/` — deterministic fighter state, motion, combat, collision, input mapping, round, timing; barrel `createSim/createMatcher`.
- `shared/src/ai/` — observation (`observe`), perception with delay+noise, utility+BT+FSM, `createBot(cfg,{difficulty,side,seed,weaponId})`.
- `shared/src/replay/` — recorder, playback, codec (BTN mask 0x7ff, v1), sanitize, signature.
- `shared/src/profile/` — schema, defaults, migrate, stats.
- `client/src/` — Phaser 3.90.0 + Vite 6.4.4: scenes, battle controller (fixed-step), HUD, input, audio (stub), storage (profile+replays).

## Data Flow
1. Menu/Select → BattleScene builds `matchup` + `difficulty` + `seed`.
2. `BattleController` creates `createSim(cfg, matchup)`, `createBot`, `createMatchRecorder`.
3. Phaser `update(delta)` accumulates `STEP_MS=1000/60`; each tick: bot `step(observe(...))`, record both inputs, `sim.step({buttons:p0},{buttons:p1})`, push events.
4. On `matchWinner !== null`: `recorder.build()` → `saveReplay` (localStorage), update profile (coins/wins/losses/matches), go to ResultScene.
5. Replays stored as encoded v1 (meta index) and can be loaded via `decodeReplay`.

## Determinism Rules
- No `Date.now()` in sim; RNG only via `createRng(seed)` passed where needed.
- `SimEvent.data: Record<string, unknown>`.
- BTN bits fixed (ALL mask 0x7ff). Bot never produces DASH/THROW/SUPER as raw buttons except via super-combo trigger (handled by matcher/logic, not by "press SUPER" in `controlState` consumption by sim in listed hot paths).
- FP: `shared/src/fp.js`, Q16.16 everywhere in positional/velocity math hot loops.
- Round phases/ticks: intro 108, fight 3600, outro 144, break 90.

## Client Notes
- `KEY_MAP` maps to BTN; player always p0 on left (facing resolved by sim).
- `audio/AudioManager` is a no-op API ready for assets.
- `client/public/assets/` empty (future).
- Build: `vite build` outputs `dist/`. Server: `vite` (host/5173).

## Performance/Testing
- TSC strict (noUncheckedIndexedAccess, exactOptionalPropertyTypes), ESLint; tests 114 passed.
- Coverage ≥80% (stmts/branches/funcs/lines). Excludes `src/config/moves.js`, `src/index.js` in vitest config.
- Prefer RG-like search via `grep` in Termux (rg not installed).
