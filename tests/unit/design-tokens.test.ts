// @ts-expect-error Vitest ejecuta esta prueba en Node, pero el proyecto no declara @types/node.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const tokensCss = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8');
const tokenNames = [...tokensCss.matchAll(/^\s*(--[\w-]+):/gm)].map((match) => match[1]);

describe('design tokens', () => {
  it('defines each token name only once', () => {
    expect(new Set(tokenNames).size).toBe(tokenNames.length);
  });

  it('keeps the documented visual vocabulary available', () => {
    expect(tokenNames).toEqual([
      '--color-ink',
      '--color-forest',
      '--color-muted',
      '--color-paper',
      '--color-surface',
      '--color-surface-soft',
      '--color-sage',
      '--color-sage-light',
      '--color-clay',
      '--color-ochre',
      '--color-night',
      '--color-night-surface',
      '--color-night-panel',
      '--color-night-muted',
      '--color-night-text',
      '--color-night-soft',
      '--color-night-highlight',
      '--color-game-capture',
      '--color-game-map',
      '--color-game-marker',
      '--color-accommodation-border',
      '--color-accommodation-divider',
      '--color-accommodation-nearby-border',
      '--color-game-simulator-border',
      '--color-game-simulator-surface',
      '--color-game-control-border',
      '--color-game-ball-ring',
      '--color-game-shadow',
      '--color-game-user-ring',
      '--color-game-player-ring',
      '--color-game-tooltip-border',
      '--color-game-tooltip-surface',
      '--color-game-tooltip-shadow',
      '--color-game-map-border',
      '--color-game-map-shadow',
      '--color-game-hud-border',
      '--color-game-hud-surface',
      '--color-game-hud-shadow',
      '--color-game-live-ring',
      '--color-game-toggle-border',
      '--color-game-toggle-surface',
      '--color-game-attribution-surface',
      '--color-game-panel-divider',
      '--color-game-ranking-border',
      '--color-game-ranking-surface',
      '--color-game-ranking-top-border',
      '--color-game-ranking-top-start',
      '--color-game-ranking-top-end',
      '--color-game-ranking-current',
      '--color-game-ranking-position-border',
      '--color-game-ranking-position-surface',
      '--color-game-ranking-score-border',
      '--font-sans',
      '--font-serif',
      '--font-weight-regular',
      '--font-weight-medium',
      '--font-weight-bold',
      '--font-weight-strong',
      '--font-weight-emphasis',
      '--font-weight-display',
      '--font-size-body',
      '--font-size-small',
      '--font-size-label',
      '--font-size-display',
      '--line-height-body',
      '--line-height-heading',
      '--tracking-label',
      '--tracking-heading',
    ]);
  });
});
