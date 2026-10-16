import { expect, test } from './fixtures';

test.describe('local ball game', () => {
  test('loads the map, locations and development simulator', async ({ page }) => {
    const tileResponse = page.waitForResponse((response) =>
      response.url().includes('.tile.openstreetmap.org'),
    );
    await page.goto('/juego/');

    await expect(page.getByRole('heading', { name: 'La bola está en juego.' })).toBeVisible();
    await expect(page.getByText(/(LIVE|LOCAL) MATCH/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Entrar en la partida' })).toBeVisible();
    await expect(page.locator('#game-map .leaflet-tile').first()).toBeVisible();
    expect((await tileResponse).headers()['x-e2e-map-tile']).toBe('fixture');
    await expect(page.locator('#game-map path.leaflet-interactive')).not.toHaveCount(0);
    await expect(page.locator('[data-game-simulator]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ranking de la partida' })).toBeVisible();
    await expect(page.locator('[data-game-ranking]')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Privacidad y estado del juego' }),
    ).toBeVisible();
    await expect(page.getByText(/identificador anónimo del dispositivo/)).toBeVisible();
    await expect(page.getByText(/El nick se guarda solo en este dispositivo/)).toBeVisible();
    await expect(page.getByText(/No se conserva un historial de ubicación/)).toBeVisible();
    await expect(page.getByText(/Las ubicaciones del juego son provisionales/)).toBeVisible();
  });

  test('switches between the standard and immersive game modes', async ({ page }) => {
    await page.goto('/juego/');

    await page.getByRole('button', { name: 'Inmersivo' }).click();
    const exitButton = page.getByRole('button', { name: 'Salir' });
    await expect(exitButton).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('heading', { name: 'La bola está en juego.' })).toBeHidden();
    await expect(page.locator('[data-game-check]')).toBeHidden();
    await expect(page.locator('[data-game-locate]')).toBeVisible();
    await expect(page.locator('[data-game-capture]')).toBeVisible();
    await expect(exitButton).toBeVisible();

    await exitButton.click();
    await expect(page.getByRole('heading', { name: 'La bola está en juego.' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Inmersivo' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
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
