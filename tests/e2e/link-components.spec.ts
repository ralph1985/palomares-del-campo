import { expect, test } from '@playwright/test';

test.describe('shared link components', () => {
  test('protects external links with a new browsing context and opener protection', async ({
    page,
  }) => {
    await page.goto('/sobre-el-pueblo/');

    const externalLinks = page.locator('[data-ui-external-link]');
    const externalAttributes = await externalLinks.evaluateAll((links) =>
      links.map((link) => ({
        rel: link.getAttribute('rel'),
        target: link.getAttribute('target'),
      })),
    );

    expect(externalAttributes.length).toBeGreaterThan(0);
    expect(externalAttributes.every(({ target }) => target === '_blank')).toBe(true);
    expect(externalAttributes.every(({ rel }) => rel?.includes('noopener'))).toBe(true);
    expect(externalAttributes.every(({ rel }) => rel?.includes('noreferrer'))).toBe(true);
  });

  test('uses the breadcrumb instead of a duplicate back-link on news detail', async ({ page }) => {
    await page.goto('/noticias/');
    await page.locator('.news-card').first().locator('h3 a').click();

    const breadcrumbs = page.getByRole('navigation', { name: 'Migas de pan' });
    await expect(breadcrumbs.getByRole('link', { name: 'Noticias', exact: true })).toHaveAttribute(
      'href',
      '/noticias/',
    );
    await expect(page.getByRole('link', { name: '← Volver a noticias', exact: true })).toHaveCount(
      0,
    );
  });

  test('uses the breadcrumb instead of a duplicate back-link on bando detail', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/bandos/1646075-visita-virgen-de-lourdes-a-nuestro-pueblo/');

    const breadcrumbs = page.getByRole('navigation', { name: 'Migas de pan' });
    await expect(breadcrumbs.getByRole('link', { name: 'Bandos', exact: true })).toHaveAttribute(
      'href',
      '/bandos/',
    );
    await expect(page.getByRole('link', { name: '← Volver a bandos', exact: true })).toHaveCount(0);
  });
});
