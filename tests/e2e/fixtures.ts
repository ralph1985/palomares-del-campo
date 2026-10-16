import { expect, test as base } from '@playwright/test';
import { registerExternalAssetFixtures } from '../../scripts/e2e-network-fixtures';

export { expect };

export const test = base.extend({
  page: async ({ page }, use) => {
    await registerExternalAssetFixtures(page);
    await use(page);
  },
});
