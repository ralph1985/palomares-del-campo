import { expect, test } from '@playwright/test';

test.describe('accessible site menu', () => {
  test('keeps navigation visible and compact on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const menu = page.locator('#site-menu');
    const link = menu.getByRole('link', { name: 'Sobre el pueblo' });

    await expect(menu).toHaveAttribute('aria-hidden', 'false');
    await expect(menu).not.toHaveAttribute('inert');
    await expect(link).toBeVisible();
    await expect(menu.locator('.menu-crest')).toBeVisible();
    await expect(menu.locator('.menu-crest')).toHaveAttribute(
      'src',
      '/brand/escudo-palomares-del-campo.svg',
    );
    await expect(menu.locator('.side-nav a span')).toHaveCount(0);
    await expect(page.locator('[data-menu-toggle]')).toBeHidden();
    await expect
      .poll(() => link.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)))
      .toBeLessThan(22);
  });

  test('opens, exposes navigation groups and returns focus on close', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const toggle = page.getByRole('button', { name: 'Explorar' });
    const menu = page.locator('#site-menu');
    const closeButton = menu.getByRole('button', { name: 'Cerrar menú' });
    const contactFooter = page.locator('#contacto');

    await expect(contactFooter.getByRole('heading', { name: 'Contacto' })).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(menu).toHaveAttribute('aria-hidden', 'true');
    await expect(menu).toHaveAttribute('inert', '');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(menu).toHaveAttribute('aria-hidden', 'false');
    await expect(menu).not.toHaveAttribute('inert');
    await expect
      .poll(() =>
        menu
          .getByRole('link', { name: 'Sobre el pueblo' })
          .evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)),
      )
      .toBeGreaterThanOrEqual(24);
    await expect
      .poll(() =>
        menu
          .getByRole('link', { name: 'Sobre el pueblo' })
          .evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)),
      )
      .toBeLessThan(30);
    await expect(closeButton).toBeFocused();
    await expect(menu.getByRole('heading', { name: 'Vecinos' })).toBeVisible();
    await expect(menu.getByRole('heading', { name: 'Visita' })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Contacto' })).toHaveCount(0);
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
