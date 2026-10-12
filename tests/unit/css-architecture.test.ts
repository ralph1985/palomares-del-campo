import { describe, expect, it } from 'vitest';
import { findArchitectureViolations } from '../../scripts/check-css-architecture.js';

describe('CSS architecture guard', () => {
  it('rejects new raw colors outside the token source', () => {
    const diff = [
      'diff --git a/src/components/Example.astro b/src/components/Example.astro',
      '+++ b/src/components/Example.astro',
      '@@ -1,0 +2 @@',
      '+  color: #123456;',
    ].join('\n');

    expect(findArchitectureViolations(diff)).toEqual([
      {
        path: 'src/components/Example.astro',
        line: 'color: #123456;',
        reason: 'raw color literal',
      },
    ]);
  });

  it('allows documented Leaflet color exceptions and token declarations', () => {
    const diff = [
      'diff --git a/src/scripts/route-map.ts b/src/scripts/route-map.ts',
      '+++ b/src/scripts/route-map.ts',
      '@@ -1,0 +2 @@',
      "+      color: '#a05c32',",
      'diff --git a/src/styles/tokens.css b/src/styles/tokens.css',
      '+++ b/src/styles/tokens.css',
      '@@ -1,0 +2 @@',
      '+  --color-new: #123456;',
    ].join('\n');

    expect(findArchitectureViolations(diff)).toEqual([]);
  });

  it('rejects new raw alpha colors unless explicitly marked as an exception', () => {
    const diff = [
      'diff --git a/src/components/Example.astro b/src/components/Example.astro',
      '+++ b/src/components/Example.astro',
      '@@ -1,0 +2 @@',
      '+  box-shadow: 0 1rem 2rem rgb(25 52 45 / 12%);',
    ].join('\n');

    expect(findArchitectureViolations(diff)).toEqual([
      {
        path: 'src/components/Example.astro',
        line: 'box-shadow: 0 1rem 2rem rgb(25 52 45 / 12%);',
        reason: 'raw color function',
      },
    ]);
  });

  it('requires semantic font families and weight tokens', () => {
    const diff = [
      'diff --git a/src/components/Example.astro b/src/components/Example.astro',
      '+++ b/src/components/Example.astro',
      '@@ -1,0 +2,2 @@',
      '+  font-family: Georgia, serif;',
      '+  font-weight: 500;',
    ].join('\n');

    expect(findArchitectureViolations(diff)).toEqual([
      {
        path: 'src/components/Example.astro',
        line: 'font-family: Georgia, serif;',
        reason: 'raw font family',
      },
      {
        path: 'src/components/Example.astro',
        line: 'font-weight: 500;',
        reason: 'raw font weight',
      },
    ]);

    expect(
      findArchitectureViolations(
        [
          'diff --git a/src/components/Example.astro b/src/components/Example.astro',
          '+++ b/src/components/Example.astro',
          '@@ -1,0 +2,2 @@',
          '+  font-family: var(--font-serif);',
          '+  font-weight: var(--font-weight-medium);',
        ].join('\n'),
      ),
    ).toEqual([]);
  });
});
