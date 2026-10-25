import { expect, test } from '@playwright/test';

test.describe('home information architecture', () => {
  test('explains the site and puts useful tasks within reach', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(
      'Piedra, campo y vida.',
    );
    await expect(page.getByText(/La agenda, los servicios y las historias/)).toBeVisible();
    await expect(page.getByRole('img', { name: /Fachada de la iglesia/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Fotografía: portal municipal/ })).toHaveAttribute(
      'href',
      'https://palomaresdelcampo.dipucuenca.es/index.php/layout/layout-three',
    );
    await expect(page.getByRole('link', { name: /Ver la agenda/ })).toHaveAttribute(
      'href',
      '/agenda/',
    );
    await expect(page.getByRole('link', { name: /Descubrir el pueblo/ })).toHaveAttribute(
      'href',
      '/sobre-el-pueblo/',
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
