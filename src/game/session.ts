import type { GameLocation } from '../data/game-locations';
import { demoScoreRules, nextLocationAfter } from './rules';

export type LocalGameState = {
  activeLocationId: string;
  score: number;
  captures: number;
};

export const createInitialGameState = (locations: GameLocation[]): LocalGameState => {
  if (locations.length === 0) {
    throw new Error('No hay ubicaciones de juego configuradas.');
  }

  return {
    activeLocationId: locations[0].id,
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
