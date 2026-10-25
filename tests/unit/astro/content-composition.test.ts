import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
import type { CollectionEntry } from 'astro:content';
import { describe, expect, it } from 'vitest';

import BandoCard from '../../../src/components/BandoCard.astro';
import CollectionArchive from '../../../src/components/CollectionArchive.astro';
import NewsCard from '../../../src/components/NewsCard.astro';
import BaseLayout from '../../../src/layouts/BaseLayout.astro';

const render = async (
  component: AstroComponentFactory,
  props: Record<string, unknown> = {},
  slots: Record<string, string> = {},
  partial = true,
) => {
  const container = await AstroContainer.create();
  return container.renderToString(component, { props, slots, partial });
};

const bandoPost = {
  id: 'bando-prueba',
  collection: 'bandos',
  body: 'El cuerpo completo conserva requisitos y fechas de la convocatoria.',
  data: {
    title: 'CONVOCATORIA DE SUBVENCIÓN',
    description: 'Ayudas municipales para actividades culturales.',
    author: 'Ayuntamiento de Palomares del Campo',
    authorType: 'Organization',
    date: new Date('2026-04-23T12:00:00.000Z'),
    category: 'Cultura',
    sourceName: 'Palomares del Campo Informa',
    sourceUrl: 'https://example.test/bando-original',
    sourceId: 'bando-42',
    attachments: [
      {
        type: 'document',
        url: 'https://example.test/bases.pdf',
        label: 'Bases de la convocatoria',
      },
      {
        type: 'image',
        url: 'https://example.test/cartel.jpg',
        label: 'Cartel de actividad',
        alt: 'Cartel de la actividad',
      },
    ],
  },
} satisfies CollectionEntry<'bandos'>;

const bandoWithoutBody = {
  id: 'bando-sin-cuerpo',
  collection: 'bandos',
  data: {
    ...bandoPost.data,
    title: 'Aviso sin cuerpo',
    sourceId: 'bando-43',
    attachments: [],
  },
} satisfies CollectionEntry<'bandos'>;

const newsWithoutCategory = {
  id: 'noticia-prueba',
  collection: 'noticias',
  data: {
    title: 'Nueva noticia local',
    description: 'Resumen de actualidad para la prueba de la tarjeta.',
    author: 'Redacción',
    authorType: 'Organization',
    date: new Date('2025-09-12T12:00:00.000Z'),
    sourceName: 'Portal municipal',
    sourceUrl: 'https://example.test/noticia-original',
    isFeatured: false,
  },
} satisfies CollectionEntry<'noticias'>;

const newsWithCategory = {
  ...newsWithoutCategory,
  id: 'noticia-cultura',
  body: 'El texto ampliado también debe servir como término de búsqueda.',
  data: {
    ...newsWithoutCategory.data,
    category: 'Cultura',
  },
} satisfies CollectionEntry<'noticias'>;

describe('BandoCard.astro', () => {
  it('keeps editorial metadata and all searchable source text on the card', async () => {
    const html = await render(BandoCard, { post: bandoPost });
    const searchableText = [
      bandoPost.data.title,
      bandoPost.data.description,
      bandoPost.data.category,
      bandoPost.data.sourceId,
      bandoPost.body,
      ...bandoPost.data.attachments.map(({ label }) => label),
    ].join(' ');

    expect(html).toContain('data-bando-title="convocatoria de subvención"');
    expect(html).toContain('data-bando-category="Cultura"');
    expect(html).toContain('data-search-year="2026"');
    expect(html).toContain(`data-bando-search="${searchableText}"`);
    expect(html).toContain(`data-search-text="${searchableText}"`);
    expect(html).toContain('href="/bandos/bando-prueba"');
    expect(html).toContain('Palomares del Campo Informa');
    expect(html).toContain('href="https://example.test/bando-original"');
    expect(html).not.toContain('target="_blank"');
    expect(html).not.toContain('rel="noopener noreferrer"');
  });

  it('keeps the search index valid when an entry has no markdown body', async () => {
    const html = await render(BandoCard, { post: bandoWithoutBody });

    expect(html).toContain('data-bando-title="aviso sin cuerpo"');
    expect(html).toContain('data-search-text="Aviso sin cuerpo');
    expect(html).toContain('bando-43');
    expect(html).not.toContain('undefined');
  });
});

describe('NewsCard.astro', () => {
  it('uses the category fallback when absent and indexes available content', async () => {
    const html = await render(NewsCard, { post: newsWithoutCategory });

    expect(html).toContain('data-search-category="Actualidad"');
    expect(html).toContain('data-search-year="2025"');
    expect(html).toContain('>Actualidad</span>');
    expect(html).toContain('href="/noticias/noticia-prueba"');
    expect(html).toContain('Portal municipal');
    expect(html).not.toContain('undefined');
  });

  it('uses an editorial category and includes the article body in search text', async () => {
    const html = await render(NewsCard, { post: newsWithCategory });

    expect(html).toContain('data-search-category="Cultura"');
    expect(html).toContain(
      'data-search-text="Nueva noticia local Resumen de actualidad para la prueba de la tarjeta. Cultura Portal municipal El texto ampliado también debe servir como término de búsqueda."',
    );
    expect(html).toContain('href="/noticias/noticia-cultura"');
  });
});

const archiveDefaults = {
  headingId: 'archive-title',
  eyebrow: 'Archivo editorial',
  title: 'Comunicaciones publicadas',
  itemSingular: 'comunicado publicado',
  itemPlural: 'comunicados publicados',
  emptyMessage: 'Todavía no hay comunicados publicados.',
  searchLabel: 'Buscar comunicados',
  inputId: 'archive-search',
  placeholder: 'Ej. cultura o transporte',
  action: '/archivo/',
};

describe('CollectionArchive.astro', () => {
  it('shows the empty state and plural wording when no items are available', async () => {
    const html = await render(CollectionArchive, {
      ...archiveDefaults,
      scope: 'bando',
      total: 0,
    });

    expect(html).toContain('archive-bando');
    expect(html).toContain('aria-labelledby="archive-title"');
    expect(html).toMatch(/0\s*comunicados publicados/);
    expect(html).toContain('Todavía no hay comunicados publicados.');
    expect(html).not.toContain('data-archive-fixture');
  });

  it('renders a populated slot with singular wording for one item', async () => {
    const html = await render(
      CollectionArchive,
      {
        ...archiveDefaults,
        scope: 'bando',
        total: 1,
        itemSingular: 'bando publicado',
        itemPlural: 'bandos publicados',
      },
      { default: '<article data-archive-fixture>Un bando</article>' },
    );

    expect(html).toMatch(/1\s*bando publicado/);
    expect(html).toContain('<article data-archive-fixture>Un bando</article>');
    expect(html).not.toContain('Todavía no hay comunicados publicados.');
  });

  it('uses the plural label for multiple news items', async () => {
    const html = await render(
      CollectionArchive,
      {
        ...archiveDefaults,
        scope: 'news',
        total: 3,
        itemSingular: 'noticia publicada',
        itemPlural: 'noticias publicadas',
      },
      { default: '<article data-archive-fixture>Una noticia</article>' },
    );

    expect(html).toContain('archive-news');
    expect(html).toMatch(/3\s*noticias publicadas/);
    expect(html).toContain('<article data-archive-fixture>Una noticia</article>');
  });
});

describe('BaseLayout.astro composition', () => {
  it('renders the base page shell, slots, and SEO metadata supplied by the layout', async () => {
    const html = await render(
      BaseLayout,
      {
        title: 'Noticia de prueba',
        description: 'Descripción de la noticia de prueba.',
        canonicalPath: '/noticias/noticia-de-prueba/?vista=archivo#contenido',
        bodyClass: 'article-page',
        socialImage: '/images/noticia.jpg',
        socialImageAlt: 'Imagen de la noticia',
        type: 'article',
        schema: 'article',
        noindex: true,
        article: {
          headline: 'Noticia de prueba',
          author: 'Redacción',
          authorType: 'Organization',
          datePublished: new Date('2026-07-01T12:00:00.000Z'),
          sourceUrl: 'https://example.test/fuente',
          section: 'Actualidad',
        },
        breadcrumbs: [
          { name: 'Inicio', path: '/' },
          { name: 'Noticias', path: '/noticias/' },
          { name: 'Noticia de prueba', path: '/noticias/noticia-de-prueba/' },
        ],
      },
      {
        head: '<meta name="fixture-head" content="present" />',
        default: '<main id="page-content">Contenido de prueba</main>',
      },
      false,
    );

    expect(html).toContain('lang="es"');
    expect(html).toContain('<title>Noticia de prueba</title>');
    expect(html).toContain('name="description" content="Descripción de la noticia de prueba."');
    expect(html).toContain('name="robots" content="noindex,follow"');
    expect(html).toContain(
      'href="https://palomaresdelcampo.conquense.dev/noticias/noticia-de-prueba/"',
    );
    expect(html).toContain('property="og:image:alt" content="Imagen de la noticia"');
    expect(html).toContain('property="article:published_time"');
    expect(html).toContain('"@type":"Article"');
    expect(html).toContain('"@type":"BreadcrumbList"');
    expect(html).toContain('class="breadcrumbs" aria-label="Migas de pan"');
    expect(html).toContain('href="/noticias/"');
    expect(html).toMatch(/aria-current="page"[^>]*>Noticia de prueba<\/span>/);
    expect(html).toContain('class="article-page"');
    expect(html).toContain('name="fixture-head" content="present"');
    expect(html).toContain('<main id="page-content">Contenido de prueba</main>');
  });

  it('uses the layout defaults when optional SEO props are omitted', async () => {
    const html = await render(
      BaseLayout,
      {
        title: 'Portada de prueba',
        description: 'Descripción de portada.',
      },
      { default: '<main>Contenido de portada</main>' },
      false,
    );

    expect(html).toContain('<title>Portada de prueba</title>');
    expect(html).toContain('name="robots" content="index,follow"');
    expect(html).toContain('name="twitter:card" content="summary"');
    expect(html).toContain('<main>Contenido de portada</main>');
    expect(html).not.toContain('type="application/ld+json"');
    expect(html).not.toContain('aria-label="Migas de pan"');
  });
});
