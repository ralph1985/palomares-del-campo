import { expect, test } from '@playwright/test';

test.describe('local routes', () => {
  test('shows a sourced external route without presenting it as municipal', async ({ page }) => {
    await page.goto('/rutas/');

    await expect(page).toHaveTitle(/Rutas/);
    await expect(page.getByRole('heading', { level: 1, name: 'Rutas del pueblo' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Paseo por los campos de Palomares del Campo' }),
    ).toBeVisible();
    await expect(page.getByText('5,13 km')).toBeVisible();
    await expect(page.getByText('1 h 21 min')).toBeVisible();
    await expect(page.getByText('Fácil', { exact: true })).toBeVisible();
    await expect(page.getByText('Recomendación externa')).toBeVisible();
    await expect(page.getByText('No es una ruta municipal señalizada.')).toBeVisible();
    await expect(page.getByText(/Fuente actualizada el 26 de julio de 2024/)).toBeVisible();
    await expect(page.getByRole('link', { name: /Ver ruta en Komoot/ })).toHaveAttribute(
      'href',
      'https://www.komoot.com/smarttour/e1154591619/hiking-through-the-fields-of-palomares-del-campo',
    );
    await expect(page.getByRole('link', { name: /Turismo de Castilla-La Mancha/ })).toHaveAttribute(
      'href',
      'https://www.turismocastillalamancha.es/es/destinos/encanto-rural/cuenca/palomares-del-campo',
    );

    await page.goto('/');
    await page.getByRole('button', { name: 'Explorar' }).click();
    await expect(page.locator('#site-menu').getByRole('link', { name: /Rutas/ })).toHaveAttribute(
      'href',
      '/rutas/',
    );
  });
});
