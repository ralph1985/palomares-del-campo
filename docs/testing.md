# Estrategia de pruebas de la web

La infraestructura de calidad es transversal a toda la web. El juego de la bola es el primer vertical slice porque contiene la lógica nueva, pero las mismas capas deben proteger portada, noticias, navegación, menú, pie, accesibilidad y responsive.

## Comandos

```bash
pnpm test
pnpm test:watch
pnpm test:e2e
pnpm run build
```

## Capas

- `tests/unit/`: Vitest para reglas puras y helpers sin navegador.
- `tests/integration/`: adapters y Convex cuando exista backend.
- `tests/e2e/`: Playwright contra la web real en un navegador.
- `tests/features/`: especificaciones Gherkin canónicas; no se introduce Cucumber de momento.

## TDD

Cada comportamiento nuevo sigue RED → GREEN → REFACTOR: test enfocado que falla por la razón esperada, implementación mínima, suite relevante, refactor con todo en verde. La compilación y la comprobación de navegador no sustituyen los tests automatizados.

## BDD

Los escenarios Gherkin expresan comportamientos de usuario y se enlazan por nombre o etiqueta con las pruebas Playwright. No se debe crear una segunda lógica en los steps: las reglas puras pertenecen a `src/game/` y la aceptación verifica el flujo visible.

## Convenciones E2E

- Usar contextos de navegador independientes para jugadores distintos.
- Esperar estados asentados, no juzgar la aplicación durante una carga transitoria.
- Comprobar estados visibles, nombres accesibles, enlaces, rutas y desbordamiento móvil.
- Cuando exista Convex, leer también el estado autoritativo y probar capturas simultáneas.
