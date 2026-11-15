import { expect, test } from './fixtures';

test.describe('directorio Servicios del pueblo', () => {
  test('is reachable from navigation and homepage and shows provenance and validation status', async ({
    page,
  }) => {
    await page.goto('/servicios-del-pueblo/');

    await expect(page).toHaveTitle(/Servicios del pueblo/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Servicios del pueblo' }),
    ).toBeVisible();
    await expect(
      page.getByRole('complementary', { name: 'Aviso sobre la revisión de la información' }),
    ).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 2, name: 'Hostelería' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Bar Los Arcos' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Pub Colin’s' })).toBeVisible();
    await expect(page.getByText(/Actividad confirmada por su propietario/).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Ficha de TodoBares/ })).toHaveAttribute(
      'href',
      'https://www.todobares.com/bar/bar-los-arcos-palomares-del-campo/',
    );
    await expect(page.getByRole('link', { name: /Ficha de TodoBares/ })).not.toHaveAttribute(
      'target',
    );
    await expect(page.getByRole('heading', { level: 3, name: 'Biblioteca' })).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 3, name: 'Carnicería Dionisio' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 3, name: 'Frutas Millán C. B.' }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Udaco Alimentación' })).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 3, name: 'Artesanías Molero del Río' }),
    ).toBeVisible();
    await expect(page.getByText(/Fuente · 28 de junio de 2024:/)).toBeVisible();
    await expect(page.getByText(/estado actual sin verificar/).first()).toBeVisible();
    await expect(page.getByText(/^Dirección:/)).toHaveCount(0);
    await expect(page.getByText(/^Teléfono:/)).toHaveCount(0);
    await expect(page.getByText(/^Horario:/)).toHaveCount(0);
    await expect(page.getByText(/TODO\(AYTO\)/)).toHaveCount(0);

    await page.setViewportSize({ width: 390, height: 844 });
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });

  test('offers a homepage entry point and a navigation item', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /Ver servicios del pueblo/ })).toHaveAttribute(
      'href',
      '/servicios-del-pueblo/',
    );
    await expect(
      page.getByText('Conoce el pueblo, consulta sus tradiciones y encuentra servicios locales.'),
    ).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Explorar' }).click();
    const menu = page.locator('#site-menu');
    await expect(menu.getByRole('link', { name: 'Servicios del pueblo' })).toHaveCount(2);
    await expect(menu.getByRole('link', { name: 'Servicios del pueblo' }).first()).toHaveAttribute(
      'href',
      '/servicios-del-pueblo/',
    );
  });
});
