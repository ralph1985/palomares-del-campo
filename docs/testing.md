# Estrategia de pruebas de la web

La estrategia actual protege la web editorial, el shell compartido y el juego. Las pruebas implementadas se distinguen de las validaciones todavía pendientes contra infraestructura remota.

## Configuración

- `vitest.config.ts` usa el entorno `node` e incluye `tests/unit/**/*.test.ts` y `tests/integration/**/*.test.ts`.
- `playwright.config.ts` ejecuta `tests/e2e/` en Chromium. Por defecto arranca `pnpm exec astro dev --host 127.0.0.1 --port 4321` y usa `http://127.0.0.1:4321`; `PLAYWRIGHT_BASE_URL` permite apuntar a un servidor ya activo, que se reutiliza si responde. No arrancar una segunda instancia del mismo proyecto sobre una Astro dev existente.
- El servidor aislado de Playwright establece `DISABLE_ASTRO_DEV_TOOLBAR_FOR_E2E=true`; `astro.config.ts` desactiva la barra solo en ese proceso. La barra sigue activa en `pnpm dev` normal. El test de infraestructura `tests/e2e/test-harness.spec.ts` verifica que el toolbar no se inyecta en el servidor de la suite.
- `tests/e2e/fixtures.ts` intercepta los tiles de OpenStreetMap y las imágenes adjuntas de Bandomovil en las pruebas correspondientes, y sirve SVGs inocuos. Los tests comprueban la integración de Leaflet y la presencia de adjuntos; no validan el proveedor externo ni la fidelidad de los recursos reales.
- En CI Playwright prohíbe `test.only`, usa un worker y hasta dos reintentos. Localmente no reintenta.
- `tests/features/` contiene escenarios Gherkin de referencia. No hay Cucumber ni un ejecutor de steps conectado a esos archivos.

`astro.config.ts` se incluye en el `tsconfig.json` raíz y se comprueba con `pnpm typecheck:astro`. `eslint.config.mjs` y `prettier.config.mjs` son excepciones deliberadas: la configuración TypeScript de ESLint en Node requiere `jiti >=2.2.0` o las opciones nativas experimentales; Prettier requiere Node `>=22.6.0` y `--experimental-strip-types` antes de Node 24.3. Como el rango soportado por Astro empieza en Node `22.12.0`, mantener Prettier en MJS evita exigir una bandera experimental en parte del runtime soportado; mantener ESLint en MJS evita añadir un loader solo para su configuración estática.

El proyecto tiene dos typechecks separados: `tsconfig.json` para Astro, scripts y tests, y `convex/tsconfig.json` para Convex. Ambos habilitan `strict`, `exactOptionalPropertyTypes` y `noUncheckedIndexedAccess`; `pnpm typecheck` los ejecuta en secuencia. ESLint añade reglas `no-unsafe-*` con información de tipos para los archivos TypeScript de ambos proyectos, incluidas `playwright.config.ts` y `vitest.config.ts`. `no-unsafe-type-assertion` se limita a código mantenido de producción para no marcar casts deliberados de mocks/fixtures; el frontmatter `.astro` se comprueba con `astro check`, no con esas reglas typed de ESLint.

## Comandos

```bash
pnpm typecheck
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
- `convex/`: validación geográfica del servidor, decaimiento del score, normalización de nick, TTL/redondeo de presencia y parsing seguro de Turnstile/Resend;
- `src/scripts/convex-game.ts`: adaptación de queries, mutations, presencia, callbacks reactivos, suscripciones e idempotencia del payload;
- importación y política de sincronización de bandos;
- construcción de notificaciones SMTP;
- alineación segura de `main`;
- validación de identidad recuperada de `localStorage`, configuración SMTP y JSON-LD generado;
- tokens y guardas de arquitectura CSS.

La ejecución verificada actual de `pnpm test` contiene 23 archivos y 106 pruebas, todas correctas. No hay cobertura porcentual configurada ni informe de coverage.

## Playwright: E2E

Los escenarios E2E prueban la aplicación Astro real en Chromium y cubren:

- navegación global, menú lateral, `Escape`, `inert`, nombres accesibles y pie;
- portada, páginas informativas, alojamientos y rutas con mapa GPX;
- archivo y detalle de noticias;
- bandos, filtros por texto/categoría/año, adjuntos, fuente y redirección `/avisos/`;
- estado vacío de agenda;
- canonical, Open Graph, idioma y JSON-LD en todas las páginas generadas mediante `pnpm check:seo`; incluye contratos específicos de portada, noticias y página «Sobre el pueblo» que antes se comprobaban en E2E;
- juego local, simulador, captura, puntuación, modo inmersivo y límites de precisión;
- formulario de Palomareños: envío aceptado/error recuperable con respuestas simuladas en `astro dev`, sin escritura a Convex; páginas de privacidad/cookies/aviso legal, guardia de Turnstile por hostname y error visible del widget;
- controles sobre el mapa de Palomareños: menú operable con el mapa bajo el encabezado y regreso al inicio desde esa ruta;
- fallbacks de WebGL para el emblema y la bola, y fallback del menú cuando falla su escena 3D;
- responsive, overflow horizontal y controles de vuelta arriba.

Las pruebas del juego usan `astro dev` y el simulador disponible en `import.meta.env.DEV`. No constituyen una prueba E2E contra un deployment remoto de Convex, ni prueban dos jugadores reales compitiendo por la misma versión de la bola.

Para reutilizar un servidor ya activo (por ejemplo, uno accesible por Tailnet), asignar su URL a `PLAYWRIGHT_BASE_URL` y ejecutar `CI=1 pnpm test:e2e`; el `webServer` de Playwright comprueba esa URL y la reutiliza si responde.

## Validaciones de calidad

### QA visual

`scripts/visual-qa.ts`, ejecutado mediante `pnpm qa:visual`, recorre once rutas en `1440×900` y `375×812`, incluidos alojamientos, «Palomareños por el mundo» y un detalle de bando. Comprueba HTTP 200, overflow horizontal, foco visible, contraste aproximado y errores de consola. Los tiles de OpenStreetMap y adjuntos de Bandomovil se sustituyen por fixtures SVG compartidos con E2E. No genera snapshots ni realiza comparación de píxeles pese a su nombre. Este comando no forma parte de `.husky/pre-push`; hasta integrarlo en ese gate, se mantienen en Playwright las regresiones responsive de las rutas críticas.

### CSS

`scripts/check-css-architecture.ts`, ejecutado mediante `pnpm check:css:architecture`, inspecciona el diff de `src/` y bloquea nuevos colores, funciones de color, familias tipográficas o pesos literales no autorizados. `tests/unit/css-architecture.test.ts` cubre la política; las excepciones de Leaflet y el mapa del juego están expresamente delimitadas.

### SEO y build

`pnpm build` valida indirectamente las Content Collections y genera `dist/`. `scripts/verify-seo.ts`, ejecutado con `pnpm check:seo`, inspecciona las páginas generadas, metadatos obligatorios, JSON-LD, `sitemap-index.xml` y `robots.txt`. `scripts/seo-metadata.ts` comprueba además la coherencia URL/canonical y WebSite JSON-LD de portada, el tipo/fecha/canonical/Article/BreadcrumbList de cada noticia y la tarjeta social de «Sobre el pueblo».

## Convenciones

Los cambios funcionales deben conservar o ampliar una prueba de comportamiento relevante. Las reglas puras deben permanecer comprobables sin navegador; las pruebas E2E deben verificar el resultado visible, los nombres accesibles y los estados asentados, no detalles transitorios de carga.

La validación de producción, dos navegadores conectados a Convex, spoofing de GPS, revisión física de ubicaciones y observabilidad de la automatización de bandos quedan fuera de la cobertura actual y requieren tareas independientes.
