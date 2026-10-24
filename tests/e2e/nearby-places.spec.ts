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

  test('links featured places to detailed guides with credited images and official visit information', async ({
    page,
  }) => {
    await page.goto(placesUrl);

    const featuredPlaces = [
      { name: 'Segóbriga y Saelices', slug: 'segobriga-saelices' },
      { name: 'Mina de la Mora Encantada', slug: 'mina-mora-encantada' },
      { name: 'Villa Romana de Noheda', slug: 'villa-romana-noheda' },
    ];
    for (const place of featuredPlaces) {
      const card = page.getByRole('article', { name: place.name });
      const guideLink = card.getByRole('link', { name: 'Leer guía de visita' });
      await expect(card.getByRole('link').first()).toHaveAttribute(
        'href',
        `/que-ver-cerca/${place.slug}/`,
      );
      await expect(guideLink).toHaveAttribute('data-ui-variant', 'solid');
      await expect(
        card
          .getByRole('navigation', { name: `Fuentes oficiales de ${place.name}` })
          .getByRole('link')
          .first(),
      ).toBeVisible();
    }

    const guides = [
      {
        path: 'segobriga-saelices',
        heading: 'Segóbriga: una ciudad romana en la Meseta',
        images: 2,
      },
      {
        path: 'mina-mora-encantada',
        heading: 'La Mora Encantada y el lapis specularis',
        images: 1,
      },
      {
        path: 'villa-romana-noheda',
        heading: 'Noheda: mosaicos y vida en una villa romana',
        images: 2,
      },
    ];

    for (const guide of guides) {
      await page.goto(`/que-ver-cerca/${guide.path}/`);
      await expect(page.getByRole('heading', { level: 1, name: guide.heading })).toBeVisible();
      await expect(page.locator('main figure')).toHaveCount(guide.images);
      await expect(
        page.locator('main figure a[href*="commons.wikimedia.org/wiki/File:"]'),
      ).toHaveCount(guide.images);
      await expect
        .poll(() =>
          page
            .locator('main figure img')
            .first()
            .evaluate((element) =>
              element instanceof HTMLImageElement ? element.naturalWidth : 0,
            ),
        )
        .toBeGreaterThan(0);
      await expect(page.getByRole('link', { name: 'Volver a Qué ver cerca' })).toHaveAttribute(
        'href',
        placesUrl,
      );
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        new RegExp(`/que-ver-cerca/${guide.path}/$`),
      );
    }

    await page.goto('/que-ver-cerca/villa-romana-noheda/');
    await expect(page.locator('main')).toContainText(/visita es guiada/i);
    await expect(page.locator('main')).toContainText(/entrada reservada online/i);
    await expect(page.getByRole('link', { name: 'Reservas oficiales de Noheda' })).toHaveAttribute(
      'href',
      'https://www.villanoheda.org/entradas/',
    );

    await page.setViewportSize({ width: 375, height: 812 });
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });
});
