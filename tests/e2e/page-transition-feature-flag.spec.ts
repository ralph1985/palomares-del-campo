import { expect, test } from './fixtures';

const expectedFlagValue = process.env.PUBLIC_PAGE_TRANSITIONS_ENABLED === 'true' ? 'true' : 'false';

test('exposes the page-transition build flag on the shared shell', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toHaveAttribute(
    'data-page-transitions-enabled',
    expectedFlagValue,
  );
});
