import { expect, test } from './fixtures';

test('keeps the Palomareños map and submission form hidden when the feature flag is off', async ({
  page,
}) => {
  test.skip(
    process.env.PUBLIC_PALOMARENOS_ENABLED !== 'false',
    'Run with PUBLIC_PALOMARENOS_ENABLED=false to verify the disabled state.',
  );

  const response = await page.goto('/palomarenos-por-el-mundo/');

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Página no encontrada' })).toBeVisible();
  await expect(page.getByText('La página solicitada no existe.')).toBeVisible();
  await expect(page.getByText(/propuesta|presentación/i)).toHaveCount(0);
  await expect(page.locator('[data-palomarenos-map]')).toHaveCount(0);
  await expect(page.locator('[data-palomarenos-form]')).toHaveCount(0);
  await expect(page.locator('form')).toHaveCount(0);
  await expect(
    page.locator('script[src*="palomarenos-map"], script[src*="palomarenos-form"]'),
  ).toHaveCount(0);
  await expect(page.locator('a[href="/palomarenos-por-el-mundo/"]')).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');

  await page.goto('/');
  await expect(page.locator('a[href="/palomarenos-por-el-mundo/"]')).toHaveCount(0);
});
