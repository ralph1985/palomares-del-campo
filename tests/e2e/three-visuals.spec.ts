import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

const blockWebGL = async (page: Page) => {
  await page.addInitScript(() => {
    type E2EWindow = Window & { __WEBGL_BLOCKED_FOR_E2E__?: boolean };
    const testWindow = window as E2EWindow;

    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value: (contextId: string) => {
        if (contextId.startsWith('webgl')) testWindow.__WEBGL_BLOCKED_FOR_E2E__ = true;
        return null;
      },
    });
  });
};

const expectWebGLBlocked = async (page: Page) => {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as Window & { __WEBGL_BLOCKED_FOR_E2E__?: boolean }).__WEBGL_BLOCKED_FOR_E2E__,
      ),
    )
    .toBe(true);
};

test.describe('optional WebGL fallbacks', () => {
  test('keeps the about-page emblem visible when WebGL is unavailable', async ({ page }) => {
    await blockWebGL(page);
    await page.goto('/sobre-el-pueblo/');
    await expectWebGLBlocked(page);

    const emblem = page.locator('[data-about-emblem]');
    await expect(emblem).toHaveAttribute('aria-hidden', 'true');
    await expect(emblem.locator('img')).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Un pueblo con muchas capas de historia.' }),
    ).toBeVisible();
  });

  test('keeps the game surface available when WebGL is unavailable', async ({ page }) => {
    await blockWebGL(page);
    await page.goto('/juego/');
    await expectWebGLBlocked(page);

    const ball = page.locator('[data-game-ball]');
    await expect(ball).toHaveAttribute('aria-hidden', 'true');
    await expect(ball.locator('.game-ball-fallback')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'La bola está en juego.' })).toBeVisible();
    await expect(page.locator('#game-map')).toBeVisible();
  });
});
