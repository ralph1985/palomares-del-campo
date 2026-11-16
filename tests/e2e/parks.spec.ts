import { expect, test } from './fixtures';

const parksUrl = '/parques-y-zonas-verdes/';
const eielFeatureUrl = 'https://eiel.redsara.es/visor/layer-json/fase:2024-codine:16148/capa:PJ';
const mapUrl =
  'https://www.openstreetmap.org/?mlat=39.9457706937704&mlon=-2.60033216669301#map=18/39.9457706937704/-2.60033216669301';

test.describe('parques y zonas verdes', () => {
  test('shows the georeferenced EIEL record without inventing a proper name, amenities or photo', async ({
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

    const evidence = page.getByRole('region', {
      name: 'Un punto oficial, sin nombre propio ni perímetro',
    });
    await expect(evidence).toContainText(/GeoEIEL.*2024/i);
    await expect(evidence).toContainText(/punto.*Parque y Jardín/i);
    await expect(evidence).toContainText(/nombre propio.*perímetro.*equipamientos/i);

    const spaces = page.getByRole('region', { name: 'Espacios documentados' });
    const record = spaces.getByRole('article', {
      name: 'Parque y jardín (registro EIEL 2024)',
    });
    await expect(record).toBeVisible();
    await expect(record).toContainText(/no especifica un nombre propio/i);
    await expect(record).toContainText(/equipamientos.*no.*confirmados/i);
    await expect(record).toContainText('39.945771, -2.600332');
    await expect(record.getByRole('link', { name: 'Abrir ubicación en el mapa' })).toHaveAttribute(
      'href',
      mapUrl,
    );
    await expect(
      record.getByRole('navigation', { name: /Fuentes de Parque y jardín/i }).getByRole('link', {
        name: /GeoEIEL.*2024/i,
      }),
    ).toHaveAttribute('href', eielFeatureUrl);
    await expect(record.getByRole('region', { name: /Equipamientos confirmados/ })).toHaveCount(0);
    await expect(page.locator('main img')).toHaveCount(0);
    await expect(
      spaces.getByRole('heading', { name: 'Todavía no hay fichas listas para publicar' }),
    ).toHaveCount(0);
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
