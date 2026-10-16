import { describe, expect, it } from 'vitest';
import { gameLocations } from '../../src/data/game-locations';
import { demoScoreRules, nextLocationAfter, pointsAfterDecay } from '../../src/game/rules';

const firstLocation = gameLocations[0];
const secondLocation = gameLocations[1];
const lastLocation = gameLocations.at(-1);
if (!firstLocation || !secondLocation || !lastLocation) {
  throw new Error('Rules test fixture is missing locations.');
}

describe('game rules', () => {
  it('awards the configured capture score without inactivity', () => {
    expect(pointsAfterDecay(0, 0)).toBe(0);
    expect(demoScoreRules.capturePoints).toBe(10);
  });

  it('applies daily decay and never drops below zero', () => {
    expect(pointsAfterDecay(100, 1)).toBe(95);
    expect(pointsAfterDecay(100, 2)).toBe(90);
    expect(pointsAfterDecay(3, 100)).toBe(0);
  });

  it('does not decay a negative number below the configured floor', () => {
    expect(pointsAfterDecay(-10, 0)).toBe(0);
  });

  it('moves to the next location and wraps around', () => {
    expect(nextLocationAfter(gameLocations, firstLocation.id)).toBe(secondLocation);
    expect(nextLocationAfter(gameLocations, lastLocation.id)).toBe(firstLocation);
  });

  it('starts at the first location for an unknown current id', () => {
    expect(nextLocationAfter(gameLocations, 'unknown')).toBe(firstLocation);
  });

  it('fails clearly when no locations are configured', () => {
    expect(() => nextLocationAfter([], 'unknown')).toThrow(
      'No hay ubicaciones de juego configuradas.',
    );
  });
});
