import { describe, it, expect } from 'vitest';
import { createGameConfig } from '../src/config/index.js';
import { createBot } from '../src/ai/bot.js';
import {
  REPLAY_VERSION,
  createReplayHeader,
  createMatchRecorder,
  buildReplay,
  playReplay,
  replaySignature,
  encodeReplay,
  decodeReplay,
  sanitizeReplay,
} from '../src/replay/index.js';

/**
 * Sprint 4 acceptance: a match is fully described by setup + input frames, so
 * recording, serializing and replaying it reproduces the fight bit-for-bit.
 */

const defaultPair = {
  p0: { fighterId: 'shadow', weaponId: 'w_unarmed', armorId: 'a_cloth' },
  p1: { fighterId: 'hermit', weaponId: 'w_unarmed', armorId: 'a_cloth' },
};

/** A fast best-of-3 config so replay tests finish quickly. */
function shortConfig() {
  const cfg = createGameConfig();
  cfg.rounds.roundTimeSec = 6;
  cfg.rounds.introMs = 0;
  cfg.rounds.outroMs = 0;
  cfg.rounds.breakMs = 0;
  return cfg;
}

/**
 * @param {import('../src/config/types.js').GameConfig} cfg
 * @param {import('../src/config/types.js').Difficulty} difficulty
 * @param {number} seed
 * @param {0|1} side
 * @returns {(view: import('../src/ai/types.js').WorldView) => number}
 */
function botController(cfg, difficulty, seed, side) {
  const weaponId = side === 0 ? defaultPair.p0.weaponId : defaultPair.p1.weaponId;
  const bot = createBot(cfg, { difficulty, side, seed, weaponId });
  return (/** @type {import('../src/ai/types.js').WorldView} */ view) => bot.step(view).buttons;
}

describe('replay header and recorder', () => {
  it('builds a header with defaults', () => {
    const h = createReplayHeader(defaultPair, 'dojang');
    expect(h.version).toBe(REPLAY_VERSION);
    expect(h.createdAt).toBe(0);
    expect(h.stageId).toBe('dojang');
    expect(h.p0Control).toBe('player');
    expect(h.p1Control).toBe('bot');
    expect(h.p0Difficulty).toBe(null);
    expect(h.winner).toBe(null);
    expect(h.frameCount).toBe(0);
  });

  it('records frames and seals a replay', () => {
    const rec = createMatchRecorder(defaultPair, 'dojang');
    rec.record({ buttons: 1 }, { buttons: 2 });
    rec.record({ buttons: 4 }, { buttons: 8 });
    expect(rec.frameCount).toBe(2);
    const replay = rec.build({ createdAt: 123, p0Control: 'player', p1Control: 'bot' });
    expect(replay.header.createdAt).toBe(123);
    expect(replay.header.frameCount).toBe(2);
    expect(replay.frames[0]).toEqual({ p0: 1, p1: 2 });
    expect(replay.frames[1]).toEqual({ p0: 4, p1: 8 });
  });
});

describe('buildReplay + playback', () => {
  it('captures a full bot match and replays it identically', () => {
    const cfg = shortConfig();
    const { replay, sim } = buildReplay(cfg, defaultPair, {
      p0: botController(cfg, 'HARD', 11, 0),
      p1: botController(cfg, 'EASY', 22, 1),
      maxTicks: 5000,
      createdAt: 1000,
      p0Control: 'bot',
      p1Control: 'bot',
      p0Difficulty: 'HARD',
      p1Difficulty: 'EASY',
      p0Seed: 11,
      p1Seed: 22,
    });
    expect(replay.frames.length).toBeGreaterThan(0);
    expect(replay.header.p0Control).toBe('bot');
    expect(replay.header.p0Difficulty).toBe('HARD');
    expect(replay.header.winner === 0 || replay.header.winner === 1).toBe(true);
    expect(replay.header.frameCount).toBe(replay.frames.length);

    const a = playReplay(replay, cfg);
    const b = playReplay(replay, cfg);
    expect(a.signature).toBe(b.signature);
    expect(a.signature).toBe(replaySignature(sim));
    expect(a.events.length).toBeGreaterThan(0);
  });

  it('stops early when a match winner is decided', () => {
    const cfg = shortConfig();
    const { replay, sim } = buildReplay(cfg, defaultPair, {
      p0: botController(cfg, 'HARD', 5, 0),
      p1: botController(cfg, 'EASY', 6, 1),
      maxTicks: 5000,
    });
    expect(sim.round.matchWinner).not.toBe(null);
    expect(replay.frames.length).toBeLessThan(5000);
  });
});

describe('replay codec', () => {
  it('round-trips through JSON without loss', () => {
    const cfg = shortConfig();
    const { replay } = buildReplay(cfg, defaultPair, {
      p0: botController(cfg, 'NORMAL', 3, 0),
      p1: botController(cfg, 'EASY', 4, 1),
      maxTicks: 3000,
    });
    const text = encodeReplay(replay);
    expect(typeof text).toBe('string');
    const decoded = decodeReplay(text);
    expect(decoded.frames).toEqual(replay.frames);
    expect(decoded.header.setup).toEqual(replay.header.setup);
    expect(playReplay(decoded, cfg).signature).toBe(playReplay(replay, cfg).signature);
  });

  it('rejects malformed JSON', () => {
    expect(() => decodeReplay('{not json')).toThrow(RangeError);
  });

  it('rejects unsupported versions', () => {
    expect(() => decodeReplay(JSON.stringify({ header: { version: 999 }, frames: [] }))).toThrow(/unsupported version/);
  });

  it('rejects a missing header, setup or frames', () => {
    expect(() => sanitizeReplay(null)).toThrow(/not an object/);
    expect(() => sanitizeReplay({ header: { version: REPLAY_VERSION } })).toThrow(/setup/);
    expect(() => sanitizeReplay({ header: { version: REPLAY_VERSION, setup: defaultPair } })).toThrow(/frames/);
  });

  it('rejects a setup with an empty id', () => {
    const bad = { p0: { fighterId: '', weaponId: 'w_unarmed', armorId: 'a_cloth' }, p1: defaultPair.p1 };
    expect(() => sanitizeReplay({ header: { version: REPLAY_VERSION, setup: bad }, frames: [] })).toThrow(/fighterId/);
  });

  it('clamps masks and repairs loose metadata', () => {
    const raw = {
      header: {
        version: REPLAY_VERSION,
        setup: defaultPair,
        winner: 9,
        p0Control: 'nonsense',
        p0Difficulty: 'ZZZ',
        createdAt: 'soon',
        p0Seed: 2.9,
      },
      frames: [{ p0: 99999, p1: -1 }, { p0: 'x' }, null],
    };
    const replay = sanitizeReplay(raw);
    expect(replay.header.winner).toBe(null);
    expect(replay.header.p0Control).toBe('player');
    expect(replay.header.p0Difficulty).toBe(null);
    expect(replay.header.createdAt).toBe(0);
    expect(replay.header.p0Seed).toBe(2);
    expect(replay.frames[0]?.p0).toBe(99999 & 0x7ff);
    expect(replay.frames[0]?.p1).toBe(-1 & 0x7ff);
    expect(replay.frames[1]?.p0).toBe(0);
    expect(replay.frames[2]?.p1).toBe(0);
    expect(replay.header.frameCount).toBe(3);
  });
});
