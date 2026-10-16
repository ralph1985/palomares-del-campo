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
});
