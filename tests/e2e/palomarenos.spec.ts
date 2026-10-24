import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

const configureSubmissionHarness = async (page: Page, outcome: 'success' | 'rate-limit') => {
  await page.addInitScript((submissionOutcome) => {
    type E2EWindow = Window & {
      __PALOMARENOS_TURNSTILE_TEST__?: boolean;
      __PALOMARENOS_FORM_TEST__?: (input: unknown) => Promise<unknown>;
      __PALOMARENOS_FORM_TEST_INPUT__?: unknown;
      turnstile?: {
        render: (container: HTMLElement, options: { callback: (token: string) => void }) => string;
        reset: () => void;
      };
    };
    const browserWindow = window as unknown as E2EWindow;
    browserWindow.__PALOMARENOS_TURNSTILE_TEST__ = true;
    browserWindow.__PALOMARENOS_FORM_TEST__ = async (input) => {
      browserWindow.__PALOMARENOS_FORM_TEST_INPUT__ = input;
      if (submissionOutcome === 'rate-limit') throw new Error('submission-rate-limited');
      return {
        status: 'submitted',
        submissionId: 'e2e-submission',
        message: 'Tu propuesta queda pendiente de revisión.',
      };
    };
    browserWindow.turnstile = {
      render: (_container, options) => {
        window.setTimeout(() => options.callback('e2e-turnstile-token'), 0);
        return 'e2e-widget';
      },
      reset: () => undefined,
    };

    const disableConvexForTest = (): boolean => {
      const form = document.querySelector<HTMLFormElement>('[data-palomarenos-form]');
      if (!form) return false;
      form.dataset.convexUrl = '';
      return true;
    };
    if (!disableConvexForTest()) {
      const observer = new MutationObserver(() => {
        if (disableConvexForTest()) observer.disconnect();
      });
      observer.observe(document, { childList: true, subtree: true });
    }
  }, outcome);
};

test.describe('Palomareños por el mundo', () => {
  test('serves the town shield as the site favicon', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.ico');
    const response = await page.context().request.get(new URL('/favicon.ico', page.url()).href);
    const iconHeader = Array.from((await response.body()).subarray(0, 4));

    expect(response.status()).toBe(200);
    expect(iconHeader).toEqual([0, 0, 1, 0]);
  });

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

  test('keeps proposal text controls at least 16px on narrow viewports', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/palomarenos-por-el-mundo/');

    const fontSizes = await page
      .locator(
        '[data-palomarenos-form] input:not([type="checkbox"]):not([name="website"]), [data-palomarenos-form] textarea',
      )
      .evaluateAll((controls) =>
        controls.map((control) => Number.parseFloat(window.getComputedStyle(control).fontSize)),
      );

    expect(fontSizes.length).toBeGreaterThan(0);
    for (const fontSize of fontSizes) {
      expect(
        fontSize,
        'text controls should not trigger mobile browser zoom',
      ).toBeGreaterThanOrEqual(16);
    }
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

  test('exposes the legal notice as a draft with unverified identity data', async ({ page }) => {
    await page.goto('/aviso-legal/');

    await expect(page.locator('#page-title')).toHaveText('Aviso legal');
    await expect(page.getByRole('note')).toContainText('pendiente de validación');
    await expect(page.getByRole('heading', { name: 'Objeto del sitio' })).toBeVisible();
    await expect(page.getByText('Pendiente de confirmación oficial').first()).toBeVisible();
    await expect(page.getByText('P0000000X')).toHaveCount(0);
    await expect(page.getByText('L00000000')).toHaveCount(0);
    await expect(page.getByText('dpd-prueba@example.invalid')).toHaveCount(0);
  });

  test('does not load real Turnstile on an unauthorized development hostname', async ({ page }) => {
    await page.goto('/palomarenos-por-el-mundo/');

    await expect(page.locator('[data-turnstile-status]')).toHaveText(
      'La protección anti-bots está disponible en el dominio público.',
    );
    await expect(page.locator('#cloudflare-turnstile')).toHaveCount(0);
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

  test('submits a proposal and shows the pending-review confirmation', async ({ page }) => {
    await configureSubmissionHarness(page, 'success');
    await page.goto('/palomarenos-por-el-mundo/');

    await page.getByRole('textbox', { name: 'Nombre que quieres mostrar' }).fill('Ana de prueba');
    await page.getByRole('textbox', { name: 'Ciudad' }).fill('Madrid');
    await page.getByRole('textbox', { name: 'País' }).fill('España');
    await page.getByRole('textbox', { name: /Email de contacto/ }).fill('ana@example.com');
    await page.getByRole('textbox', { name: 'Tu historia' }).fill('Un recuerdo de prueba.');
    await page.getByRole('checkbox', { name: /He leído la información básica/ }).check();
    await expect(page.locator('[data-turnstile-status]')).toHaveText(
      'Protección anti-bots verificada.',
    );
    await expect(page.getByRole('button', { name: 'Enviar propuesta' })).toBeEnabled();
    await page.getByRole('button', { name: 'Enviar propuesta' }).click();

    await expect(page.locator('[data-form-status]')).toHaveAttribute('data-state', 'success');
    await expect(page.locator('[data-form-status]')).toHaveText(
      'Tu propuesta queda pendiente de revisión.',
    );
    await expect(page.getByRole('button', { name: 'Enviar propuesta' })).toBeDisabled();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as Window & { __PALOMARENOS_FORM_TEST_INPUT__?: unknown })
              .__PALOMARENOS_FORM_TEST_INPUT__,
        ),
      )
      .toEqual({
        displayName: 'Ana de prueba',
        city: 'Madrid',
        country: 'España',
        story: 'Un recuerdo de prueba.',
        contactEmail: 'ana@example.com',
        consent: true,
        website: '',
        turnstileToken: 'e2e-turnstile-token',
      });
  });

  test('keeps the proposal available and explains a recoverable submission error', async ({
    page,
  }) => {
    await configureSubmissionHarness(page, 'rate-limit');
    await page.goto('/palomarenos-por-el-mundo/');

    await page.getByRole('textbox', { name: 'Nombre que quieres mostrar' }).fill('Ana de prueba');
    await page.getByRole('textbox', { name: 'Ciudad' }).fill('Madrid');
    await page.getByRole('textbox', { name: 'País' }).fill('España');
    await page.getByRole('textbox', { name: /Email de contacto/ }).fill('ana@example.com');
    await page.getByRole('textbox', { name: 'Tu historia' }).fill('Un recuerdo de prueba.');
    await page.getByRole('checkbox', { name: /He leído la información básica/ }).check();
    await page.getByRole('button', { name: 'Enviar propuesta' }).click();

    await expect(page.locator('[data-form-status]')).toHaveAttribute('data-state', 'error');
    await expect(page.locator('[data-form-status]')).toHaveText(
      'Espera un poco antes de enviar otra propuesta.',
    );
    await expect(page.getByRole('button', { name: 'Enviar propuesta' })).toBeEnabled();
    await expect(page.getByRole('textbox', { name: 'Tu historia' })).toHaveValue(
      'Un recuerdo de prueba.',
    );
  });

  test('keeps the menu usable while the map sits under the sticky header', async ({ page }) => {
    await page.goto('/palomarenos-por-el-mundo/');

    const map = page.locator('[data-palomarenos-map]');
    const header = page.locator('.site-header');
    await expect(page.locator('[data-palomarenos-map] .leaflet-top.leaflet-left')).toBeVisible();
    await map.evaluate((element) => {
      const mapTop = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: mapTop - 24, behavior: 'instant' });
    });
    await expect(header).not.toBeInViewport();
    await page.evaluate(() => window.scrollBy({ top: -16, behavior: 'instant' }));
    await expect(header).toBeInViewport({ ratio: 1 });
    const mapTop = await map.evaluate((element) => element.getBoundingClientRect().top);
    const headerBottom = await header.evaluate((element) => element.getBoundingClientRect().bottom);
    expect(mapTop).toBeLessThan(headerBottom);

    await page.getByRole('button', { name: 'Explorar' }).click();
    await expect(page.locator('#site-menu')).toHaveAttribute('aria-hidden', 'false');
  });

  test('returns to the top from the map page', async ({ page }) => {
    await page.goto('/palomarenos-por-el-mundo/');
    await page.evaluate(() => window.scrollTo(0, 600));

    const backToTop = page.getByRole('button', { name: 'Volver arriba' });
    await expect(backToTop).toBeVisible();
    await backToTop.click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(10);
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
