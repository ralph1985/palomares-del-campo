import { expect, test } from '@playwright/test';

test.describe('responsive and accessible web shell', () => {
  test('keeps the game page within a narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/juego/');

    await expect(page.locator('body')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      375,
    );
  });

  test('shows and activates the back-to-top control after scrolling', async ({ page }) => {
    await page.goto('/bandos/');

    const backToTop = page.getByRole('button', { name: 'Volver arriba' });
    await expect(backToTop).toBeHidden();

    await page.evaluate(() => window.scrollTo(0, 600));
    await expect(backToTop).toBeVisible();
    await backToTop.click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(10);
  });

  test('gives the global controls accessible names', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('button', { name: 'Explorar' })).toBeVisible();
    await page.getByRole('button', { name: 'Explorar' }).click();
    await expect(
      page.locator('#site-menu').getByRole('button', { name: 'Cerrar menú' }),
    ).toBeVisible();
  });
});
