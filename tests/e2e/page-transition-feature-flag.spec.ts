import { expect, test } from './fixtures';

const expectedFlagValue = process.env.PUBLIC_PAGE_TRANSITIONS_ENABLED === 'true' ? 'true' : 'false';

test('exposes the page-transition build flag on the shared shell', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toHaveAttribute(
    'data-page-transitions-enabled',
    expectedFlagValue,
  );
});

test('disables cube transitions when the build-time flag is false', async ({ page }) => {
  test.skip(
    process.env.PUBLIC_PAGE_TRANSITIONS_ENABLED !== 'false',
    'Run with PUBLIC_PAGE_TRANSITIONS_ENABLED=false to verify the kill switch.',
  );

  let sceneRequests = 0;
  page.on('request', (request) => {
    if (request.url().includes('page-transition-scene')) sceneRequests += 1;
  });
  await page.addInitScript(() => {
    sessionStorage.setItem('palomares-page-transition', 'incoming');
  });
  await page.goto('/noticias/');

  await expect(page.locator('[data-page-transition-overlay]')).toHaveCount(0);
  await expect(page.locator('html')).not.toHaveAttribute('data-page-transition-state');
  expect(await page.evaluate(() => sessionStorage.getItem('palomares-page-transition'))).toBeNull();

  const articleLink = page.locator('.news-card').first().locator('h3 a');
  const href = await articleLink.getAttribute('href');
  if (!href) throw new Error('The first news card has no destination URL.');
  const destination = new URL(href, page.url());
  await articleLink.click({ noWaitAfter: true });

  await page.waitForURL((url) => url.pathname === destination.pathname, {
    waitUntil: 'commit',
    timeout: 3000,
  });
  await expect(page.locator('[data-page-transition-overlay]')).toHaveCount(0);
  expect(sceneRequests).toBe(0);
});
