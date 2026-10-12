import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function readJsonLd(page: Page) {
  const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
  return scripts.flatMap((script) => JSON.parse(script));
}

test.describe('technical SEO', () => {
  test('exposes canonical metadata and WebSite schema on the homepage', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page).toHaveTitle('Palomares del Campo');
    await expect(page.locator('meta[name="description"]')).toHaveCount(1);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index,follow');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://palomaresdelcampo.conquense.dev/',
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content',
      'https://palomaresdelcampo.conquense.dev/',
    );

    const schemas = await readJsonLd(page);
    expect(schemas).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          '@type': 'WebSite',
          url: 'https://palomaresdelcampo.conquense.dev',
        }),
      ]),
    );
  });

  test('describes a news detail page as an Article with breadcrumbs', async ({ page }) => {
    await page.goto('/noticias/autobus-palomares-mapa-estatal-2025/');

    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
    await expect(page.locator('meta[property="article:published_time"]')).toHaveAttribute(
      'content',
      '2025-05-23T00:00:00.000Z',
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://palomaresdelcampo.conquense.dev/noticias/autobus-palomares-mapa-estatal-2025/',
    );

    const schemas = await readJsonLd(page);
    expect(schemas).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          '@type': 'Article',
          headline:
            'El nuevo mapa estatal de autobuses plantea cambios en las paradas de Palomares del Campo',
          author: {
            '@type': 'Person',
            name: 'Carmen Bachiller',
          },
        }),
        expect.objectContaining({
          '@type': 'BreadcrumbList',
        }),
      ]),
    );
  });

  test('uses a real project image when a page provides one', async ({ page }) => {
    await page.goto('/sobre-el-pueblo/');

    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /^https:\/\//,
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image',
    );
  });
});
