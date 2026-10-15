# Estrategia de pruebas de la web

La estrategia actual protege la web editorial, el shell compartido y el juego. Las pruebas implementadas se distinguen de las validaciones todavía pendientes contra infraestructura remota.

## Configuración

- `vitest.config.ts` usa el entorno `node` e incluye `tests/unit/**/*.test.ts` y `tests/integration/**/*.test.ts`.
- `playwright.config.ts` ejecuta `tests/e2e/` en Chromium, arranca `pnpm exec astro dev --host 127.0.0.1 --port 4321` y usa `http://127.0.0.1:4321` como `baseURL`.
- En CI Playwright prohíbe `test.only`, usa un worker y hasta dos reintentos. Localmente no reintenta.
- `tests/features/` contiene escenarios Gherkin de referencia. No hay Cucumber ni un ejecutor de steps conectado a esos archivos.

`astro.config.ts` se incluye en el `tsconfig.json` raíz y se comprueba con `pnpm typecheck:astro`. `eslint.config.mjs` y `prettier.config.mjs` son excepciones deliberadas: cargar configuración TypeScript en ESLint requeriría añadir el loader `jiti` o depender de flags experimentales de Node; la configuración TypeScript de Prettier exige Node 22.6 o posterior (y versiones anteriores a 24.3 necesitan `--experimental-strip-types`). Como el proyecto no declara una versión mínima de Node y los archivos MJS son configuraciones estáticas, se conservan para no añadir un loader ni elevar implícitamente el runtime requerido.

## Comandos

```bash
pnpm typecheck:astro
pnpm typecheck:convex
pnpm test
pnpm test:watch
pnpm test:e2e
pnpm build
pnpm qa:visual
pnpm check:css:architecture
pnpm check:seo
pnpm lint
pnpm format:check
```

`pnpm check:seo` necesita que exista un `dist/` generado por `pnpm build`. `pnpm qa:visual` necesita un servidor disponible en `VISUAL_QA_BASE_URL` o en `http://127.0.0.1:4321`; no arranca Astro por sí mismo. `pnpm typecheck:astro` ejecuta `astro check` sobre `.astro`, `astro.config.ts` y los módulos incluidos de `src/`, `tests/` y `scripts/`. `pnpm typecheck:convex` ejecuta `tsc --noEmit -p convex/tsconfig.json` sobre la configuración independiente de Convex, sin sincronizar un deployment remoto. Los scripts JavaScript que aún no se migren a TypeScript no quedan cubiertos por el typecheck Astro.

## Vitest: pruebas unitarias e integración

La suite cubre actualmente:

- `src/game/`: distancia Haversine, precisión GPS, reglas de puntuación, decaimiento local, avance de ubicación y sesión;
- `convex/`: validación geográfica del servidor, decaimiento del score, normalización de nick y TTL/redondeo de presencia;
- `src/scripts/convex-game.ts`: adaptación de queries, mutations, presencia, callbacks reactivos, suscripciones e idempotencia del payload;
- importación y política de sincronización de bandos;
- construcción de notificaciones SMTP;
- alineación segura de `main`;
- tokens y guardas de arquitectura CSS.

La ejecución verificada actual de `pnpm test` contiene 19 archivos y 68 pruebas, todas correctas. No hay cobertura porcentual configurada ni informe de coverage.

## Playwright: E2E

Los escenarios E2E prueban la aplicación Astro real en Chromium y cubren:

- navegación global, menú lateral, `Escape`, `inert`, nombres accesibles y pie;
- portada, páginas informativas, alojamientos y rutas con mapa GPX;
- archivo y detalle de noticias;
- bandos, filtros por texto/categoría/año, adjuntos, fuente y redirección `/avisos/`;
- estado vacío de agenda;
- canonical, Open Graph, idioma y JSON-LD;
- juego local, simulador, captura, puntuación, modo inmersivo y límites de precisión;
- fallbacks y carga diferida de escenas Three.js;
- responsive, overflow horizontal y controles de vuelta arriba.

Las pruebas del juego usan `astro dev` y el simulador disponible en `import.meta.env.DEV`. No constituyen una prueba E2E contra un deployment remoto de Convex, ni prueban dos jugadores reales compitiendo por la misma versión de la bola.

## Validaciones de calidad

### QA visual

`scripts/visual-qa.ts`, ejecutado mediante `pnpm qa:visual`, recorre nueve rutas en `1440×900` y `375×812`. Comprueba HTTP 200, overflow horizontal, foco visible, contraste aproximado y errores de consola. No genera snapshots ni realiza comparación de píxeles pese a su nombre.

### CSS

`scripts/check-css-architecture.ts`, ejecutado mediante `pnpm check:css:architecture`, inspecciona el diff de `src/` y bloquea nuevos colores, funciones de color, familias tipográficas o pesos literales no autorizados. `tests/unit/css-architecture.test.ts` cubre la política; las excepciones de Leaflet y el mapa del juego están expresamente delimitadas.

### SEO y build

`pnpm build` valida indirectamente las Content Collections y genera `dist/`. `scripts/verify-seo.ts`, ejecutado con `pnpm check:seo`, inspecciona las páginas generadas, metadatos obligatorios, JSON-LD, `sitemap-index.xml` y `robots.txt`.

## Convenciones

Los cambios funcionales deben conservar o ampliar una prueba de comportamiento relevante. Las reglas puras deben permanecer comprobables sin navegador; las pruebas E2E deben verificar el resultado visible, los nombres accesibles y los estados asentados, no detalles transitorios de carga.

La validación de producción, dos navegadores conectados a Convex, spoofing de GPS, revisión física de ubicaciones y observabilidad de la automatización de bandos quedan fuera de la cobertura actual y requieren tareas independientes.
