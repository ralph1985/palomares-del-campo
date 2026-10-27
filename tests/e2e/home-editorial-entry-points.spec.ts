import { expect, test } from '@playwright/test';

test.describe('home editorial entry points', () => {
  test('connects the four ways to discover Palomares', async ({ page }) => {
    await page.goto('/');

    const guide = page.getByRole('region', { name: '¿Qué quieres consultar?' });
    await expect(guide).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pasear' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Descubrir', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Celebrar' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Jugar' })).toBeVisible();

    await expect(page.getByRole('link', { name: /Ver el paisaje/ })).toHaveAttribute(
      'href',
      '/sobre-el-pueblo/#paisaje',
    );
    await expect(page.getByRole('link', { name: /Ver el patrimonio/ })).toHaveAttribute(
      'href',
      '/sobre-el-pueblo/#patrimonio',
    );
    await expect(page.getByRole('link', { name: /Ver las fiestas/ })).toHaveAttribute(
      'href',
      '/sobre-el-pueblo/#tradiciones',
    );
    await expect(page.getByRole('link', { name: /Entrar en el juego/ })).toHaveAttribute(
      'href',
      '/juego/',
    );

    const guideSurface = await guide.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );
    const audienceSurface = await page
      .locator('.audience-section')
      .evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(guideSurface).not.toBe(audienceSurface);
  });
});
