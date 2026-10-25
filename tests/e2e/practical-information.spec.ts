import { expect, test } from '@playwright/test';

test.describe('practical municipal information', () => {
  test('shows municipal contact details and a sourced transport schedule', async ({ page }) => {
    await page.goto('/informacion-practica/');

    await expect(page).toHaveTitle(/Información práctica/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Información práctica para el día a día' }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ayuntamiento y contacto' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Llamar al Ayuntamiento' })).toHaveAttribute(
      'href',
      'tel:969277601',
    );
    await expect(
      page.getByRole('link', { name: 'Escribir por correo electrónico' }),
    ).toHaveAttribute('href', 'mailto:ayto.palomares@gmail.com');
    await expect(
      page.getByRole('link', { name: 'Abrir ubicación en OpenStreetMap' }),
    ).not.toHaveAttribute('target', '_blank');

    const services = page.getByRole('heading', { name: 'Trámites y canales oficiales' });
    await expect(services).toBeVisible();
    const channels = page.getByRole('navigation', { name: 'Canales oficiales del Ayuntamiento' });
    await expect(channels.getByRole('link', { name: /Sede electrónica/ })).toHaveAttribute(
      'href',
      'https://palomaresdelcampo.sedelectronica.es/info.0',
    );
    await expect(channels.getByRole('link', { name: /Tablón de anuncios/ })).toHaveAttribute(
      'href',
      'https://palomaresdelcampo.sedelectronica.es/board',
    );
    await expect(
      page.getByRole('heading', { name: 'Transporte y servicios locales' }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Palomares del Campo → Cuenca' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Cuenca → Palomares del Campo' })).toBeVisible();
    await expect(
      page.getByRole('table', { name: 'Horarios Palomares del Campo a Cuenca' }),
    ).toContainText('07:45');
    await expect(
      page.getByRole('table', { name: 'Horarios Cuenca a Palomares del Campo' }),
    ).toContainText('15:15');
    await expect(page.getByText(/Publicado el \d{1,2} de \w+ de \d{4}/)).toBeVisible();
    await expect(page.getByRole('link', { name: /Ver bando original/ })).toHaveAttribute(
      'href',
      'https://www.bandomovil.com/vercomunicado.php?cod_municipio=palomaresdelcampo&id=1659178',
    );
    await expect(page.getByText(/Revisado el \d{1,2} de \w+ de \d{4}/)).toBeVisible();
  });

  test('keeps practical information within a mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/informacion-practica/');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Información práctica para el día a día' }),
    ).toBeVisible();

    const widths = await page.evaluate(() => ({
      document: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
    }));
    expect(widths.document).toBeLessThanOrEqual(widths.viewport);
  });
});
