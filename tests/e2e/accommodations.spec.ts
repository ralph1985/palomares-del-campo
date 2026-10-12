import { expect, test } from '@playwright/test';

test.describe('rural accommodation directory', () => {
  test('shows sourced accommodation options in Palomares and nearby towns', async ({ page }) => {
    await page.goto('/alojamientos/');

    await expect(page).toHaveTitle(/Alojamientos rurales/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Alojamientos rurales' }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Palomares del Campo' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Casa Rural San Cristóbal' })).toBeVisible();
    await expect(page.getByText('Hasta 12 plazas')).toBeVisible();
    await expect(page.getByText('Horcajada de la Torre')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Alrededores' })).toBeVisible();
    await expect(page.locator('[data-accommodation-card]')).toHaveCount(10);
    await expect(page.locator('main img')).toHaveCount(4);
    await expect(page.getByText(/Entorno, no el alojamiento/)).toHaveCount(4);
    await expect(page.getByText(/No gestionamos reservas/)).toBeVisible();
    await expect(page.getByText(/comprueba precios, disponibilidad/)).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Sitio propio de Casa Rural San Cristóbal/ }),
    ).toHaveAttribute('href', 'https://www.casaruralsancristobalcuenca.es/');
    await expect(
      page.getByRole('link', { name: /Ficha consultada en TusCasasRurales.com/ }),
    ).toHaveCount(10);
  });

  test('keeps the directory usable on a narrow viewport and in the menu', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/alojamientos/');

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);

    await page.locator('[data-menu-toggle]').click();
    await expect(
      page.locator('#site-menu').getByRole('link', { name: 'Alojamientos rurales' }),
    ).toHaveAttribute('href', '/alojamientos/');
  });
});
