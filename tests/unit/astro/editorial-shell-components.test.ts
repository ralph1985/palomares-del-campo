import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
import { getCollection, type CollectionEntry } from 'astro:content';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import NewsSection from '../../../src/components/NewsSection.astro';
import HomeAudienceCards from '../../../src/components/home/HomeAudienceCards.astro';
import HomeEditorialGuide from '../../../src/components/home/HomeEditorialGuide.astro';
import ConquenseCredit from '../../../src/components/layout/ConquenseCredit.astro';
import SideMenu from '../../../src/components/layout/SideMenu.astro';
import SiteFooter from '../../../src/components/layout/SiteFooter.astro';
import SiteHeader from '../../../src/components/layout/SiteHeader.astro';

vi.mock('astro:content', () => ({ getCollection: vi.fn() }));

const render = async (component: AstroComponentFactory) => {
  const container = await AstroContainer.create();
  return container.renderToString(component);
};

const newsEntry = (id: string, title: string, date: Date) =>
  ({
    id,
    collection: 'noticias',
    body: `Texto editorial de ${title}.`,
    data: {
      title,
      description: `Descripción de ${title}.`,
      author: 'Redacción',
      authorType: 'Organization',
      date,
      category: 'Actualidad',
      sourceName: 'Portal municipal',
      sourceUrl: `https://example.test/${id}`,
      isFeatured: false,
    },
  }) satisfies CollectionEntry<'noticias'>;

const mockedGetCollection = vi.mocked(getCollection);

beforeEach(() => {
  mockedGetCollection.mockReset();
});

describe('HomeAudienceCards.astro', () => {
  it('keeps resident and visitor paths distinct and accessible', async () => {
    const html = await render(HomeAudienceCards);

    expect(html).toContain('aria-labelledby="audience-title"');
    expect(html).toContain('>Soy vecino</h3>');
    expect(html).toContain('>Descubre Palomares</h3>');
    expect(html).toContain('href="/informacion-practica/"');
    expect(html).toContain('href="/sobre-el-pueblo/"');
  });
});

describe('HomeEditorialGuide.astro', () => {
  it('hides the ball-game entry while its build feature flag is off', async () => {
    const html = await render(HomeEditorialGuide);

    expect(html).toContain('aria-labelledby="editorial-title"');
    expect(html).toMatch(
      /<h2 id="editorial-title"[^>]*>Empieza por <em[^>]*>donde quieras\.<\/em><\/h2>/,
    );
    expect(html).toMatch(/<ul class="editorial-grid"[^>]*>/);
    expect(html).toMatch(/<li class="editorial-item editorial-item--landscape"[^>]*>/);
    expect(html).toContain('href="/sobre-el-pueblo/#paisaje"');
    expect(html).toContain('href="/sobre-el-pueblo/#patrimonio"');
    expect(html).toContain('href="/sobre-el-pueblo/#tradiciones"');
    expect(html).not.toContain('href="/juego/"');
    expect(html).not.toContain('>Jugar</h3>');
  });
});

describe('NewsSection.astro', () => {
  it('sorts the newest entries and limits the preview to three cards', async () => {
    mockedGetCollection.mockResolvedValueOnce([
      newsEntry('noticia-antigua', 'Noticia antigua', new Date('2024-01-01T00:00:00Z')),
      newsEntry('noticia-reciente', 'Noticia reciente', new Date('2026-02-01T00:00:00Z')),
      newsEntry('noticia-mas-reciente', 'Noticia más reciente', new Date('2026-03-01T00:00:00Z')),
      newsEntry('noticia-intermedia', 'Noticia intermedia', new Date('2025-01-01T00:00:00Z')),
    ]);
    const html = await render(NewsSection);
    const cards = html.match(/class="news-card"/g) ?? [];

    expect(mockedGetCollection).toHaveBeenCalledWith('noticias');
    expect(html).toContain('id="noticias"');
    expect(html).toContain('aria-labelledby="news-section-title"');
    expect(html).toContain('>Noticias de Palomares</h2>');
    expect(cards).toHaveLength(3);
    expect(html.indexOf('href="/noticias/noticia-mas-reciente"')).toBeLessThan(
      html.indexOf('href="/noticias/noticia-reciente"'),
    );
    expect(html.indexOf('href="/noticias/noticia-reciente"')).toBeLessThan(
      html.indexOf('href="/noticias/noticia-intermedia"'),
    );
    expect(html).not.toContain('noticia-antigua');
    expect(html).toContain('href="/noticias"');
  });

  it('shows the empty message when the news collection has no entries', async () => {
    mockedGetCollection.mockResolvedValueOnce([]);
    const html = await render(NewsSection);

    expect(html).toContain('Pronto publicaremos las primeras noticias.');
    expect(html).not.toContain('class="news-card"');
    expect(html).toContain('href="/noticias"');
  });
});

describe('SiteHeader.astro and SideMenu.astro', () => {
  it('renders the closed menu state and its accessible navigation shell', async () => {
    const html = await render(SiteHeader);
    const menuHtml = await render(SideMenu);

    expect(html).toContain('aria-label="Palomares del Campo, inicio"');
    expect(html).toContain('class="brand-name-main">Palomares</span>');
    expect(html).toContain('class="brand-name-sub">del Campo</span>');
    expect(html).toContain('class="menu-toggle-label">Explorar</span>');
    expect(html).toContain('data-menu-toggle');
    expect(html).toContain('aria-controls="site-menu"');
    expect(html).toContain('aria-expanded="false"');
    expect(menuHtml).toContain('id="site-menu"');
    expect(menuHtml).toContain('aria-label="Menú lateral"');
    expect(menuHtml).toContain('aria-hidden="true"');
    expect(menuHtml).toContain('inert');
    expect(menuHtml).toContain('data-menu-backdrop');
    expect(menuHtml).toContain('aria-labelledby="menu-group-Vecinos"');
    expect(menuHtml).toContain('href="/informacion-practica/"');
    expect(menuHtml).not.toContain('href="/juego/"');
    expect(menuHtml).not.toContain('>Juego</h2>');
    expect(menuHtml).toContain('id="menu-scene"');
  });
});

describe('SiteFooter.astro', () => {
  it('renders accessible official links, contact methods, attribution, and the return control', async () => {
    const html = await render(SiteFooter);
    const currentYear = new Date().getFullYear();

    expect(html).toContain('id="contacto"');
    expect(html).toContain('aria-labelledby="footer-explore-title"');
    expect(html).toContain('href="https://palomaresdelcampo.dipucuenca.es/"');
    expect(html).not.toContain('href="/juego/"');
    expect(html).not.toContain('>La bola</a>');
    expect(html).toContain('href="tel:969277601"');
    expect(html).toContain('href="mailto:ayto.palomares@gmail.com"');
    expect(html).toContain('href="https://conquense.dev/"');
    expect(html).toContain(`© ${currentYear} Palomares del Campo`);
    expect(html).toContain('data-back-to-top');
    expect(html).toMatch(/data-back-to-top[^>]*hidden/);
  });
});

describe('ConquenseCredit.astro', () => {
  it('keeps the accessible linked image as the fallback for the optional canvas', async () => {
    const html = await render(ConquenseCredit);

    expect(html).toContain('href="https://conquense.dev/"');
    expect(html).toContain('aria-label="Web realizada por conquense.dev"');
    expect(html).toContain('src="/_image?');
    expect(html).toContain('srcset="/_image?');
    expect(html).toContain('data-conquense-logo-texture-src="/_image?');
    expect(html).toContain('data-conquense-logo-height-src="/_image?');
    expect(html).toContain('alt="conquense.dev"');
    expect(html).toContain('data-conquense-logo-canvas');
    expect(html).toContain('aria-hidden="true"');
  });
});
