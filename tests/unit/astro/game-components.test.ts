import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
import { describe, expect, it, vi } from 'vitest';

import GameBallVisual from '../../../src/components/game/GameBallVisual.astro';
import GameDevelopmentSimulator from '../../../src/components/game/GameDevelopmentSimulator.astro';
import GameMap from '../../../src/components/game/GameMap.astro';
import GameMapCanvas from '../../../src/components/game/GameMapCanvas.astro';
import GameRanking from '../../../src/components/game/GameRanking.astro';
import GameRules from '../../../src/components/game/GameRules.astro';
import GameStatusPanel from '../../../src/components/game/GameStatusPanel.astro';

const render = async (component: AstroComponentFactory) => {
  const container = await AstroContainer.create();
  return container.renderToString(component);
};

describe('GameBallVisual.astro', () => {
  it('keeps its decorative CSS fallback and canvas available to the optional WebGL enhancement', async () => {
    const html = await render(GameBallVisual);

    expect(html).toContain('data-game-ball');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('class="game-ball-fallback"');
    expect(html).toContain('data-game-ball-canvas');
  });
});

describe('GameDevelopmentSimulator.astro', () => {
  it('offers the local location and accuracy scenarios in development', async () => {
    const html = await render(GameDevelopmentSimulator);

    expect(html).toContain('data-game-simulator');
    expect(html).toContain('aria-label="Elegir ubicación simulada"');
    expect(html).toContain('value="plaza-del-coso"');
    expect(html).toContain('aria-label="Elegir escenario de posición simulada"');
    expect(html).toContain('value="exact"');
    expect(html).toContain('value="edge"');
    expect(html).toContain('value="outside"');
    expect(html).toContain('value="low-accuracy"');
    expect(html).toMatch(/<button\b(?=[^>]*data-game-simulate)(?=[^>]*\bdisabled\b)[^>]*>/);
  });

  it('omits the simulator when the development flag is off', async () => {
    vi.stubEnv('DEV', false);

    try {
      const html = await render(GameDevelopmentSimulator);
      expect(html).not.toContain('data-game-simulator');
      expect(html).not.toContain('Simulador de desarrollo');
    } finally {
      vi.unstubAllEnvs();
    }
  });
});

describe('GameMap.astro', () => {
  it('composes the accessible game board, map surface and initial player panel', async () => {
    const html = await render(GameMap);

    expect(html).toContain('aria-labelledby="game-map-title"');
    expect(html).toContain('id="game-map-title"');
    expect(html).toContain('Encuentra el punto activo.');
    expect(html).toMatch(/Multijugador en directo|Modo local de prueba/);
    expect(html).toContain('data-convex-url');
    expect(html).toContain(
      'aria-label="Mapa interactivo de Palomares del Campo con lugares de juego"',
    );
    expect(html).toContain('data-game-location-name');
    expect(html).toContain('data-game-ranking');
  });

  it('selects live mode when a backend URL is configured outside the E2E fixture mode', async () => {
    vi.stubEnv('CONVEX_URL', 'https://example.invalid');
    vi.stubEnv('PUBLIC_E2E_TEST_MODE', '');

    try {
      const html = await render(GameMap);
      expect(html).toContain('Multijugador en directo');
    } finally {
      vi.unstubAllEnvs();
    }
  });
});

describe('GameMapCanvas.astro', () => {
  it('renders the map application, initial immersive control and visible attribution', async () => {
    const html = await render(GameMapCanvas);

    expect(html).toContain('aria-label="Estado del tablero"');
    expect(html).toContain('data-game-ball-version');
    expect(html).toContain('data-game-immersive-toggle');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('data-game-immersive-label');
    expect(html).toContain('role="application"');
    expect(html).toContain(
      'aria-label="Mapa interactivo de Palomares del Campo con lugares de juego"',
    );
    expect(html).toContain('https://www.openstreetmap.org/copyright');
  });
});

describe('GameStatusPanel.astro', () => {
  it('exposes the initial nickname, score, location privacy and disabled capture controls', async () => {
    const html = await render(GameStatusPanel);

    expect(html).toContain('aria-labelledby="game-status-title"');
    expect(html).toContain('data-game-mode-label');
    expect(html).toContain('data-game-location-name');
    expect(html).toContain('Plaza del Coso');
    expect(html).toContain('data-game-player-form');
    expect(html).toContain('maxlength="24"');
    expect(html).toContain('data-game-score');
    expect(html).toContain('data-game-captures');
    expect(html).toContain('data-game-radius');
    expect(html).toContain('La ubicación no se comparte en este prototipo.');
    expect(html).toContain('data-game-locate');
    expect(html).toMatch(/<button\b(?=[^>]*data-game-check)(?=[^>]*\bdisabled\b)[^>]*>/);
    expect(html).toMatch(/<button\b(?=[^>]*data-game-capture)(?=[^>]*\bdisabled\b)[^>]*>/);
    expect(html).toContain('role="status"');
  });
});

describe('GameRanking.astro', () => {
  it('announces the connection state and explains the empty ranking', async () => {
    const html = await render(GameRanking);

    expect(html).toContain('aria-labelledby="game-ranking-title"');
    expect(html).toContain('Ranking de la partida');
    expect(html).toContain('data-game-ranking-status');
    expect(html).toContain('role="status"');
    expect(html).toContain('Conectando…');
    expect(html).toContain('data-game-ranking');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('Aún no hay jugadores con puntos.');
  });
});

describe('GameRules.astro', () => {
  it('explains the three-step game, provisional scoring and location privacy', async () => {
    const html = await render(GameRules);

    expect(html).toContain('aria-labelledby="game-rules-title"');
    expect(html).toContain('Un paseo con algo en juego.');
    expect(html).toContain('>Encuentra</h3>');
    expect(html).toContain('>Comprueba</h3>');
    expect(html).toContain('>Captura</h3>');
    expect(html.match(/class="rule-card(?: rule-card-primary)?"/g)).toHaveLength(3);
    expect(html).toContain('+10 puntos por captura · −5 % por día sin jugar');
    expect(html).toContain('no se guardan coordenadas ni se comparte ninguna ubicación');
  });
});
