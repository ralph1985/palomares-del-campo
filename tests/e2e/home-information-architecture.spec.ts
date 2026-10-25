import { expect, test } from '@playwright/test';

test.describe('home information architecture', () => {
  test('explains the site and puts useful tasks within reach', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Palomares, en un mismo lugar.',
    );
    await expect(page.getByText(/servicios municipales, agenda y bandos/)).toBeVisible();
    await expect(page.getByRole('link', { name: /Consultar la agenda/ })).toHaveAttribute(
      'href',
      '/agenda/',
    );
    await expect(page.getByRole('link', { name: /Servicios municipales/ }).first()).toHaveAttribute(
      'href',
      '/informacion-practica/',
    );
  });

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
