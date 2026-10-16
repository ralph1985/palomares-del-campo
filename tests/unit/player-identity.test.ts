import { describe, expect, it } from 'vitest';
import { parsePlayerIdentity } from '../../src/scripts/convex-game';

describe('parsePlayerIdentity', () => {
  it('accepts valid identity fields and ignores unrelated stored values', () => {
    expect(
      parsePlayerIdentity({ deviceId: 'device-test', nickname: 'Pájaro Verde', extra: true }),
    ).toEqual({ deviceId: 'device-test', nickname: 'Pájaro Verde' });
  });

  it('rejects non-record and incomplete identity data', () => {
    expect(parsePlayerIdentity(null)).toBeNull();
    expect(parsePlayerIdentity([])).toBeNull();
    expect(parsePlayerIdentity({ deviceId: 42, nickname: 'Pájaro Verde' })).toBeNull();
    expect(parsePlayerIdentity({ deviceId: 'device-test' })).toBeNull();
  });
});
