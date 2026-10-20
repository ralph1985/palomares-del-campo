import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
import { describe, expect, it } from 'vitest';

import EditorialHero from '../../../src/components/hero/EditorialHero.astro';
import SplitHero from '../../../src/components/hero/SplitHero.astro';

const render = async (
  component: AstroComponentFactory,
  props: Record<string, unknown> = {},
  slots: Record<string, string> = {},
) => {
  const container = await AstroContainer.create();
  return container.renderToString(component, { props, slots });
};

describe('EditorialHero.astro', () => {
  it('connects its labelled section to the title and preserves named content slots', async () => {
    const html = await render(
      EditorialHero,
      {
        id: 'project-intro',
        labelledBy: 'intro-title',
        variant: 'paper-tall',
        titleWidth: 'narrow',
        summaryWidth: 'wide',
      },
      {
        eyebrow: '<p class="eyebrow">Palomares del Campo · Cuenca</p>',
        title: '<h1 id="intro-title">Un nuevo espacio para descubrir el pueblo.</h1>',
        summary: '<p class="hero-intro">Información del proyecto.</p>',
        actions: '<a href="/juego/">Probar el mapa</a>',
      },
    );

    expect(html).toContain('id="project-intro"');
    expect(html).toContain('aria-labelledby="intro-title"');
    expect(html).toContain('editorial-hero--paper-tall');
    expect(html).toContain('editorial-hero--title-narrow');
    expect(html).toContain('editorial-hero--summary-wide');
    expect(html).toContain('class="editorial-hero__actions"');
    expect(html).toContain('id="intro-title"');
    expect(html).toContain('>Un nuevo espacio para descubrir el pueblo.</h1>');
    expect(html).toContain('>Información del proyecto.</p>');
    expect(html).toContain('href="/juego/"');
  });

  it('forwards section data attributes and renders an optional notice in a tall hero', async () => {
    const html = await render(
      EditorialHero,
      {
        labelledBy: 'agenda-title',
        variant: 'ink-display',
        fullHeight: true,
        'data-current-affairs-empty': true,
        'data-section': 'agenda',
      },
      {
        title: '<h1 id="agenda-title">Agenda</h1>',
        notice: '<p class="empty-message">No hay actividades publicadas.</p>',
      },
    );

    expect(html).toContain('data-current-affairs-empty');
    expect(html).toContain('data-section="agenda"');
    expect(html).toContain('editorial-hero--viewport');
    expect(html).toContain('class="editorial-hero__notice"');
    expect(html).toContain('No hay actividades publicadas.');
  });
});

describe('SplitHero.astro', () => {
  it('keeps the named copy and visual slots inside an accessible split section', async () => {
    const html = await render(
      SplitHero,
      { labelledBy: 'about-title', variant: 'heritage' },
      {
        copy: '<div><h1 id="about-title">Un pueblo con historia</h1><a href="#historia">Descubrir</a></div>',
        visual: '<figure><img src="/pueblo.webp" alt="Vista del pueblo" /></figure>',
      },
    );

    expect(html).toContain('aria-labelledby="about-title"');
    expect(html).toContain('split-hero--heritage');
    expect(html).toContain('class="split-hero__copy"');
    expect(html).toContain('class="split-hero__visual"');
    expect(html).toContain('id="about-title"');
    expect(html).toContain('href="#historia"');
    expect(html).toContain('alt="Vista del pueblo"');

    const gameHtml = await render(
      SplitHero,
      {
        id: 'game-hero',
        class: 'review-hero',
        'data-state': 'local',
        labelledBy: 'game-title',
        variant: 'game',
      },
      {
        copy: '<h1 id="game-title">La bola está en juego</h1>',
        visual: '<div aria-label="Estado de la partida">Partida local</div>',
      },
    );

    expect(gameHtml).toContain('aria-labelledby="game-title"');
    expect(gameHtml).toContain('id="game-hero"');
    expect(gameHtml).toContain('class="split-hero split-hero--game review-hero"');
    expect(gameHtml).toContain('data-state="local"');
    expect(gameHtml).toContain('aria-label="Estado de la partida"');
  });
});
