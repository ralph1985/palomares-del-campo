import { expect, test } from '@playwright/test';

test.describe('optional Three.js visuals', () => {
  test('enhances the about hero without replacing its real fallback', async ({ page }) => {
    const threeRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().toLowerCase().includes('three')) threeRequests.push(request.url());
    });

    await page.goto('/sobre-el-pueblo/');

    const emblem = page.locator('[data-about-emblem]');
    await expect(emblem).toHaveAttribute('aria-hidden', 'true');
    await expect(emblem.locator('img')).toHaveAttribute(
      'src',
      '/brand/escudo-palomares-del-campo.svg',
    );
    await expect(emblem.locator('canvas')).toHaveCount(1);
    await expect.poll(() => threeRequests.length).toBeGreaterThan(0);

    const layerOrder = await page.evaluate(() => {
      const scene = document.querySelector('[data-about-emblem]');
      const photo = document.querySelector('.hero-photo');
      return {
        sceneZIndex: Number.parseInt(scene ? getComputedStyle(scene).zIndex : '0', 10),
        photoZIndex: Number.parseInt(photo ? getComputedStyle(photo).zIndex : '0', 10),
      };
    });
    expect(layerOrder.sceneZIndex).toBeGreaterThan(layerOrder.photoZIndex);
  });

  test('enhances the game card without changing the game surface', async ({ page }) => {
    const threeRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().toLowerCase().includes('three')) threeRequests.push(request.url());
    });

    await page.goto('/juego/');

    const ball = page.locator('[data-game-ball]');
    await expect(ball).toHaveAttribute('aria-hidden', 'true');
    await expect(ball.locator('[data-game-ball-canvas]')).toHaveCount(1);
    await expect(ball.locator('.game-ball-fallback')).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'La bola está en juego.' })).toBeVisible();
    await expect(page.locator('#game-map')).toBeVisible();
    await expect.poll(() => threeRequests.length).toBeGreaterThan(0);
  });
});
