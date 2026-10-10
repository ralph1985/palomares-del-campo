import { describe, expect, it } from 'vitest';
import { evaluateServerCapture } from '../../convex/geo';

describe('Convex capture validation', () => {
  const location = {
    latitude: 39.9463,
    longitude: -2.5988,
    radiusMeters: 55,
  };

  it('accepts a precise position inside the capture radius', () => {
    expect(
      evaluateServerCapture(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: 10,
        },
        location,
      ),
    ).toEqual({ eligible: true, reason: 'eligible', distanceMeters: 0 });
  });

  it('rejects an inaccurate position before accepting its distance', () => {
    expect(
      evaluateServerCapture(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: 101,
        },
        location,
      ),
    ).toMatchObject({ eligible: false, reason: 'low-accuracy', distanceMeters: 0 });
  });

  it('rejects a precise position outside the radius', () => {
    expect(
      evaluateServerCapture(
        {
          latitude: location.latitude + 0.001,
          longitude: location.longitude,
          accuracy: 10,
        },
        location,
      ),
    ).toMatchObject({ eligible: false, reason: 'outside-radius' });
  });
});
