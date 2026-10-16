import { describe, expect, it } from 'vitest';
import { validateRouteSpecificSeo } from '../../scripts/seo-metadata.ts';

const websiteJsonLd = JSON.stringify({
  '@type': 'WebSite',
  url: 'https://palomaresdelcampo.conquense.dev',
});

const articleJsonLd = JSON.stringify([
  {
    '@type': 'Article',
    headline: 'Una noticia',
    author: { '@type': 'Person', name: 'Redacción' },
  },
  { '@type': 'BreadcrumbList', itemListElement: [] },
]);

describe('validateRouteSpecificSeo', () => {
  it('requires the canonical Open Graph URL, indexable robots directive and expected title on the homepage', () => {
    const html = `
      <title>Palomares del Campo</title>
      <link rel="canonical" href="https://palomaresdelcampo.conquense.dev/">
      <meta property="og:url" content="https://palomaresdelcampo.conquense.dev/">
      <meta name="robots" content="index,follow">
      <script type="application/ld+json">${websiteJsonLd}</script>
    `;

    expect(validateRouteSpecificSeo('/', html)).toEqual([]);
  });

  it('rejects a homepage without the expected title and robots directive', () => {
    const html = `
      <title>Wrong title</title>
      <link rel="canonical" href="https://palomaresdelcampo.conquense.dev/">
      <meta property="og:url" content="https://palomaresdelcampo.conquense.dev/">
      <meta name="robots" content="noindex,nofollow">
      <script type="application/ld+json">${websiteJsonLd}</script>
    `;
    const errors = validateRouteSpecificSeo('/', html);

    expect(errors).toContain('homepage title must be Palomares del Campo');
    expect(errors).toContain('homepage must be indexable');
  });

  it('rejects a homepage without the expected WebSite schema', () => {
    const html = `
      <link rel="canonical" href="https://palomaresdelcampo.conquense.dev/">
      <meta property="og:url" content="https://palomaresdelcampo.conquense.dev/">
    `;

    expect(validateRouteSpecificSeo('/', html)).toContain('homepage is missing WebSite JSON-LD');
  });

  it('requires an article type, canonical path, publication date, headline and schemas', () => {
    const html = `
      <link rel="canonical" href="https://palomaresdelcampo.conquense.dev/noticias/ejemplo/">
      <meta property="og:type" content="article">
      <meta property="article:published_time" content="2025-05-23T00:00:00.000Z">
      <script type="application/ld+json">${articleJsonLd}</script>
    `;

    expect(validateRouteSpecificSeo('/noticias/ejemplo/', html)).toEqual([]);
  });

  it('rejects missing or invalid article metadata and schemas', () => {
    const html = `
      <link rel="canonical" href="https://palomaresdelcampo.conquense.dev/noticias/otra/">
      <meta property="og:type" content="website">
      <meta property="article:published_time" content="not-a-date">
      <script type="application/ld+json">{"@type":"Article","author":{"@type":"Person","name":"Redacción"}}</script>
    `;
    const errors = validateRouteSpecificSeo('/noticias/ejemplo/', html);

    expect(errors).toContain('news detail must declare og:type article');
    expect(errors).toContain('news detail canonical URL must match its route');
    expect(errors).toContain('news detail must have a valid article:published_time');
    expect(errors).toContain('news detail Article JSON-LD has no headline');
    expect(errors).toContain('news detail is missing BreadcrumbList JSON-LD');
  });

  it('requires a secure Open Graph image and large-image Twitter card when the about page has an image', () => {
    const html = `
      <meta property="og:image" content="http://example.test/cover.jpg">
      <meta name="twitter:card" content="summary">
    `;
    const errors = validateRouteSpecificSeo('/sobre-el-pueblo/', html);

    expect(errors).toContain('about page Open Graph image must use HTTPS');
    expect(errors).toContain('about page must use the summary_large_image Twitter card');
  });
});
