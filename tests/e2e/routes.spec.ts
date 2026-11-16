import { expect, test } from './fixtures';

const openStreetMapTileHosts = new Set([
  'tile.openstreetmap.org',
  'a.tile.openstreetmap.org',
  'b.tile.openstreetmap.org',
  'c.tile.openstreetmap.org',
]);
const isOpenStreetMapTileRequest = (requestUrl: string) =>
  openStreetMapTileHosts.has(new URL(requestUrl).hostname);

const routeUrl =
  'https://es.wikiloc.com/rutas-senderismo/palomares-del-campo-a-la-cantera-54551889';
const embedUrl =
  'https://es.wikiloc.com/wikiloc/embedv2.do?id=54551889&elevation=on&images=on&maptype=H';
const embedRequestPattern =
  /^https:\/\/es\.wikiloc\.com\/wikiloc\/embedv2\.do\?id=54551889&elevation=on&images=on&maptype=H$/;

test('matches OpenStreetMap tiles by parsed hostname only', () => {
  for (const host of openStreetMapTileHosts) {
    expect(isOpenStreetMapTileRequest(`https://${host}/12/1/1.png`)).toBe(true);
  }

  expect(
    isOpenStreetMapTileRequest('https://tile.openstreetmap.org.attacker.example/12/1/1.png'),
  ).toBe(false);
  expect(
    isOpenStreetMapTileRequest('https://attacker.example/tile.openstreetmap.org/12/1/1.png'),
  ).toBe(false);
});

test.describe('Wikiloc route embed', () => {
  test('loads the official embed only after the visitor asks for it', async ({ page }) => {
    let wikilocRequests = 0;
    let tileRequests = 0;
    page.on('request', (request) => {
      if (request.url().startsWith('https://es.wikiloc.com/')) wikilocRequests += 1;
      if (isOpenStreetMapTileRequest(request.url())) tileRequests += 1;
    });
    await page.route(embedRequestPattern, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<!doctype html><title>Wikiloc embed fixture</title>',
      }),
    );

    await page.goto('/rutas/');

    await expect(page).toHaveTitle(/Rutas/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      /Wikiloc.*sin verificación municipal/i,
    );
    await expect(page.getByRole('heading', { level: 1, name: 'Rutas del pueblo' })).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 2, name: 'Palomares del Campo a La Cantera' }),
    ).toBeVisible();
    await expect(page.getByText('Joaquin Alcarria', { exact: true })).toBeVisible();
    await expect(page.getByText(/no es una ruta oficial del Ayuntamiento/i)).toBeVisible();
    await expect(page.getByText(/no la ha verificado sobre el terreno/i)).toBeVisible();
    await expect(page.getByText(/solo se conecta con Wikiloc cuando pulses/i)).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Abrir la ruta original en Wikiloc/ }),
    ).toHaveAttribute('href', routeUrl);
    await expect(page.getByRole('heading', { level: 3, name: 'Mapa en Wikiloc' })).toBeVisible();
    await expect(page.locator('.wikiloc-attribution a')).toHaveAttribute(
      'href',
      'https://es.wikiloc.com',
    );
    await expect(page.locator('iframe')).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Descargar GPX/ })).toHaveCount(0);
    expect(wikilocRequests).toBe(0);
    expect(tileRequests).toBe(0);

    await page.getByRole('button', { name: 'Cargar mapa de Wikiloc' }).click();

    const iframe = page.locator('iframe[data-wikiloc-frame]');
    await expect(iframe).toBeVisible();
    await expect(iframe).toHaveAttribute('src', embedUrl);
    await expect(iframe).toHaveAttribute(
      'title',
      'Mapa de la ruta Palomares del Campo a La Cantera en Wikiloc',
    );
    await expect(iframe).toHaveAttribute('width', '600');
    await expect(iframe).toHaveAttribute('height', '500');
    await expect(iframe).toHaveAttribute('loading', 'lazy');
    await expect(page.getByRole('button', { name: 'Solicitud a Wikiloc enviada' })).toBeDisabled();
    await expect(page.locator('[data-wikiloc-load]')).toHaveAttribute('aria-expanded', 'true');
    expect(wikilocRequests).toBe(1);
    expect(tileRequests).toBe(0);
  });

  test('keeps an accessible direct-route fallback when the iframe is blocked', async ({ page }) => {
    await page.route(embedRequestPattern, (route) => route.abort());
    await page.goto('/rutas/');

    await page.getByRole('button', { name: 'Cargar mapa de Wikiloc' }).click();

    await expect(page.getByText(/si el mapa no aparece o está bloqueado/i)).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Abrir la ruta original en Wikiloc/ }),
    ).toHaveAttribute('href', routeUrl);
  });

  test('keeps the embed prompt and responsive frame within a narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route(embedRequestPattern, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<!doctype html><title>Wikiloc embed fixture</title>',
      }),
    );
    await page.goto('/rutas/');

    await expect(page.getByRole('button', { name: 'Cargar mapa de Wikiloc' })).toBeVisible();
    const initialOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(initialOverflow).toBe(false);

    await page.getByRole('button', { name: 'Cargar mapa de Wikiloc' }).click();
    const iframe = page.locator('iframe[data-wikiloc-frame]');
    await expect(iframe).toBeVisible();
    const frameWidth = await iframe.evaluate((element) => element.getBoundingClientRect().width);
    expect(frameWidth).toBeLessThanOrEqual(390);
    const loadedOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(loadedOverflow).toBe(false);
  });
});
