import type { GameLocation } from '../data/game-locations';

export type DemoScoreRules = {
  capturePoints: number;
  dailyDecayRate: number;
  minimumScore: number;
};

export const demoScoreRules: DemoScoreRules = {
  capturePoints: 10,
  dailyDecayRate: 0.05,
  minimumScore: 0,
};

export const pointsAfterDecay = (
  score: number,
  inactiveDays: number,
  rules: DemoScoreRules = demoScoreRules,
): number => {
  if (inactiveDays <= 0) return Math.max(rules.minimumScore, Math.floor(score));

  const remaining = score * (1 - rules.dailyDecayRate) ** inactiveDays;
  return Math.max(rules.minimumScore, Math.floor(remaining));
};

export const nextLocationAfter = (locations: GameLocation[], currentId: string): GameLocation => {
  if (locations.length === 0) {
    throw new Error('No hay ubicaciones de juego configuradas.');
  }

  const currentIndex = locations.findIndex((location) => location.id === currentId);
  const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % locations.length;
  return locations[nextIndex];
};
