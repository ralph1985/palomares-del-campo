import { expect, test } from '@playwright/test';

test.describe('web navigation', () => {
  test('shows the home identity and creator credit', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Palomares del Campo/);
    await expect(page.getByRole('heading', { name: /Un nuevo espacio/ })).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Web realizada por conquense.dev' }),
    ).toHaveAttribute('href', 'https://conquense.dev/');
  });

  test('separates the home hero surface from the light site header', async ({ page }) => {
    await page.goto('/');

    const surfaces = await page.evaluate(() => {
      const header = document.querySelector('.site-header');
      const hero = document.querySelector('.editorial-hero');

      if (!(header instanceof HTMLElement) || !(hero instanceof HTMLElement)) {
        throw new Error('Expected the site header and home hero to render');
      }

      return {
        header: getComputedStyle(header).backgroundColor,
        hero: getComputedStyle(hero).backgroundColor,
      };
    });

    expect(surfaces.hero).not.toBe('rgba(0, 0, 0, 0)');
    expect(surfaces.hero).not.toBe(surfaces.header);
  });

  test('presents the about page with a sourced history section', async ({ page }) => {
    await page.goto('/sobre-el-pueblo/');

    await expect(page).toHaveTitle(/Sobre Palomares del Campo/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Un pueblo con muchas capas de historia.' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Una historia ligada al territorio' }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Historia del portal municipal' })).toHaveAttribute(
      'href',
      'https://palomaresdelcampo.dipucuenca.es/index.php/layout/layout-4',
    );
  });

  test('exposes official Palomares municipal services in the footer', async ({ page }) => {
    await page.goto('/');

    const footer = page.getByRole('contentinfo');
    await expect(footer.getByText('Información municipal')).toBeVisible();
    await expect(footer.getByRole('heading', { name: 'Enlaces oficiales' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Portal municipal' })).toHaveAttribute(
      'href',
      'https://palomaresdelcampo.dipucuenca.es/',
    );
    await expect(
      footer.getByRole('link', { name: 'Ver todos los servicios municipales' }),
    ).toHaveAttribute('href', '/informacion-practica/');
  });

  test('falls back gracefully when the optional 3D scene fails to load', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.route('**/src/scripts/menu-scene.ts', (route) => route.abort());
    await page.goto('/');

    const failedSceneRequest = page.waitForEvent('requestfailed', (request) =>
      request.url().includes('/src/scripts/menu-scene.ts'),
    );
    const menu = page.locator('#site-menu');
    await page.getByRole('button', { name: 'Explorar' }).click();
    await failedSceneRequest;

    await expect(menu).toHaveAttribute('aria-hidden', 'false');
    await expect(menu.getByRole('link', { name: 'La bola' })).toBeVisible();
    expect(pageErrors).toEqual([]);
  });
});
