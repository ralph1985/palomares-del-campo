import { expect, test } from '@playwright/test';

test.describe('home information architecture', () => {
  test('offers distinct paths for residents and visitors', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Soy vecino' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Descubre Palomares' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Ver servicios municipales/ })).toHaveAttribute(
      'href',
      '/informacion-practica/',
    );
    await expect(page.locator('#vecinos')).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Conocer el pueblo/ })).toHaveAttribute(
      'href',
      '/sobre-el-pueblo/',
    );
  });

  test('groups the side menu by purpose', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Explorar' }).click();

    const menu = page.locator('#site-menu');
    await expect(menu.getByRole('heading', { name: 'Vecinos' })).toBeVisible();
    await expect(menu.getByRole('heading', { name: 'Visita' })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Paisaje y patrimonio' })).toHaveCount(0);
    await expect(menu.getByRole('link', { name: 'Servicios municipales' })).toHaveAttribute(
      'href',
      '/informacion-practica/',
    );
    await expect(menu.getByRole('link', { name: 'Sobre el pueblo' })).toHaveAttribute(
      'href',
      '/sobre-el-pueblo/',
    );
  });
});
