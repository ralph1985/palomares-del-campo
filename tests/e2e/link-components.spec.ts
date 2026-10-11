import { expect, test } from '@playwright/test';

test.describe('shared link components', () => {
  test('uses action-link variants for internal calls to action', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-ui-link][data-ui-variant="underline"]')).toHaveCount(1);
    await expect(page.locator('[data-ui-link][data-ui-variant="text"]')).toHaveCount(1);

    await page.goto('/juego/');
    await expect(page.locator('[data-ui-link][data-ui-variant="solid"]')).toHaveCount(1);
  });

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
});
