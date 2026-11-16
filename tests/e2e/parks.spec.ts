import { expect, test } from './fixtures';

const parksUrl = '/parques-y-zonas-verdes/';

test.describe('parques y zonas verdes', () => {
  test('shows a welcoming catalogue-in-preparation state without unconfirmed park records', async ({
    page,
  }) => {
    await page.goto(parksUrl);

    await expect(page).toHaveTitle(/Parques y zonas verdes de Palomares del Campo/);
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Parques y zonas verdes',
      }),
    ).toBeVisible();

    const main = page.getByRole('main');
    await expect(main).toContainText(
      'Aquí reuniremos información sencilla sobre los espacios verdes de Palomares del Campo, para que vecinos y visitantes puedan conocerlos mejor.',
    );
    await expect(
      main.getByRole('heading', {
        level: 2,
        name: 'Estamos preparando el catálogo de parques y zonas verdes de Palomares del Campo',
      }),
    ).toBeVisible();
    await expect(main.getByRole('article')).toHaveCount(0);
    await expect(main.locator('img')).toHaveCount(0);
    await expect(main).not.toContainText(/GeoEIEL|OpenStreetMap|coordenadas|registro EIEL/i);
  });

  test('links the page from Vecinos and Visita, immediately before Rutas in Visita', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(parksUrl);
    await page.getByRole('button', { name: 'Explorar' }).click();

    const menu = page.locator('#site-menu');
    const neighbors = menu.getByRole('region', { name: 'Vecinos' });
    const visit = menu.getByRole('region', { name: 'Visita' });
    await expect(
      neighbors.getByRole('link', { name: 'Parques y zonas verdes', exact: true }),
    ).toHaveAttribute('href', parksUrl);
    await expect(
      visit.getByRole('link', { name: 'Parques y zonas verdes', exact: true }),
    ).toHaveAttribute('href', parksUrl);

    const visitLinks = await visit.getByRole('link').allTextContents();
    expect(visitLinks.indexOf('Parques y zonas verdes')).toBe(visitLinks.indexOf('Rutas') - 1);

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });
});
