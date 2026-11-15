import { expect, test } from './fixtures';

test('presents Palomareños as a static proposal while the feature is disabled', async ({
  page,
}) => {
  test.skip(
    process.env.PUBLIC_PALOMARENOS_ENABLED !== 'false',
    'Run with PUBLIC_PALOMARENOS_ENABLED=false to verify the decision presentation.',
  );

  await page.goto('/palomarenos-por-el-mundo/');

  await expect(page.getByRole('heading', { name: 'Palomareños por el mundo' })).toBeVisible();
  await expect(page.getByText('Presentación estática.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Qué podría proponerse' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Qué sería público' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Revisión y solicitudes' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Decisiones pendientes' })).toBeVisible();
  await expect(page.locator('[data-palomarenos-map]')).toHaveCount(0);
  await expect(page.locator('[data-palomarenos-form]')).toHaveCount(0);
  await expect(page.locator('form')).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Explorar' }).click();
  await expect(
    page.locator('#site-menu').getByRole('link', { name: 'Palomareños por el mundo' }),
  ).toHaveCount(0);
});

test('presents La bola as a static proposal while its feature is disabled', async ({ page }) => {
  test.skip(
    process.env.PUBLIC_BALL_GAME_ENABLED !== 'false',
    'Run with PUBLIC_BALL_GAME_ENABLED=false to verify the decision presentation.',
  );

  const response = await page.goto('/juego/');

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'La bola', exact: true })).toBeVisible();
  await expect(page.getByText('Solo presentación estática.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Qué habría que decidir' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Acceso y seguridad' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Estado actual' })).toBeVisible();
  await expect(page.locator('#game-map')).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');

  const gameScripts = await page
    .locator('script[src]')
    .evaluateAll((scripts) => scripts.map((script) => script.getAttribute('src') ?? ''));
  expect(gameScripts.some((src) => /game-map|convex-game|leaflet/i.test(src))).toBe(false);
});
