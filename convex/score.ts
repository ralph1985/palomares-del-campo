export const ONE_DAY_MS = 24 * 60 * 60 * 1000;
export const DAILY_DECAY_RATE = 0.05;
export const MINIMUM_SCORE = 0;

export const effectiveScore = (
  score: number,
  lastActivityAt: number | undefined,
  now: number,
): number => {
  const safeScore = Math.max(MINIMUM_SCORE, Math.floor(score));
  if (!lastActivityAt || now <= lastActivityAt) return safeScore;

  const inactiveDays = Math.floor((now - lastActivityAt) / ONE_DAY_MS);
  if (inactiveDays <= 0) return safeScore;

  return Math.max(MINIMUM_SCORE, Math.floor(safeScore * (1 - DAILY_DECAY_RATE) ** inactiveDays));
};
