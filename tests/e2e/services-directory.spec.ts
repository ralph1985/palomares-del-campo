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
    await expect(
      page.getByText(
        'Comercios, hostelería e instalaciones locales con su fuente y estado de revisión.',
      ),
    ).toBeVisible();
    await expect(page.getByText('Directorio revisable')).toHaveCount(0);
    await expect(
      page.getByText(/Esta página es una recopilación editorial en revisión/),
    ).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 2, name: 'Hostelería' })).toBeVisible();
    const losArcos = page.getByRole('article', { name: 'Bar Los Arcos' });
    const colins = page.getByRole('article', { name: 'Pub Colin’s' });
    await expect(losArcos.locator('.service-card__status')).toContainText('Abierto');
    await expect(colins.locator('.service-card__status')).toContainText('Abierto');
    await expect(page.getByText(/confirmada por su propietario/i)).toHaveCount(0);
    const justo = page.getByRole('article', { name: 'Carnicería · candidato: Justo Ruiz Gómez' });
    const estanco = page.getByRole('article', {
      name: 'Estanco · candidato; titular por confirmar',
    });
    await expect(justo.locator('.service-card__status')).toContainText('Actividad sin verificar');
    await expect(estanco.locator('.service-card__status')).toContainText('Actividad sin verificar');
    await expect(estanco.locator('.service-card__source')).toContainText('15 de noviembre de 2026');
    await expect(page.getByRole('heading', { level: 3, name: /Sotanillo/i })).toHaveCount(0);
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
    await expect(page.getByText('Vigencia sin verificar').first()).toBeVisible();
    await expect(page.getByText(/^Dirección:/)).toHaveCount(0);
    await expect(page.getByText(/^Teléfono:/)).toHaveCount(0);
    await expect(page.getByText(/^Horario:/)).toHaveCount(0);
    await expect(page.getByText(/TODO\(AYTO\)/)).toHaveCount(0);

    for (const width of [320, 375, 390]) {
      await page.setViewportSize({ width, height: 844 });
      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hasHorizontalOverflow, `directory at ${width}px`).toBe(false);
    }
  });

  test('keeps the official candidate source link clear of the floating return control', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/servicios-del-pueblo/');

    const sourceLink = page
      .getByRole('article', { name: 'Estanco · candidato; titular por confirmar' })
      .getByRole('link', { name: 'Registro oficial de expendedurías activas' });
    const backToTop = page.getByRole('button', { name: 'Volver arriba' });
    const targetScrollY = await page.evaluate(() => {
      const control = document.querySelector<HTMLButtonElement>('[data-back-to-top]');
      const link = [
        ...document.querySelectorAll<HTMLAnchorElement>('.service-card__source a'),
      ].find((anchor) => anchor.textContent?.includes('Registro oficial de expendedurías activas'));
      if (!control || !link) throw new Error('Missing source link or return control');

      const wasHidden = control.hidden;
      control.hidden = false;
      const controlTop = control.getBoundingClientRect().top;
      const linkDocumentTop = link.getBoundingClientRect().top + window.scrollY;
      control.hidden = wasHidden;
      return linkDocumentTop - controlTop + 4;
    });

    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), targetScrollY);
    await expect(sourceLink).toBeVisible();
    await expect(backToTop).toBeHidden();
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
