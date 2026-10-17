import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
import { describe, expect, it, vi } from 'vitest';

import CollectionSearch from '../../../src/components/CollectionSearch.astro';
import AboutEmblem from '../../../src/components/about/AboutEmblem.astro';
import WorldMap from '../../../src/components/world/WorldMap.astro';
import WorldSubmissionForm from '../../../src/components/world/WorldSubmissionForm.astro';

const render = async (component: AstroComponentFactory, props: Record<string, unknown> = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(component, { props });
};

describe('CollectionSearch.astro', () => {
  it('renders bando search controls, facets, accessible count, and empty state copy', async () => {
    const html = await render(CollectionSearch, {
      scope: 'bando',
      label: 'Buscar en bandos',
      inputId: 'bandos-search',
      placeholder: 'Ej. cultura o transporte',
      action: '/bandos/',
      total: 1,
      categories: ['Cultura', 'Deporte'],
      years: [2025, 2026],
    });

    expect(html).toContain('role="search"');
    expect(html).toContain('aria-label="Buscar en bandos"');
    expect(html).toContain('action="/bandos/"');
    expect(html).toContain('for="bandos-search"');
    expect(html).toContain('name="q"');
    expect(html).toContain('type="search"');
    expect(html).toContain('id="bando-category"');
    expect(html).toContain('value="Cultura"');
    expect(html).toContain('id="bando-year"');
    expect(html).toContain('value="2026"');
    expect(html).toMatch(/>1\s*resultado en bandos<\/p>/);
    expect(html).toContain('No hay bandos que coincidan con estos filtros.');
  });

  it('omits unavailable news facets and uses plural result wording', async () => {
    const html = await render(CollectionSearch, {
      scope: 'news',
      label: 'Buscar noticias',
      inputId: 'news-search',
      placeholder: 'Ej. cultura',
      action: '/noticias/',
      total: 3,
    });

    expect(html).toContain('aria-label="Buscar noticias"');
    expect(html).toContain('id="news-search"');
    expect(html).not.toContain('id="news-category"');
    expect(html).not.toContain('id="news-year"');
    expect(html).toMatch(/>3\s*resultados en noticias<\/p>/);
    expect(html).toContain('No hay noticias que coincidan con estos filtros.');
  });
});

describe('WorldMap.astro', () => {
  it('renders an accessible loading shell with no-script guidance and map attribution', async () => {
    const html = await render(WorldMap);

    expect(html).toContain('aria-labelledby="world-map-title"');
    expect(html).toContain('>Palomareños por el mundo</h2>');
    expect(html).toContain('role="application"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('data-map-status="loading"');
    expect(html.includes('data-convex-url')).toBe(true);
    expect(html).toContain('El mapa interactivo requiere JavaScript.');
    expect(html).toContain('https://www.openstreetmap.org/copyright');
  });
});

describe('WorldSubmissionForm.astro', () => {
  it('keeps the public submission form, privacy disclosure, consent, and bot guard connected', async () => {
    const html = await render(WorldSubmissionForm);

    expect(html).toContain('aria-labelledby="world-form-title"');
    expect(html).toContain('data-palomarenos-form');
    expect(html.includes('data-convex-url')).toBe(true);
    expect(html.includes('data-turnstile-site-key')).toBe(true);
    expect(html.includes('data-turnstile-hostnames')).toBe(true);
    expect(html).toContain('name="displayName"');
    expect(html).toContain('name="contactEmail" type="email"');
    expect(html).toContain('maxlength="254"');
    expect(html).toContain('id="world-form-privacy-title"');
    expect(html).toContain('name="consent" type="checkbox" required');
    expect(html).toContain('class="world-form-honeypot" aria-hidden="true"');
    expect(html).toContain('data-turnstile-widget');
    expect(html).toContain('data-form-status');
  });

  it('renders an empty Turnstile site key when the public key is not configured', async () => {
    vi.stubEnv('PUBLIC_TURNSTILE_SITE_KEY', undefined);

    try {
      const html = await render(WorldSubmissionForm);
      expect(html).toMatch(/data-turnstile-site-key(?:\s|>)/);
      expect(html).not.toMatch(/data-turnstile-site-key="[^"]+"/);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});

describe('AboutEmblem.astro', () => {
  it('keeps the accessible decorative fallback behind its optional canvas', async () => {
    const html = await render(AboutEmblem);

    expect(html).toContain('data-about-emblem');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('src="/brand/escudo-palomares-del-campo.svg"');
    expect(html).toContain('alt=""');
    expect(html).toContain('data-about-emblem-canvas');
  });
});
