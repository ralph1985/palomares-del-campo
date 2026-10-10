import { describe, expect, it } from 'vitest';
import { gameLocations } from '../../src/data/game-locations';
import { demoScoreRules, nextLocationAfter, pointsAfterDecay } from '../../src/game/rules';

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
    expect(nextLocationAfter(gameLocations, gameLocations[0].id)).toBe(gameLocations[1]);
    expect(nextLocationAfter(gameLocations, gameLocations.at(-1)?.id ?? '')).toBe(gameLocations[0]);
  });

  it('starts at the first location for an unknown current id', () => {
    expect(nextLocationAfter(gameLocations, 'unknown')).toBe(gameLocations[0]);
  });

  it('fails clearly when no locations are configured', () => {
    expect(() => nextLocationAfter([], 'unknown')).toThrow(
      'No hay ubicaciones de juego configuradas.',
    );
  });
});
