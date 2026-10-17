import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

import SEO from '../../../src/components/SEO.astro';

describe('SEO.astro', () => {
  it('canonicalizes the requested path and preserves an explicit noindex directive', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SEO, {
      props: {
        title: 'Noticias del pueblo',
        description: 'Actualidad de Palomares.',
        canonicalPath: '/noticias/?origen=archivo#recientes',
        noindex: true,
      },
    });

    expect(html).toContain('<title>Noticias del pueblo</title>');
    expect(html).toContain('name="robots" content="noindex,follow"');
    expect(html).toContain(
      'rel="canonical" href="https://palomaresdelcampo.conquense.dev/noticias/"',
    );
  });

  it('renders article and breadcrumb schema while escaping HTML in structured data', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SEO, {
      props: {
        title: 'Historia local',
        description: 'Una historia del pueblo.',
        type: 'article',
        schema: 'article',
        article: {
          headline: '<script>alert(1)</script>',
          author: 'Redacción',
          authorType: 'Organization',
          datePublished: new Date('2026-06-01T00:00:00.000Z'),
          sourceUrl: 'https://example.test/fuente',
          section: 'Historia',
        },
        breadcrumbs: [
          { name: 'Inicio', path: '/' },
          { name: 'Noticias', path: '/noticias/' },
        ],
      },
    });

    expect(html).toContain('property="article:published_time"');
    expect(html).toContain('"@type":"Article"');
    expect(html).toContain('"@type":"BreadcrumbList"');
    expect(html).toContain(String.raw`\u003cscript>alert(1)\u003c/script>`);
    expect(html).not.toContain('<script>alert(1)</script>');
  });

  it('renders WebSite schema and derives social image alt text from the title', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SEO, {
      props: {
        title: 'Palomares del Campo',
        description: 'Un pueblo para descubrir.',
        schema: 'website',
        image: '/social/portada.jpg',
      },
    });

    expect(html).toContain(
      'property="og:image" content="https://palomaresdelcampo.conquense.dev/social/portada.jpg"',
    );
    expect(html).toContain('property="og:image:alt" content="Palomares del Campo"');
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html).toContain('"@type":"WebSite"');
  });

  it('uses the page title for an article headline and omits absent source metadata', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SEO, {
      props: {
        title: 'Historia local',
        description: 'Una historia del pueblo.',
        type: 'article',
        schema: 'article',
        article: {
          author: 'Redacción',
          authorType: 'Organization',
          datePublished: new Date('2026-06-01T00:00:00.000Z'),
        },
      },
    });

    expect(html).toContain('"headline":"Historia local"');
    expect(html).not.toContain('property="article:section"');
    expect(html).not.toContain('"isBasedOn"');
  });
});
