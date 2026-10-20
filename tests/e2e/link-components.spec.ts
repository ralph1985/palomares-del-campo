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

  test('uses the shared text action for the news back-link', async ({ page }) => {
    await page.goto('/noticias/');
    await page.locator('.news-card').first().locator('h3 a').click();

    const backLink = page.getByRole('link', { name: '← Volver a noticias', exact: true });
    await expect(backLink).toHaveAttribute('href', '/noticias');
    await expect(backLink).toHaveAttribute('data-ui-link', '');
    await expect(backLink).toHaveAttribute('data-ui-variant', 'text');
    await expect(backLink).toHaveCSS('margin-bottom', '48px');
  });

  test('uses the shared text action for the bando back-link', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/bandos/1646075-visita-virgen-de-lourdes-a-nuestro-pueblo/');

    const backLink = page.getByRole('link', { name: '← Volver a bandos', exact: true });
    await expect(backLink).toHaveAttribute('href', '/bandos/');
    await expect(backLink).toHaveAttribute('data-ui-link', '');
    await expect(backLink).toHaveAttribute('data-ui-variant', 'text');
    await expect(backLink).toHaveCSS('margin-bottom', '48px');
  });
});
