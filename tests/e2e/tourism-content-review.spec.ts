import { expect, test } from '@playwright/test';

test.describe('tourism content review', () => {
  test('labels the accommodation capacity discrepancy and links both sources', async ({ page }) => {
    await page.goto('/alojamientos/');

    const accommodation = page.getByRole('article').filter({
      has: page.getByRole('heading', { name: 'Casa Rural San Cristóbal' }),
    });

    await expect(
      accommodation.getByText('Capacidad por confirmar; las fichas consultadas discrepan'),
    ).toBeVisible();
    await expect(
      accommodation.getByText(/Las fuentes consultadas discrepan en la capacidad/),
    ).toBeVisible();
    await expect(
      accommodation.getByRole('link', { name: /Ficha consultada en TusCasasRurales.com/ }),
    ).toHaveAttribute(
      'href',
      'https://www.tuscasasrurales.com/casa-rural-san-cristobal-f20825.htm',
    );
    await expect(
      accommodation.getByRole('link', { name: /Sitio propio de Casa Rural San Cristóbal/ }),
    ).toHaveAttribute('href', 'https://www.casaruralsancristobalcuenca.es/');
  });
});
