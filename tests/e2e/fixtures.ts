import { expect, test as base } from '@playwright/test';

export { expect };

const svgFixture = '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"></svg>';

export const test = base.extend({
  page: async ({ page }, use) => {
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
    await use(page);
  },
});
