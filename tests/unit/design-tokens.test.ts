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
      '--font-sans',
      '--font-serif',
      '--font-weight-regular',
      '--font-weight-medium',
      '--font-weight-bold',
      '--font-weight-strong',
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
