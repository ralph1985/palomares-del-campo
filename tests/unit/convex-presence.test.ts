import { describe, expect, it } from 'vitest';
import { PRESENCE_TTL_MS, isPresenceActive, roundPresenceCoordinate } from '../../convex/presence';

describe('Convex player presence', () => {
  it('rounds coordinates before they can be displayed to other players', () => {
    expect(roundPresenceCoordinate(39.94636)).toBe(39.9464);
    expect(roundPresenceCoordinate(-2.59884)).toBe(-2.5988);
  });

  it('keeps a player visible while the presence heartbeat is fresh', () => {
    expect(isPresenceActive(1_000, 1_000 + PRESENCE_TTL_MS - 1)).toBe(true);
  });

  it('expires a player after the heartbeat window', () => {
    expect(isPresenceActive(1_000, 1_000 + PRESENCE_TTL_MS)).toBe(false);
  });
});
