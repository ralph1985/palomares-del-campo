import { expect, test } from '@playwright/test';

test.describe('current affairs sections', () => {
  test('shows an honest empty agenda state', async ({ page }) => {
    await page.goto('/agenda/');

    await expect(page).toHaveTitle(/Agenda/);
    await expect(page.getByRole('heading', { level: 1, name: 'Agenda' })).toBeVisible();
    await expect(page.getByText('No hay actividades publicadas todavía.')).toBeVisible();
    await expect(page.locator('[data-current-affairs-empty]')).toHaveAttribute(
      'data-section',
      'agenda',
    );
  });

  test('keeps notices separate from editorial news', async ({ page }) => {
    await page.goto('/avisos/');

    await expect(page).toHaveTitle(/Avisos/);
    await expect(page.getByRole('heading', { level: 1, name: 'Avisos' })).toBeVisible();
    await expect(page.getByText('No hay avisos vigentes.')).toBeVisible();
    await expect(page.locator('[data-current-affairs-empty]')).toHaveAttribute(
      'data-section',
      'avisos',
    );

    await page.goto('/');
    await page.getByRole('button', { name: 'Explorar' }).click();
    const menu = page.locator('#site-menu');
    await expect(menu.getByRole('link', { name: /Noticias/ })).toHaveAttribute(
      'href',
      '/noticias/',
    );
    await expect(menu.getByRole('link', { name: /Agenda/ })).toHaveAttribute('href', '/agenda/');
    await expect(menu.getByRole('link', { name: /Avisos/ })).toHaveAttribute('href', '/avisos/');
  });
});
