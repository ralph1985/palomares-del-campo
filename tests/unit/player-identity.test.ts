import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadPlayerIdentity, parsePlayerIdentity } from '../../src/scripts/convex-game';

afterEach(() => {
  vi.unstubAllGlobals();
});

const stubDeterministicCrypto = () => {
  const getRandomValues = vi.fn((bytes: Uint8Array) => {
    bytes.fill(0xab);
    return bytes;
  });
  vi.stubGlobal('crypto', { getRandomValues });
  return getRandomValues;
};

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

describe('loadPlayerIdentity', () => {
  it('restores a valid saved identity without generating a replacement id', () => {
    const identity = { deviceId: 'saved-device', nickname: 'Pájaro Verde' };
    const getItem = vi.fn(() => JSON.stringify(identity));
    const getRandomValues = vi.fn();
    vi.stubGlobal('window', { localStorage: { getItem } });
    vi.stubGlobal('crypto', { getRandomValues });

    expect(loadPlayerIdentity()).toEqual(identity);
    expect(getItem).toHaveBeenCalledWith('palomares-player-v1');
    expect(getRandomValues).not.toHaveBeenCalled();
  });

  it('creates a blank identity for a first visit with no saved value', () => {
    const getRandomValues = stubDeterministicCrypto();
    vi.stubGlobal('window', { localStorage: { getItem: () => null } });

    expect(loadPlayerIdentity()).toEqual({ deviceId: 'ab'.repeat(16), nickname: '' });
    expect(getRandomValues).toHaveBeenCalledOnce();
  });

  it('creates a fresh identity when saved fields do not match the schema', () => {
    const getRandomValues = stubDeterministicCrypto();
    vi.stubGlobal('window', {
      localStorage: { getItem: () => JSON.stringify({ deviceId: 42, nickname: 'Inválido' }) },
    });

    expect(loadPlayerIdentity()).toEqual({ deviceId: 'ab'.repeat(16), nickname: '' });
    expect(getRandomValues).toHaveBeenCalledOnce();
  });

  it('recovers when persisted JSON cannot be parsed', () => {
    stubDeterministicCrypto();
    vi.stubGlobal('window', { localStorage: { getItem: () => '{invalid-json' } });

    expect(loadPlayerIdentity()).toEqual({ deviceId: 'ab'.repeat(16), nickname: '' });
  });

  it('continues with a fresh identity when browser storage is unavailable', () => {
    stubDeterministicCrypto();
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => {
          throw new Error('storage-blocked');
        },
      },
    });

    expect(loadPlayerIdentity()).toEqual({ deviceId: 'ab'.repeat(16), nickname: '' });
  });
});
