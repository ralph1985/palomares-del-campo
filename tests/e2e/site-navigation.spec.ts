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

  test('links the church heritage card to its expanded sourced guide', async ({ page }) => {
    await page.goto('/sobre-el-pueblo/');

    await page.getByRole('link', { name: 'Descubrir la iglesia' }).click();

    await expect(page).toHaveURL('/sobre-el-pueblo/iglesia/');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Iglesia de Nuestra Señora de la Asunción' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Capillas, pintura y escultura' }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Qué ver · portal municipal' })).toHaveAttribute(
      'href',
      'https://palomaresdelcampo.dipucuenca.es/index.php/layout/layout-three',
    );
    await expect(
      page.getByRole('link', { name: 'Ficha de la parroquia · Diócesis de Cuenca' }),
    ).toHaveAttribute(
      'href',
      'https://www.diocesisdecuenca.es/parroquia/parroquia-de-ntra-sra-de-la-asuncion-58/',
    );
    await expect(page.getByText(/no horarios ni condiciones de acceso/)).toBeVisible();
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
