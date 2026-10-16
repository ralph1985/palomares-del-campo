import { expect, test as base } from '@playwright/test';

export { expect };

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route(/^https:\/\/[a-z]\.tile\.openstreetmap\.org\//, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'image/svg+xml',
        headers: { 'x-e2e-map-tile': 'fixture' },
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"></svg>',
      }),
    );
    await use(page);
  },
});
