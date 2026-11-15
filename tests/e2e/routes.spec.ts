import { readFile } from 'node:fs/promises';
import { expect, test } from './fixtures';

test.describe('local routes', () => {
  test('shows the provisional OSM route, planned GPX and Leaflet map', async ({ page }) => {
    const gpxUrl = '/routes/campos-palomares-osm-provisional.gpx';
    const tileResponsePromise = page.waitForResponse((response) =>
      response.url().startsWith('https://tile.openstreetmap.org/'),
    );
    const mapGpxResponsePromise = page.waitForResponse((response) =>
      response.url().endsWith(gpxUrl),
    );
    await page.goto('/rutas/');

    await expect(page).toHaveTitle(/Rutas/);
    await expect(page.getByRole('heading', { level: 1, name: 'Rutas del pueblo' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Trazado cartográfico provisional por los campos' }),
    ).toBeVisible();
    await expect(page.getByText(/No es oficial ni está homologado/)).toBeVisible();
    await expect(page.getByText(/acceso.*desconocido|desconocido.*acceso/i)).toBeVisible();
    await expect(
      page.getByText(/no sigas.*confirmación municipal.*recorrido presencial/i),
    ).toBeVisible();
    await expect(
      page.getByText(/no forman parte del circuito ni acreditan conexión o acceso/i),
    ).toBeVisible();
    await expect(page.locator('.route-facts, .route-accessibility')).toHaveCount(0);
    await expect(page.getByText(/\b\d+(?:[.,]\d+)?\s*(?:km|m|min|h)\b/i)).toHaveCount(0);

    const routeMap = page.locator('[data-route-map]');
    await expect(routeMap).toHaveAttribute('role', 'region');
    await expect(routeMap).toHaveAttribute('data-gpx-url', gpxUrl);
    await expect(routeMap).toHaveAttribute('data-map-status', 'ready');
    await expect(routeMap.locator('.route-track-line')).toBeVisible();
    await expect(
      routeMap.locator(
        '.leaflet-control-attribution a[href="https://www.openstreetmap.org/copyright"]',
      ),
    ).toBeVisible();
    const zoomInControl = routeMap.locator('.leaflet-control-zoom-in');
    await expect(zoomInControl).toBeVisible();
    await zoomInControl.click();
    await expect(routeMap).toHaveAttribute('data-map-status', 'ready');
    await expect(page.locator('.route-attribution a')).toHaveAttribute(
      'href',
      'https://www.openstreetmap.org/copyright',
    );
    await expect(page.getByRole('link', { name: /Descargar GPX/ })).toHaveAttribute('href', gpxUrl);

    const tileResponse = await tileResponsePromise;
    expect(tileResponse.headers()['x-e2e-map-tile']).toBe('fixture');
    const mapGpxResponse = await mapGpxResponsePromise;
    expect(mapGpxResponse.headers()['content-type']).toContain('application/gpx+xml');
    const mapGpxXml = await mapGpxResponse.text();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('link', { name: /Descargar GPX/ }).click(),
    ]);
    expect(download.suggestedFilename()).toBe('campos-palomares-osm-provisional.gpx');
    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();
    if (!downloadPath) throw new Error('Playwright no devolvió el archivo descargado.');
    const downloadedXml = await readFile(downloadPath, 'utf8');
    expect(downloadedXml).toBe(mapGpxXml);

    const gpx = await page.evaluate((xmlText) => {
      const xml = new DOMParser().parseFromString(xmlText, 'application/xml');
      const elements = (localName: string): Element[] =>
        Array.from(xml.getElementsByTagNameNS('*', localName));
      const points = elements('rtept').map((point) => {
        const latitude = point.getAttribute('lat');
        const longitude = point.getAttribute('lon');
        const lat = Number(latitude);
        const lon = Number(longitude);
        return {
          lat,
          lon,
          name: point.getElementsByTagNameNS('*', 'name').item(0)?.textContent ?? null,
          valid:
            latitude !== null &&
            longitude !== null &&
            Number.isFinite(lat) &&
            Number.isFinite(lon) &&
            lat >= -90 &&
            lat <= 90 &&
            lon >= -180 &&
            lon <= 180,
        };
      });
      const haversineMetres = (
        first: { lat: number; lon: number },
        second: { lat: number; lon: number },
      ): number => {
        const radians = (degrees: number): number => (degrees * Math.PI) / 180;
        const latitudeDelta = radians(second.lat - first.lat);
        const longitudeDelta = radians(second.lon - first.lon);
        const firstLatitude = radians(first.lat);
        const secondLatitude = radians(second.lat);
        const a =
          Math.sin(latitudeDelta / 2) ** 2 +
          Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2;
        return 2 * 6_371_008.8 * Math.asin(Math.sqrt(a));
      };
      // This catches missing geometry vertices only; it does not imply physical passability.
      let maximumSegmentMetres = 0;
      for (let index = 1; index < points.length; index += 1) {
        const previous = points[index - 1];
        const current = points[index];
        if (previous && current) {
          maximumSegmentMetres = Math.max(maximumSegmentMetres, haversineMetres(previous, current));
        }
      }
      const map = document.querySelector<HTMLElement>('[data-route-map]');
      const downloadLink = document.querySelector<HTMLAnchorElement>('a[download]');
      return {
        rootName: xml.documentElement.localName,
        namespace: xml.documentElement.namespaceURI,
        version: xml.documentElement.getAttribute('version'),
        hasParserError: xml.querySelector('parsererror') !== null,
        routeCount: elements('rte').length,
        routePointCount: points.length,
        trackPointCount: elements('trkpt').length,
        routeUrl: map?.dataset.gpxUrl,
        downloadUrl: downloadLink?.getAttribute('href'),
        mapPointCount: map?.dataset.routePointCount,
        mapFirstPoint: map?.dataset.routeFirstPoint,
        mapLastPoint: map?.dataset.routeLastPoint,
        mapLineExists: document.querySelector('.route-track-line') !== null,
        points,
        maximumSegmentMetres,
        metadata: elements('metadata')[0]?.textContent ?? '',
      };
    }, downloadedXml);

    expect(gpx.rootName).toBe('gpx');
    expect(gpx.namespace).toBe('http://www.topografix.com/GPX/1/1');
    expect(gpx.version).toBe('1.1');
    expect(gpx.hasParserError).toBe(false);
    expect(gpx.routeCount).toBe(1);
    expect(gpx.routePointCount).toBe(42);
    expect(gpx.trackPointCount).toBe(0);
    expect(gpx.routeUrl).toBe(gpx.downloadUrl);
    expect(gpx.routeUrl).toBe(gpxUrl);
    expect(gpx.mapPointCount).toBe(String(gpx.routePointCount));
    expect(gpx.mapFirstPoint).toBe('39.9497494,-2.5945212');
    expect(gpx.mapLastPoint).toBe(gpx.mapFirstPoint);
    expect(gpx.mapLineExists).toBe(true);
    expect(gpx.points.every((point) => point.valid)).toBe(true);
    expect(gpx.points.every((point) => point.name === null)).toBe(true);
    expect(gpx.points.at(-1)).toEqual(gpx.points[0]);
    expect(gpx.maximumSegmentMetres).toBeLessThanOrEqual(200);
    expect(gpx.metadata).toContain('ODbL');
    expect(gpx.metadata).toContain('660170707');
    expect(gpx.metadata).toContain('660170712');
    expect(gpx.metadata).toContain('178879058');
    expect(gpx.metadata).toContain('660170709');
    expect(gpx.metadata).toContain('660170708');
    expect(gpx.metadata).toContain('660170704');
  });

  test('keeps provisional access warning usable on a narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/rutas/');

    await expect(page.getByRole('link', { name: /Descargar GPX/ })).toBeVisible();
    await expect(
      page.getByText(/no sigas.*confirmación municipal.*recorrido presencial/i),
    ).toBeVisible();
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });
});
