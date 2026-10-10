# ADR 0005: Profile schema v1 (localStorage)
Date: 2025-10-09
Status: Accepted

## Context
Persist coins/wins/losses/unlocks/matches/settings between sessions.

## Decision
- `PROFILE_VERSION=1`, `PROFILE_KEY='sf.profile.v1'`.
- `defaultProfile`, `migrateProfile` (defensive), `profileStats`.
- Matches capped (200), reward/date fields exist; settings: difficulty/language/volumes/stickSensitivity/debugMode.
- Client `profileStore.js` uses try/catch; replays stored separately (index + per-entry).

## Consequences
- Offline-only. No backend. Can evolve via migration.
