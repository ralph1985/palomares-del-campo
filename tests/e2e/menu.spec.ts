import { expect, test } from '@playwright/test';

test.describe('accessible site menu', () => {
  test('opens, exposes navigation groups and returns focus on close', async ({ page }) => {
    await page.goto('/');

    const toggle = page.getByRole('button', { name: 'Explorar' });
    const menu = page.locator('#site-menu');
    const closeButton = menu.getByRole('button', { name: 'Cerrar menú' });

    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(menu).toHaveAttribute('aria-hidden', 'true');
    await expect(menu).toHaveAttribute('inert', '');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(menu).toHaveAttribute('aria-hidden', 'false');
    await expect(menu).not.toHaveAttribute('inert');
    await expect(closeButton).toBeFocused();
    await expect(menu.getByRole('heading', { name: 'Vecinos' })).toBeVisible();
    await expect(menu.getByRole('heading', { name: 'Visita' })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Servicios municipales' })).toHaveAttribute(
      'href',
      '/informacion-practica/',
    );
    await expect(menu.getByRole('link', { name: 'Sobre el pueblo' })).toHaveAttribute(
      'href',
      '/sobre-el-pueblo/',
    );
    await expect(menu.getByRole('link', { name: 'Rutas' })).toHaveAttribute('href', '/rutas/');

    await closeButton.click();
    await expect(menu).toHaveAttribute('aria-hidden', 'true');
    await expect(menu).toHaveAttribute('inert', '');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();

    await toggle.click();
    await page.keyboard.press('Escape');
    await expect(menu).toHaveAttribute('aria-hidden', 'true');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
  });
});
