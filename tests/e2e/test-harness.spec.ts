import { expect, test } from '@playwright/test';

test('keeps the Astro development toolbar out of the browser test server', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.locator('script[src*="/@id/astro/runtime/client/dev-toolbar/entrypoint.js"]'),
  ).toHaveCount(0);
});
