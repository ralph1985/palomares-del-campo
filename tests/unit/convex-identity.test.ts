import { describe, expect, it } from 'vitest';
import { normalizeNickname } from '../../convex/identity';

describe('player nicknames', () => {
  it('trims the visible nickname and creates a case-insensitive key', () => {
    expect(normalizeNickname('  Pájaro Verde  ')).toEqual({
      displayName: 'Pájaro Verde',
      nicknameKey: 'pájaro verde',
    });
  });

  it('rejects empty nicknames', () => {
    expect(() => normalizeNickname('   ')).toThrow('nickname-required');
  });

  it('rejects nicknames longer than the public limit', () => {
    expect(() => normalizeNickname('abcdefghijklmnopqrstuvwxy')).toThrow('nickname-too-long');
  });
});
