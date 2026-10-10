import { expect, test } from '@playwright/test';

test.describe('local ball game', () => {
  test('loads the map, locations and development simulator', async ({ page }) => {
    await page.goto('/juego/');

    await expect(page.getByRole('heading', { name: 'Encuentra la bola.' })).toBeVisible();
    await expect(page.locator('#game-map .leaflet-tile').first()).toBeVisible();
    await expect(page.locator('#game-map path.leaflet-interactive')).toHaveCount(6);
    await expect(page.locator('[data-game-simulator]')).toBeVisible();
    await expect(page.locator('[data-game-scenario] option')).toHaveCount(4);
  });

  test('captures the ball after checking an exact simulated position', async ({ page }) => {
    await page.goto('/juego/');

    await page.locator('[data-game-simulator]').selectOption('plaza-del-coso');
    await page.locator('[data-game-simulate]').click();
    await expect(page.locator('[data-game-distance]')).toHaveText('0 m de la bola');
    await expect(page.locator('[data-game-capture]')).toBeDisabled();

    await page.locator('[data-game-check]').click();
    await expect(page.locator('[data-game-capture]')).toBeEnabled();
    await page.locator('[data-game-capture]').click();

    await expect(page.locator('[data-game-score]')).toHaveText('10');
    await expect(page.locator('[data-game-captures]')).toHaveText('1');
    await expect(page.locator('[data-game-location-name]')).toHaveText(
      'Iglesia de Nuestra Señora de la Asunción',
    );

    await page.reload();
    await expect(page.locator('[data-game-score]')).toHaveText('0');
    await expect(page.locator('[data-game-captures]')).toHaveText('0');
    await expect(page.locator('[data-game-location-name]')).toHaveText('Plaza del Coso');
  });

  test('keeps capture disabled for an inaccurate simulated position', async ({ page }) => {
    await page.goto('/juego/');

    await page.locator('[data-game-simulator]').selectOption('plaza-del-coso');
    await page.locator('[data-game-scenario]').selectOption('low-accuracy');
    await page.locator('[data-game-simulate]').click();

    await expect(page.locator('[data-game-capture]')).toBeDisabled();
    await expect(page.locator('[data-game-feedback]')).toContainText('precisión insuficiente');
  });
});
