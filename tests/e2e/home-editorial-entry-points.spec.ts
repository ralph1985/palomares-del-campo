import { expect, test } from '@playwright/test';

test.describe('home editorial entry points', () => {
  test('connects the four ways to discover Palomares', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Pasear' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Descubrir', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Celebrar' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Jugar' })).toBeVisible();

    const firstCard = page.locator('.editorial-card').first();
    const sectionBackground = await page
      .locator('.editorial-section')
      .evaluate((section) => getComputedStyle(section).backgroundColor);
    const firstCardBackground = await firstCard.evaluate(
      (card) => getComputedStyle(card).backgroundColor,
    );

    const secondCardBackground = await page
      .locator('.editorial-card')
      .nth(1)
      .evaluate((card) => getComputedStyle(card).backgroundColor);

    expect(firstCardBackground).not.toBe(sectionBackground);
    expect(firstCardBackground).not.toBe(secondCardBackground);
    await expect(firstCard).toHaveCSS('border-radius', '24px');

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
  });
});
