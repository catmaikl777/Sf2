# Shadow Fight — web 2D fighting game (offline 1v1 vs AI)

Production-ready offline fighting game in the style of Shadow Fight 2's combat
system. Exactly one mode: the player fights a single AI bot. No networking,
no matchmaking, everything runs locally in the browser.

## Reach

- JavaScript ES2023+, ES6 modules, JSDoc `strict` typing
- Phaser 3 (last stable 3.x), Vite, Vitest, Playwright
- Own fixed-timestep simulation at 60 Hz, Q16.16 integer fixed-point math
- Own AABB combat logic (Phaser physics is not used for combat)
- `phaser3-hadoken` for combo-sequence recognition
- Behavior Tree + Utility AI + FSM for the bot, three difficulties
- localStorage profile, deterministic replay recording/playback

## Workspaces

| package     | role                                                        |
|-------------|-------------------------------------------------------------|
| `shared`    | deterministic simulation core, configs, AI, replay, profile |
| `client`    | Phaser app: scenes, input, audio, storage, HUD              |

Chronological history is in `git log`; architectural decisions are recorded as
ADRs under `docs/`.

## Commands (root)

```bash
npm install
npm run dev            # Vite dev server
npm run test           # unit tests (Vitest)
npm run test:coverage  # with 80% coverage gate
npm run test:e2e       # Playwright e2e
npm run lint           # ESLint
npm run typecheck      # tsc --checkJs strict
npm run build          # production build
```

## Determinism rules

- The simulation consumes only `InputFrame` arrays and a seed; it never
  touches `Date`, `Math.random` or the DOM.
- All arithmetic is integer fixed point (`shared/src/fp.js`).
- The AI reads only a delayed, error-prone snapshot of the visible world —
  exactly the information a human player would have — and issues inputs with
  human-like latency. It never accesses the player's internal simulation state.
- Replays store {seed, configId, inputs}; replays reproduce bit-exact.

## Documentation

- `shared/README.md` — module guide for the deterministic core
- `docs/BALANCE.md` — where to edit fighter stats, move data and AI weights
- `docs/ARCHITECTURE.md` — module boundaries and data flow