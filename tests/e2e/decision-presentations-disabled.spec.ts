import { expect, test } from './fixtures';

test('serves only the generic 404 for disabled feature routes', async ({ page }) => {
  test.skip(
    process.env.PUBLIC_PALOMARENOS_ENABLED !== 'false' ||
      process.env.PUBLIC_BALL_GAME_ENABLED !== 'false',
    'Build and preview with both feature flags disabled.',
  );

  const requestedScripts: string[] = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'script') requestedScripts.push(request.url());
  });

  for (const route of ['/palomarenos-por-el-mundo/', '/juego/']) {
    const response = await page.goto(route);

    expect(response?.status(), `${route} should return an HTTP 404`).toBe(404);
    await expect(page.getByRole('heading', { name: 'Página no encontrada' })).toBeVisible();
    await expect(page.getByText('La página solicitada no existe.')).toBeVisible();
    await expect(page.getByText(/propuesta|presentación/i)).toHaveCount(0);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
    await expect(
      page.locator('[data-palomarenos-map], [data-palomarenos-form], #game-map'),
    ).toHaveCount(0);
    await expect(page.locator('form')).toHaveCount(0);
  }

  expect(
    requestedScripts.some((url) => /palomarenos-(map|form)|game-map|convex-game/i.test(url)),
  ).toBe(false);
});
