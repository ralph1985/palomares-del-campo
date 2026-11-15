import { expect, test } from '@playwright/test';

test.describe('home information architecture', () => {
  test('explains the site and puts useful tasks within reach', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Palomares del Campo.');
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(
      'Palomares del Campo.',
    );
    await expect(page.getByText('Agenda, servicios e historias del pueblo.')).toBeVisible();
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
    const residentCard = page
      .getByRole('article')
      .filter({ has: page.getByRole('heading', { name: 'Soy vecino' }) });
    const visitorCard = page
      .getByRole('article')
      .filter({ has: page.getByRole('heading', { name: 'Descubre Palomares' }) });
    await expect(residentCard.getByRole('link', { name: 'Servicios del pueblo' })).toHaveAttribute(
      'href',
      '/servicios-del-pueblo/',
    );
    await expect(visitorCard.getByRole('link', { name: 'Servicios del pueblo' })).toHaveAttribute(
      'href',
      '/servicios-del-pueblo/',
    );

    for (const width of [320, 375]) {
      await page.setViewportSize({ width, height: 812 });
      const dimensions = await page.evaluate(() => ({
        document: document.documentElement.scrollWidth,
        viewport: document.documentElement.clientWidth,
      }));
      expect(dimensions.document, `homepage at ${width}px`).toBeLessThanOrEqual(
        dimensions.viewport,
      );
      await expect(residentCard.getByRole('link', { name: 'Servicios del pueblo' })).toBeVisible();
      await expect(visitorCard.getByRole('link', { name: 'Servicios del pueblo' })).toBeVisible();
    }
  });
});
