import { expect, test } from './fixtures';

test('keeps the Palomareños map and submission form hidden when the feature flag is off', async ({
  page,
}) => {
  test.skip(
    process.env.PUBLIC_PALOMARENOS_ENABLED !== 'false',
    'Run with PUBLIC_PALOMARENOS_ENABLED=false to verify the disabled state.',
  );

  await page.goto('/palomarenos-por-el-mundo/');

  await expect(page.locator('#page-title')).toHaveText('Palomareños por el mundo');
  await expect(page.getByRole('heading', { name: 'La sección se está preparando' })).toBeVisible();
  await expect(
    page.getByText('El mapa y el envío de propuestas estarán disponibles más adelante.'),
  ).toBeVisible();
  await expect(page.locator('[data-palomarenos-map]')).toHaveCount(0);
  await expect(page.locator('[data-palomarenos-form]')).toHaveCount(0);
});
