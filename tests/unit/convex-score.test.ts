import { describe, expect, it } from 'vitest';
import { effectiveScore, ONE_DAY_MS } from '../../convex/score';

describe('server score decay', () => {
  it('keeps the score during the first inactive day window', () => {
    expect(effectiveScore(10, 1_000, 1_000 + ONE_DAY_MS - 1)).toBe(10);
  });

  it('applies five percent after each complete inactive day', () => {
    expect(effectiveScore(10, 1_000, 1_000 + ONE_DAY_MS)).toBe(9);
  });

  it('never returns a negative score', () => {
    expect(effectiveScore(0, 1_000, 1_000 + ONE_DAY_MS * 100)).toBe(0);
    expect(effectiveScore(-10, 1_000, 1_000 + ONE_DAY_MS)).toBe(0);
  });
});
