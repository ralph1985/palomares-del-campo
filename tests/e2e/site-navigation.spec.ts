import { expect, test } from '@playwright/test';

test.describe('web navigation', () => {
  test('renders the home page and the game entry point', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Palomares del Campo/);
    await expect(page.getByRole('heading', { name: /Un nuevo espacio/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Probar el mapa del juego/ })).toHaveAttribute(
      'href',
      '/juego/',
    );
    await expect(page.locator('.brand-mark img')).toHaveAttribute(
      'src',
      '/brand/escudo-palomares-del-campo.svg',
    );
    await expect(
      page.getByRole('link', { name: 'Web realizada por conquense.dev' }),
    ).toHaveAttribute('href', 'https://conquense.dev/');
  });

  test('presents the about page with history, heritage and sources', async ({ page }) => {
    await page.goto('/sobre-el-pueblo/');

    await expect(page).toHaveTitle(/Sobre Palomares del Campo/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Un pueblo con muchas capas de historia.' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Una historia ligada al territorio' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Iglesia de Nuestra Señora de la Asunción' }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Fiestas y memoria viva' })).toBeVisible();
    await expect(
      page.getByRole('img', {
        name: 'Fachada de la iglesia de Nuestra Señora de la Asunción de Palomares del Campo',
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('img', {
        name: 'Fuente del Pez y restos del Castillo de San Miguel en el entorno de Palomares del Campo',
      }),
    ).toHaveAttribute('loading', 'lazy');
    await expect(
      page.getByRole('img', { name: 'Escena de las fiestas de Palomares del Campo' }),
    ).toHaveAttribute('loading', 'lazy');
    await expect(page.getByRole('link', { name: 'Historia del portal municipal' })).toHaveAttribute(
      'href',
      'https://palomaresdelcampo.dipucuenca.es/index.php/layout/layout-4',
    );
    await expect(
      page.getByRole('link', { name: 'Sobre el pueblo', exact: true }).last(),
    ).toHaveAttribute('href', '/sobre-el-pueblo/');
  });

  test('exposes official Palomares municipal services in the footer', async ({ page }) => {
    await page.goto('/');

    const footer = page.getByRole('contentinfo');
    await expect(footer.getByRole('link', { name: 'Sede electrónica' })).toHaveAttribute(
      'href',
      'https://palomaresdelcampo.sedelectronica.es/info.0',
    );
    await expect(footer.getByRole('link', { name: 'Tablón de anuncios' })).toHaveAttribute(
      'href',
      'https://palomaresdelcampo.sedelectronica.es/board',
    );
    await expect(footer.getByRole('link', { name: 'Portal de transparencia' })).toHaveAttribute(
      'href',
      'https://palomaresdelcampo.sedelectronica.es/transparency',
    );
    await expect(footer.getByRole('link', { name: 'Buzón electrónico' })).toHaveAttribute(
      'href',
      'https://palomaresdelcampo.sedelectronica.es/enotifications',
    );
  });

  test('loads the optional 3D scene only after opening the menu', async ({ page }) => {
    const threeRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().toLowerCase().includes('three')) threeRequests.push(request.url());
    });

    await page.goto('/');
    expect(threeRequests).toHaveLength(0);
    await page.getByRole('button', { name: 'Explorar' }).click();
    await expect.poll(() => threeRequests.length).toBeGreaterThan(0);
  });

  test('opens and closes the accessible side menu', async ({ page }) => {
    await page.goto('/');

    const menu = page.locator('#site-menu');
    await expect(menu).toHaveAttribute('aria-hidden', 'true');
    await expect(menu).toHaveAttribute('inert', '');

    await page.getByRole('button', { name: 'Explorar' }).click();
    await expect(menu).toHaveAttribute('aria-hidden', 'false');
    await expect(menu).not.toHaveAttribute('inert');
    await expect(menu.getByRole('link', { name: 'La bola' })).toBeVisible();

    await menu.getByRole('button', { name: 'Cerrar menú' }).click();
    await expect(menu).toHaveAttribute('aria-hidden', 'true');
    await expect(menu).toHaveAttribute('inert', '');
  });

  test('closes the side menu with Escape', async ({ page }) => {
    await page.goto('/');
    const menu = page.locator('#site-menu');

    await page.getByRole('button', { name: 'Explorar' }).click();
    await expect(menu).toHaveAttribute('aria-hidden', 'false');
    await page.keyboard.press('Escape');
    await expect(menu).toHaveAttribute('aria-hidden', 'true');
  });
});
