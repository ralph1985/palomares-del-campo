import { expect, test } from './fixtures';

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

  test('exposes the cookie information page', async ({ page }) => {
    await page.goto('/politica-de-cookies/');

    await expect(page.locator('#page-title')).toHaveText('Política de cookies');
    await expect(
      page.getByRole('heading', { name: 'No usamos analítica publicitaria' }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'política de privacidad', exact: true }),
    ).toHaveAttribute('href', '/privacidad/#palomarenos-por-el-mundo');
  });

  test('exposes the legal notice with development data warnings', async ({ page }) => {
    await page.goto('/aviso-legal/');

    await expect(page.locator('#page-title')).toHaveText('Aviso legal');
    await expect(page.getByRole('note')).toContainText('datos de prueba');
    await expect(page.getByText('P0000000X · DATO DE PRUEBA — SUSTITUIR')).toBeVisible();
  });

  test('does not load real Turnstile on an unauthorized development hostname', async ({ page }) => {
    await page.goto('/palomarenos-por-el-mundo/');

    await expect(page.locator('[data-turnstile-status]')).toHaveText(
      'La protección anti-bots está disponible en el dominio público.',
    );
    await expect(page.locator('#cloudflare-turnstile')).toHaveCount(0);
  });

  test('renders the simulated Turnstile widget and enables the submission control', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.__PALOMARENOS_TURNSTILE_TEST__ = true;
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

  test('does not reset Turnstile repeatedly after a widget error', async ({ page }) => {
    await page.addInitScript(() => {
      window.__PALOMARENOS_TURNSTILE_TEST__ = true;
      type TestTurnstileOptions = {
        'error-callback': () => void;
      };
      type TestTurnstile = {
        render: (container: HTMLElement, options: TestTurnstileOptions) => string;
        reset: () => void;
      };
      (window as Window & { __turnstileResetCount?: number }).__turnstileResetCount = 0;
      Object.defineProperty(window, 'turnstile', {
        configurable: true,
        value: {
          render: (_container: HTMLElement, options: TestTurnstileOptions) => {
            window.setTimeout(() => options['error-callback'](), 0);
            return 'e2e-error-widget';
          },
          reset: () => {
            const browserWindow = window as Window & { __turnstileResetCount?: number };
            browserWindow.__turnstileResetCount = (browserWindow.__turnstileResetCount ?? 0) + 1;
          },
        } satisfies TestTurnstile,
      });
    });
    await page.goto('/palomarenos-por-el-mundo/');

    await expect(page.locator('[data-turnstile-status]')).toHaveText(
      'No se ha podido cargar la protección anti-bots.',
    );
    await expect
      .poll(() =>
        page.evaluate(
          () => (window as Window & { __turnstileResetCount?: number }).__turnstileResetCount,
        ),
      )
      .toBe(0);
  });

  test('keeps the sticky header above Leaflet layers', async ({ page }) => {
    await page.goto('/palomarenos-por-el-mundo/');
    await expect(page.locator('[data-palomarenos-map] .leaflet-top.leaflet-left')).toBeVisible();

    const stacking = await page.evaluate(() => {
      const getZIndex = (selector: string): number => {
        const element = document.querySelector(selector);
        if (!element) throw new Error(`Missing stacking-context element: ${selector}`);
        return Number.parseInt(getComputedStyle(element).zIndex, 10);
      };

      return {
        header: getZIndex('.site-header'),
        leaflet: getZIndex('[data-palomarenos-map] .leaflet-top.leaflet-left'),
      };
    });

    expect(stacking.header).toBeGreaterThan(stacking.leaflet);
  });

  test('keeps the back-to-top control above Leaflet layers', async ({ page }) => {
    await page.goto('/palomarenos-por-el-mundo/');
    await page.evaluate(() => window.scrollTo(0, 600));

    const stacking = await page.evaluate(() => {
      const getZIndex = (selector: string): number => {
        const element = document.querySelector(selector);
        if (!element) throw new Error(`Missing stacking-context element: ${selector}`);
        return Number.parseInt(getComputedStyle(element).zIndex, 10);
      };

      return {
        backToTop: getZIndex('[data-back-to-top]'),
        leaflet: getZIndex('[data-palomarenos-map] .leaflet-top.leaflet-left'),
      };
    });

    expect(stacking.backToTop).toBeGreaterThan(stacking.leaflet);
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
