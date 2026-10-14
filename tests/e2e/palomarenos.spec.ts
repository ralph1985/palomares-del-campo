import { expect, test } from '@playwright/test';

test.describe('Palomareños por el mundo', () => {
  test('loads the empty Leaflet map and the public proposal form', async ({ page }) => {
    await page.goto('/palomarenos-por-el-mundo/');

    await expect(page.locator('#page-title')).toBeVisible();
    await expect(page.locator('[data-palomarenos-map] .leaflet-tile').first()).toBeVisible();
    await expect(page.locator('[data-palomarenos-map-status]')).toHaveText(
      /^(Todavía no hay historias aprobadas para mostrar\.|\d+ historias? en el mapa\.)$/,
    );
    await expect(page.getByRole('heading', { name: '¿Vives lejos de Palomares?' })).toBeVisible();
    await expect(page.getByLabel('Nombre que quieres mostrar')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Ciudad' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'País' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /Email de contacto/ })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Tu historia' })).toBeVisible();
    await expect(
      page.getByRole('checkbox', { name: /He leído la información básica/ }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Leer la información completa sobre privacidad' }),
    ).toHaveAttribute('href', '/privacidad/#palomarenos-por-el-mundo');
  });

  test('exposes the detailed privacy information page', async ({ page }) => {
    await page.goto('/privacidad/');

    await expect(page.locator('#page-title')).toHaveText('Privacidad y protección de datos');
    await expect(page.getByRole('heading', { name: 'Palomareños por el mundo' })).toBeVisible();
    await expect(page.getByText('Email de contacto, que se mantiene privado.')).toBeVisible();
  });

  test('renders the simulated Turnstile widget and enables the submission control', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      type TestTurnstile = {
        render: (container: HTMLElement, options: { callback: (token: string) => void }) => string;
        reset: () => void;
      };
      Object.defineProperty(window, 'turnstile', {
        configurable: true,
        value: {
          render: (_container: HTMLElement, options: { callback: (token: string) => void }) => {
            window.setTimeout(() => options.callback('e2e-turnstile-token'), 0);
            return 'e2e-widget';
          },
          reset: () => undefined,
        } satisfies TestTurnstile,
      });
    });
    await page.goto('/palomarenos-por-el-mundo/');

    await expect(page.locator('[data-turnstile-status]')).toHaveText(
      'Protección anti-bots verificada.',
    );
    await expect(page.getByRole('button', { name: 'Enviar propuesta' })).toBeEnabled();
  });

  test('keeps the sticky header above Leaflet layers', async ({ page }) => {
    await page.goto('/palomarenos-por-el-mundo/');
    await expect(page.locator('[data-palomarenos-map] .leaflet-top.leaflet-left')).toBeVisible();

    const stacking = await page.evaluate(() => ({
      header: Number.parseInt(getComputedStyle(document.querySelector('.site-header')!).zIndex, 10),
      leaflet: Number.parseInt(
        getComputedStyle(
          document.querySelector('[data-palomarenos-map] .leaflet-top.leaflet-left')!,
        ).zIndex,
        10,
      ),
    }));

    expect(stacking.header).toBeGreaterThan(stacking.leaflet);
  });

  test('keeps the page within a narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/palomarenos-por-el-mundo/');

    await expect(page.locator('body')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      375,
    );
  });
});
