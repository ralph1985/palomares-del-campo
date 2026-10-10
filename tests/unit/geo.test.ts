import { describe, expect, it } from 'vitest';
import { gameLocations } from '../../src/data/game-locations';
import {
  distanceInMeters,
  evaluateCapture,
  MIN_GPS_ACCURACY_METERS,
  offsetPosition,
} from '../../src/game/geo';

const plaza = gameLocations[0];

describe('geolocation rules', () => {
  it('returns zero distance for the same coordinates', () => {
    expect(
      distanceInMeters(
        { latitude: plaza.latitude, longitude: plaza.longitude },
        plaza,
      ),
    ).toBe(0);
  });

  it('accepts a position inside the capture radius', () => {
    const position = offsetPosition(plaza, plaza.radiusMeters - 1, 0, 5);

    expect(evaluateCapture(position, plaza)).toMatchObject({
      eligible: true,
      reason: 'eligible',
    });
  });

  it('rejects a position outside the capture radius', () => {
    const position = offsetPosition(plaza, plaza.radiusMeters + 1);

    expect(evaluateCapture(position, plaza)).toMatchObject({
      eligible: false,
      reason: 'outside-radius',
    });
  });

  it('rejects a position with insufficient accuracy', () => {
    const position = offsetPosition(plaza, 0, 0, MIN_GPS_ACCURACY_METERS + 1);

    expect(evaluateCapture(position, plaza)).toMatchObject({
      eligible: false,
      reason: 'low-accuracy',
    });
  });

  it('accepts accuracy exactly at the configured limit', () => {
    const position = offsetPosition(plaza, 0, 0, MIN_GPS_ACCURACY_METERS);

    expect(evaluateCapture(position, plaza).eligible).toBe(true);
  });
});
