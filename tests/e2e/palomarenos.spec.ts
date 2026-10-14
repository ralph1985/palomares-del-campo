import { expect, test } from '@playwright/test';

test.describe('Palomareños por el mundo', () => {
  test('loads the empty Leaflet map and the public proposal form', async ({ page }) => {
    await page.goto('/palomarenos-por-el-mundo/');

    await expect(page.locator('#page-title')).toBeVisible();
    await expect(page.locator('[data-palomarenos-map] .leaflet-tile').first()).toBeVisible();
    await expect(page.locator('[data-palomarenos-map-status]')).toHaveText(
      'Todavía no hay historias aprobadas para mostrar.',
    );
    await expect(page.getByRole('heading', { name: '¿Vives lejos de Palomares?' })).toBeVisible();
    await expect(page.getByLabel('Nombre que quieres mostrar')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Ciudad' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'País' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /Email de contacto/ })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Tu historia' })).toBeVisible();
    await expect(page.getByLabel(/Acepto que esta historia/)).toBeVisible();
  });

  test('keeps the page within a narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/palomarenos-por-el-mundo/');

    await expect(page.locator('body')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      375,
    );
  });
});
