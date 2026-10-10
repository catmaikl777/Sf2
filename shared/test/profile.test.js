import { describe, it, expect } from 'vitest';
import { defaultProfile, migrateProfile, profileStats, PROFILE_VERSION } from '../src/profile/profileSchema.js';

describe('profile schema', () => {
  it('creates a valid default profile', () => {
    const p = defaultProfile();
    expect(p.version).toBe(PROFILE_VERSION);
    expect(p.coins).toBe(0);
    expect(p.unlockedFighters).toContain('shadow');
    expect(p.settings.difficulty).toBe('NORMAL');
    expect(p.settings.language).toBe('ru');
    expect(p.matches).toEqual([]);
  });

  it('repairs a null / garbage stored value', () => {
    expect(migrateProfile(null).version).toBe(PROFILE_VERSION);
    expect(migrateProfile('junk').coins).toBe(0);
    expect(migrateProfile(42).wins).toBe(0);
  });

  it('clamps out-of-range settings', () => {
    const p = migrateProfile({
      settings: { masterVolume: 500, musicVolume: -20, stickSensitivity: 999, language: 'fr', difficulty: 'NIGHTMARE' },
    });
    expect(p.settings.masterVolume).toBe(100);
    expect(p.settings.musicVolume).toBe(0);
    expect(p.settings.stickSensitivity).toBe(20);
    expect(p.settings.language).toBe('ru');
    expect(p.settings.difficulty).toBe('NORMAL');
  });

  it('keeps only well-formed match records', () => {
    const p = migrateProfile({
      matches: [
        null,
        'x',
        { id: 'm1', playerWon: true, roundsWon: 2, roundsLost: 0, reward: 145, fighterId: 'shadow' },
        { id: '', playerWon: 'yes' },
      ],
    });
    expect(p.matches.length).toBe(2);
    const m0 = p.matches[0];
    const m1 = p.matches[1];
    if (!m0 || !m1) throw new Error('expected parsed matches');
    expect(m0.playerWon).toBe(true);
    expect(m0.reward).toBe(145);
    expect(m1.playerWon).toBe(false);
  });

  it('caps stored matches at 200 entries', () => {
    const matches = Array.from({ length: 300 }, (_, i) => ({ id: `m${i}` }));
    const p = migrateProfile({ matches });
    expect(p.matches.length).toBe(200);
    const last = p.matches[199];
    if (!last) throw new Error('expected capped matches');
    expect(last.id).toBe('m299');
  });

  it('migrates v1 profiles to the current version', () => {
    const p = migrateProfile({ version: 1, coins: 300, settings: { language: 'en' } });
    expect(p.version).toBe(PROFILE_VERSION);
    expect(p.coins).toBe(300);
    expect(p.replayRewardSpentToday).toBe(0);
    expect(p.replayRewardDate).toBe('');
  });

  it('drops negative counters', () => {
    const p = migrateProfile({ coins: -50, wins: -3, losses: -1 });
    expect(p.coins).toBe(0);
    expect(p.wins).toBe(0);
    expect(p.losses).toBe(0);
  });

  it('computes winrate including the empty case', () => {
    expect(profileStats(defaultProfile()).winrate).toBe(0);
    expect(profileStats(migrateProfile({ wins: 3, losses: 1 })).winrate).toBeCloseTo(0.75, 10);
  });
});
