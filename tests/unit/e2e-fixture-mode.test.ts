import { describe, expect, it } from 'vitest';
import { isE2EFixtureMode } from '../../src/scripts/e2e-fixture-mode';

describe('isE2EFixtureMode', () => {
  it.each([
    { development: true, flag: 'true', expected: true },
    { development: false, flag: 'true', expected: false },
    { development: true, flag: undefined, expected: false },
    { development: true, flag: 'false', expected: false },
  ])('returns $expected for $development and flag=$flag', ({ development, flag, expected }) => {
    expect(isE2EFixtureMode({ development, flag })).toBe(expected);
  });
});
