import { expect, test } from './fixtures';

test('serves both feature routes when both build flags are enabled', async ({ page }) => {
  test.skip(
    process.env.PUBLIC_PALOMARENOS_ENABLED !== 'true' ||
      process.env.PUBLIC_BALL_GAME_ENABLED !== 'true',
    'Build and preview with both feature flags enabled.',
  );

  const palomarenosResponse = await page.goto('/palomarenos-por-el-mundo/');
  expect(palomarenosResponse?.status()).toBe(200);
  await expect(page.locator('#page-title')).toHaveText('Palomareños por el mundo');
  await expect(page.locator('[data-palomarenos-map]')).toBeVisible();
  await expect(page.locator('[data-palomarenos-form]')).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index,follow');

  const gameResponse = await page.goto('/juego/');
  expect(gameResponse?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'La bola está en juego.' })).toBeVisible();
  await expect(page.locator('#game-map')).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index,follow');
});
