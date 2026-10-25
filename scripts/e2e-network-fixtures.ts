import type { Page } from '@playwright/test';

const svgFixture = '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"></svg>';
const astroImageFixture =
  '<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="853"></svg>';

export const registerExternalAssetFixtures = async (page: Page): Promise<void> => {
  await page.route(/\/_image(\?|\/|$)/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      headers: { 'x-e2e-astro-image': 'fixture' },
      body: astroImageFixture,
    }),
  );
  await page.route(/^https:\/\/[a-z]\.tile\.openstreetmap\.org\//, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      headers: { 'x-e2e-map-tile': 'fixture' },
      body: svgFixture,
    }),
  );
  await page.route(/^https:\/\/www\.bandomovil\.com\/userFiles\//, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      headers: { 'x-e2e-bando-asset': 'fixture' },
      body: svgFixture,
    }),
  );
};
