import { expect, test } from './fixtures';

test.describe('local routes', () => {
  test('shows a sourced external route without presenting it as municipal', async ({ page }) => {
    await page.goto('/rutas/');

    await expect(page).toHaveTitle(/Rutas/);
    await expect(page.getByRole('heading', { level: 1, name: 'Rutas del pueblo' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Paseo por los campos de Palomares del Campo' }),
    ).toBeVisible();
    await expect(page.getByText('Recomendación externa')).toBeVisible();
    await expect(page.getByText('No es una ruta municipal señalizada.')).toBeVisible();
    await expect(page.getByRole('link', { name: /Probar La bola/ })).toHaveAttribute(
      'href',
      '/juego/',
    );
    await expect(page.getByRole('link', { name: /Descargar GPX/ })).toHaveAttribute(
      'href',
      '/routes/campos-palomares-del-campo.gpx',
    );
    await expect(page.getByText('GPX disponible para descarga.')).toBeVisible();
    await expect(page.getByText(/El archivo procede del trazado GPX aportado/)).toBeVisible();
    const routeMap = page.locator('[data-route-map]');
    await expect(routeMap).toHaveAttribute('data-map-status', 'ready');
    await expect(routeMap.locator('.leaflet-tile')).not.toHaveCount(0);
    await expect(routeMap.locator('.route-track-line')).not.toHaveCount(0);
    await expect(routeMap.locator('.route-waypoint-marker')).not.toHaveCount(0);
    await expect(page.getByText('Mapa interactivo del trazado')).toBeVisible();
    await expect(page.getByText(/Mapa basado en el GPX aportado/)).toBeVisible();
    await expect(page.locator('.route-review')).toContainText(
      /Fuente actualizada el \d{1,2} de \w+ de \d{4}/,
    );
    await expect(page.locator('.route-review')).toContainText(
      /ficha revisada el \d{1,2} de \w+ de \d{4}/,
    );
    await expect(page.getByRole('link', { name: /Ver ruta en Komoot/ })).toHaveAttribute(
      'href',
      'https://www.komoot.com/smarttour/e1154591619/hiking-through-the-fields-of-palomares-del-campo',
    );
    await expect(page.getByRole('link', { name: /Turismo de Castilla-La Mancha/ })).toHaveAttribute(
      'href',
      'https://www.turismocastillalamancha.es/es/destinos/encanto-rural/cuenca/palomares-del-campo',
    );
  });

  test('keeps the route map usable on a narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/rutas/');

    const routeMap = page.locator('[data-route-map]');
    await expect(routeMap).toHaveAttribute('data-map-status', 'ready');
    await expect(routeMap).toBeVisible();
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });
});
