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
    await expect(page.getByRole('link', { name: /Conocer el pueblo/ })).toHaveAttribute(
      'href',
      '/sobre-el-pueblo/',
    );
  });
});
