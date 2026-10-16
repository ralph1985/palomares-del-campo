import { expect, test } from '@playwright/test';

test('keeps the Astro development toolbar out of the browser test server', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.locator('script[src*="/@id/astro/runtime/client/dev-toolbar/entrypoint.js"]'),
  ).toHaveCount(0);
});

test('keeps Convex endpoints out of the E2E server', async ({ page }) => {
  await page.goto('/juego/');
  await expect(page.locator('[data-convex-url]')).toHaveAttribute('data-convex-url', '');

  await page.goto('/palomarenos-por-el-mundo/');
  await expect(page.locator('[data-palomarenos-map]')).toHaveAttribute('data-convex-url', '');
  await expect(page.locator('[data-palomarenos-form]')).toHaveAttribute('data-convex-url', '');
});
