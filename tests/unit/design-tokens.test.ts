import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const tokensCss = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8');
const tokenNames = [...tokensCss.matchAll(/^\s*(--[\w-]+):/gm)].map((match) => match[1]);

const getHexColor = (name: string): string => {
  const line = tokensCss
    .split('\n')
    .find((candidate) => candidate.trimStart().startsWith(`${name}:`));
  const color = line?.match(/#[\da-fA-F]{6}/)?.[0];
  if (!color) throw new Error(`Missing hex color token: ${name}`);
  return color;
};

const relativeLuminance = (hexColor: string): number => {
  const channels = [1, 3, 5].map((offset) => {
    const channel = Number.parseInt(hexColor.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const [red, green, blue] = channels;
  if (red === undefined || green === undefined || blue === undefined) {
    throw new Error(`Invalid hex color token: ${hexColor}`);
  }
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

const contrastRatio = (foreground: string, background: string): number => {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  return (
    (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
  );
};

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
      '--color-border',
      '--color-sage',
      '--color-sage-light',
      '--color-clay',
      '--color-clay-text',
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
      '--font-size-page-title',
      '--font-size-section-heading',
      '--spacing-section-y',
      '--line-height-body',
      '--line-height-heading',
      '--tracking-label',
      '--tracking-heading',
    ]);
  });

  it('keeps the text accent readable on paper and sage surfaces', () => {
    const clayText = getHexColor('--color-clay-text');
    expect(contrastRatio(clayText, getHexColor('--color-paper'))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(clayText, getHexColor('--color-sage'))).toBeGreaterThanOrEqual(4.5);
  });
});
