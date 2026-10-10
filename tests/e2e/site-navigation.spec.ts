import { expect, test } from '@playwright/test';

test.describe('web navigation', () => {
  test('renders the home page and the game entry point', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Palomares del Campo/);
    await expect(page.getByRole('heading', { name: /Un nuevo espacio/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Probar el mapa del juego/ })).toHaveAttribute(
      'href',
      '/juego/',
    );
    await expect(page.locator('.brand-mark img')).toHaveAttribute(
      'src',
      '/brand/escudo-palomares-del-campo.svg',
    );
    await expect(
      page.getByRole('link', { name: 'Web realizada por conquense.dev' }),
    ).toHaveAttribute('href', 'https://conquense.dev/');
  });

  test('opens and closes the accessible side menu', async ({ page }) => {
    await page.goto('/');

    const menu = page.locator('#site-menu');
    await expect(menu).toHaveAttribute('aria-hidden', 'true');
    await expect(menu).toHaveAttribute('inert', '');

    await page.getByRole('button', { name: 'Explorar' }).click();
    await expect(menu).toHaveAttribute('aria-hidden', 'false');
    await expect(menu).not.toHaveAttribute('inert');
    await expect(menu.getByRole('link', { name: 'La bola' })).toBeVisible();

    await menu.getByRole('button', { name: 'Cerrar menú' }).click();
    await expect(menu).toHaveAttribute('aria-hidden', 'true');
    await expect(menu).toHaveAttribute('inert', '');
  });

  test('closes the side menu with Escape', async ({ page }) => {
    await page.goto('/');
    const menu = page.locator('#site-menu');

    await page.getByRole('button', { name: 'Explorar' }).click();
    await expect(menu).toHaveAttribute('aria-hidden', 'false');
    await page.keyboard.press('Escape');
    await expect(menu).toHaveAttribute('aria-hidden', 'true');
  });
});
