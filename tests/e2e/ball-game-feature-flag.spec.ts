import { expect, test } from './fixtures';

test('shows the ball-game entry points when its feature flag is enabled', async ({ page }) => {
  test.skip(
    process.env.PUBLIC_BALL_GAME_ENABLED !== 'true',
    'Run with PUBLIC_BALL_GAME_ENABLED=true to verify the enabled state.',
  );

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Jugar' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Probar el mapa del juego/ })).toBeVisible();
  await expect(page.locator('footer').getByRole('link', { name: 'La bola' })).toBeVisible();

  await page.getByRole('button', { name: 'Explorar' }).click();
  await expect(page.locator('#site-menu').getByRole('link', { name: 'La bola' })).toBeVisible();

  await page.goto('/rutas/');
  await expect(page.getByRole('link', { name: /Probar La bola/ })).toBeVisible();

  await page.goto('/juego/');
  await expect(page.getByRole('heading', { name: 'La bola está en juego.' })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index,follow');
});

test('hides every ball-game entry point when its feature flag is disabled', async ({ page }) => {
  test.skip(
    process.env.PUBLIC_BALL_GAME_ENABLED !== 'false',
    'Run with PUBLIC_BALL_GAME_ENABLED=false to verify the disabled state.',
  );

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Jugar' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Probar el mapa del juego/ })).toHaveCount(0);
  await expect(page.locator('footer').getByRole('link', { name: 'La bola' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Explorar' }).click();
  const menu = page.locator('#site-menu');
  await expect(menu.getByRole('link', { name: 'La bola' })).toHaveCount(0);

  await page.goto('/rutas/');
  await expect(page.getByRole('link', { name: /Probar La bola/ })).toHaveCount(0);

  const response = await page.goto('/juego/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Página no encontrada' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'La bola está en juego.' })).toHaveCount(0);
  await expect(page.locator('#game-map')).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
});
