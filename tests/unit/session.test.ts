import { describe, expect, it } from 'vitest';
import { gameLocations } from '../../src/data/game-locations';
import { captureLocation, createInitialGameState } from '../../src/game/session';

describe('local game session', () => {
  it('starts at the first location with an empty score', () => {
    expect(createInitialGameState(gameLocations)).toEqual({
      activeLocationId: 'plaza-del-coso',
      score: 0,
      captures: 0,
    });
  });

  it('advances the active location and records a capture', () => {
    const nextState = captureLocation(createInitialGameState(gameLocations), gameLocations);

    expect(nextState).toEqual({
      activeLocationId: 'iglesia-nuestra-senora',
      score: 10,
      captures: 1,
    });
  });
});
