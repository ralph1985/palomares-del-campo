import type { GameLocation } from '../data/game-locations';
import { demoScoreRules, nextLocationAfter } from './rules';

export type LocalGameState = {
  activeLocationId: string;
  score: number;
  captures: number;
};

export const createInitialGameState = (locations: GameLocation[]): LocalGameState => {
  const firstLocation = locations[0];
  if (!firstLocation) {
    throw new Error('No hay ubicaciones de juego configuradas.');
  }

  return {
    activeLocationId: firstLocation.id,
    score: 0,
    captures: 0,
  };
};

export const captureLocation = (
  state: LocalGameState,
  locations: GameLocation[],
  capturePoints = demoScoreRules.capturePoints,
): LocalGameState => {
  const nextLocation = nextLocationAfter(locations, state.activeLocationId);

  return {
    activeLocationId: nextLocation.id,
    score: state.score + capturePoints,
    captures: state.captures + 1,
  };
};
