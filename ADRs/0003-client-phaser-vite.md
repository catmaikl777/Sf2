# ADR 0003: Client: Phaser 3.90.0 + Vite 6.4.4
Date: 2025-10-09
Status: Accepted

## Context
Browser client, fast iteration, small bundle, typed JS.

## Decision
- Phaser 3.90.0, Vite 6.4.4 (client), esbuild 0.25.12 works on android-arm64.
- Client uses `@sf/shared` (barrel). Strict tsc includes `client/src/**/*.js`.
- Fixed-step controller: accumulate delta, step sim at 60Hz, feed bot + record inputs.
- Placeholder graphics (Graphics), audio stub, localStorage for profile/replays.
- Scenes: Boot/Menu/Select/Battle/Result.

## Consequences
- Sim remains headless. No engine types bleed into shared.
- Build output `dist/`, can be previewed via vite.
