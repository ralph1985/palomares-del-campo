import { describe, expect, it } from 'vitest';
import {
  evaluateServerCapture,
  isValidAccuracy,
  isValidCoordinates,
  nextLocationInSequence,
} from '../../convex/geo';

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

describe('Convex geolocation input validation', () => {
  it('accepts finite coordinates inside the geographic range, including its boundaries', () => {
    expect(isValidCoordinates(-90, -180)).toBe(true);
    expect(isValidCoordinates(90, 180)).toBe(true);
    expect(isValidCoordinates(0, 0)).toBe(true);
  });

  it('rejects non-finite or out-of-range coordinates', () => {
    expect(isValidCoordinates(Number.NaN, 0)).toBe(false);
    expect(isValidCoordinates(0, Number.POSITIVE_INFINITY)).toBe(false);
    expect(isValidCoordinates(90.001, 0)).toBe(false);
    expect(isValidCoordinates(0, -180.001)).toBe(false);
  });

  it('allows omitted or non-negative finite accuracy and rejects invalid values', () => {
    expect(isValidAccuracy(undefined)).toBe(true);
    expect(isValidAccuracy(0)).toBe(true);
    expect(isValidAccuracy(100)).toBe(true);
    expect(isValidAccuracy(-1)).toBe(false);
    expect(isValidAccuracy(Number.NaN)).toBe(false);
    expect(isValidAccuracy(Number.POSITIVE_INFINITY)).toBe(false);
  });
});

describe('Convex location sequence', () => {
  const locations = [{ _id: 'location-a' }, { _id: 'location-b' }, { _id: 'location-c' }];

  it('advances to the next location and wraps after the final one', () => {
    expect(nextLocationInSequence(locations, 'location-a')).toBe(locations[1]);
    expect(nextLocationInSequence(locations, 'location-c')).toBe(locations[0]);
  });

  it('returns null when the current location is missing or the list is empty', () => {
    expect(nextLocationInSequence(locations, 'missing')).toBeNull();
    expect(nextLocationInSequence([], 'location-a')).toBeNull();
  });
});
