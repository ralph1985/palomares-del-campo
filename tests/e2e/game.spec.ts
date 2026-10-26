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
    await expect(page.getByLabel('Elegir ubicación simulada')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ranking de la partida' })).toBeVisible();
    await expect(page.getByText('Modo local de prueba')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Privacidad y estado del juego' }),
    ).toBeVisible();
    await expect(page.getByText(/identificador anónimo del dispositivo/)).toBeVisible();
    await expect(page.getByText(/El nick se guarda solo en este dispositivo/)).toBeVisible();
    await expect(page.getByText(/No se conserva un historial de ubicación/)).toBeVisible();
    await expect(page.getByText(/Las ubicaciones del juego son provisionales/)).toBeVisible();
  });

  test('switches between the standard and immersive game modes', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/juego/');

    await page.getByRole('button', { name: 'Inmersivo' }).click();
    const exitButton = page.getByRole('button', { name: 'Salir' });
    await expect(exitButton).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('heading', { name: 'La bola está en juego.' })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Comprobar posición' })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Obtener ubicación' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Capturar bola' })).toBeVisible();
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

    await page.getByLabel('Elegir ubicación simulada').selectOption('plaza-del-coso');
    await page.getByRole('button', { name: 'Simular posición' }).click();
    await expect(page.locator('[data-game-distance]')).toHaveText('0 m de la bola');
    await expect(page.getByRole('button', { name: 'Capturar bola' })).toBeDisabled();

    await page.getByRole('button', { name: 'Comprobar posición' }).click();
    await expect(page.getByRole('button', { name: 'Capturar bola' })).toBeEnabled();
    await page.getByRole('button', { name: 'Capturar bola' }).click();

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

    await page.getByLabel('Elegir ubicación simulada').selectOption('plaza-del-coso');
    await page.getByLabel('Elegir escenario de posición simulada').selectOption('low-accuracy');
    await page.getByRole('button', { name: 'Simular posición' }).click();

    await expect(page.getByRole('button', { name: 'Capturar bola' })).toBeDisabled();
    await expect(
      page.getByRole('status').filter({ hasText: 'precisión insuficiente' }),
    ).toBeVisible();
  });
});
