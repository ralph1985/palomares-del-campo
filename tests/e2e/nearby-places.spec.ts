import { expect, test } from './fixtures';

const placesUrl = '/que-ver-cerca/';

test.describe('nearby attractions guide', () => {
  test('presents sourced nearby places and longer day trips', async ({ page }) => {
    await page.goto(placesUrl);

    await expect(page).toHaveTitle(/Qué ver cerca de Palomares del Campo/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Qué ver cerca de Palomares del Campo' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Cerca de Palomares', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Escapadas para dedicarles más tiempo' }),
    ).toBeVisible();

    const segobriga = page.getByRole('article', { name: 'Segóbriga y Saelices' });
    await expect(segobriga).toContainText('ciudad romana');
    await expect(
      segobriga.getByRole('link', { name: 'Parque Arqueológico de Segóbriga' }),
    ).toHaveAttribute(
      'href',
      'https://www.turismocastillalamancha.es/es/cultura-y-patrimonio/arqueologia/parque-arqueologico-de-segobriga',
    );

    const mora = page.getByRole('article', { name: 'Mina de la Mora Encantada' });
    await expect(mora).toContainText(/reserva|confirmar/i);
    await expect(mora.getByRole('link', { name: 'Ficha oficial de la mina' })).toHaveAttribute(
      'href',
      'https://www.turismocastillalamancha.es/es/cultura-y-patrimonio/arqueologia/mina-de-la-mora-encantada---lapis-specularis',
    );
    await expect(mora).not.toContainText('Ruta orientativa');

    const laguna = page.getByRole('article', { name: 'Laguna de El Hito' });
    await expect(laguna).toContainText(/estacional|invernal/i);

    const noheda = page.getByRole('article', { name: 'Villa Romana de Noheda' });
    await expect(noheda).toContainText(/guía/i);
    await expect(noheda).toContainText(/reserva previa/i);

    const enchantedCity = page.getByRole('article', { name: 'Ciudad Encantada' });
    await expect(enchantedCity).toContainText(/movilidad reducida/i);
    await expect(
      enchantedCity.getByRole('link', { name: 'Ficha oficial de visita' }),
    ).toHaveAttribute(
      'href',
      'https://www.turismocastillalamancha.es/es/naturaleza/monumentos-naturales/ciudad-encantada-de-cuenca',
    );
  });

  test('keeps the guide usable on mobile and links it from the visit menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(placesUrl);

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);

    const menu = page.locator('#site-menu');
    await page.getByRole('button', { name: 'Explorar' }).click();
    await expect(menu.getByRole('link', { name: 'Qué ver cerca' })).toHaveAttribute(
      'href',
      placesUrl,
    );
  });
});
