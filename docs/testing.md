# Estrategia de pruebas de la web

La estrategia actual protege la web editorial, el shell compartido y el juego. Las pruebas implementadas se distinguen de las validaciones todavía pendientes contra infraestructura remota.

## Configuración

- `vitest.config.ts` usa `getViteConfig()` de `astro/config` para cargar la configuración Vite de Astro; ejecuta tests en Node e incluye `tests/unit/**/*.test.ts` y `tests/integration/**/*.test.ts`. Los tests de componentes Astro usan `AstroContainer` dentro de la misma suite.
- `playwright.config.ts` ejecuta `tests/e2e/` en Chromium. Por defecto arranca `pnpm exec astro dev --host 127.0.0.1 --port 4321` y usa `http://127.0.0.1:4321`; `PLAYWRIGHT_BASE_URL` permite apuntar a un servidor ya activo, que se reutiliza si responde. No arrancar una segunda instancia del mismo proyecto sobre una Astro dev existente.
- El servidor aislado de Playwright establece `DISABLE_ASTRO_DEV_TOOLBAR_FOR_E2E=true`; `astro.config.ts` desactiva la barra solo en ese proceso. También vacía `CONVEX_URL` y activa `PUBLIC_E2E_TEST_MODE=true`: los mapas usan un estado vacío determinista y el juego/formulario no conectan con Convex. Ese modo solo se reconoce con `import.meta.env.DEV`; el frontend de producción no puede activarlo con la variable pública. La barra sigue activa en `pnpm dev` normal. El test de infraestructura `tests/e2e/test-harness.spec.ts` verifica que el toolbar no se inyecta en el servidor de la suite.
- El hook `.husky/pre-commit` y el workflow CI ejecutan `pnpm typecheck` antes de `pnpm lint`, porque `astro check` genera `.astro/types.d.ts`, necesario para resolver los módulos virtuales de Astro desde un checkout limpio. `.husky/pre-push` no repite el typecheck.
- `tests/e2e/fixtures.ts` intercepta los tiles de OpenStreetMap y las imágenes adjuntas de Bandomovil en las pruebas correspondientes, y sirve SVGs inocuos. Los tests comprueban la integración de Leaflet y la presencia de adjuntos; no validan el proveedor externo ni la fidelidad de los recursos reales.
- En CI Playwright prohíbe `test.only`, usa un worker y hasta dos reintentos. Localmente no reintenta.

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

- `src/game/`: distancia Haversine, precisión GPS, reglas de puntuación, decaimiento local, avance de ubicación y error explícito si la sesión no tiene ubicaciones;
- `convex/`: validación geográfica del servidor, decaimiento del score, normalización de nick, TTL/redondeo de presencia y verificación fail-closed de Turnstile/Resend, incluida la indisponibilidad del proveedor;
- `src/scripts/convex-game.ts`: adaptación de queries, mutations, presencia, callbacks reactivos, suscripciones e idempotencia del payload; rechaza ausencia de temporada o denegación del servidor antes de emitir estado o suscribirse;
- importación y política de sincronización de bandos;
- construcción de notificaciones SMTP;
- alineación segura de `main`;
- validación y restauración de identidad desde `localStorage`, generación de identidad nueva ante datos corruptos o almacenamiento bloqueado, configuración SMTP y JSON-LD generado;
- proyección de registros públicos para el mapa de Palomareños, descartando valores que no sean registros válidos;
- renderizado de `src/components/SEO.astro` con `AstroContainer`: canonical/noindex, metadatos sociales, schema de Article/WebSite, breadcrumbs y escape de contenido HTML;
- renderizado de componentes presentacionales con `AstroContainer`: `GamePrivacyNotice` (copia local/remota), `CurrentAffairsEmptyState` (agenda/avisos y relación título-ARIA), tarjetas de alojamiento y patrimonio (variantes/campos opcionales), enlaces/botones compartidos y fecha localizada con atributo ISO legible por máquina;
- renderizado de `BandoCard` y `NewsCard` con fixtures tipados de Content Collections: rutas, fechas, metadatos de fuente, texto indexable, adjuntos y categoría por defecto;
- composición de `CollectionArchive` en estado vacío y con slots (recuento singular/plural), y de `BaseLayout` con `SEO` y sus slots de página/cabecera; los filtros interactivos de `CollectionSearch` siguen cubiertos por Playwright;
- renderizado de `HomeAudienceCards` y `HomeEditorialGuide`: relaciones de encabezados, destinos para vecinos/visitantes y las cuatro rutas editoriales; `NewsSection`: orden cronológico, límite de tres tarjetas y estado vacío;
- shell compartido con `AstroContainer`: estado inicial accesible de `SiteHeader`/`SideMenu`, y `SiteFooter` con `ConquenseCredit`, enlaces oficiales, contacto y control de volver arriba; las interacciones del menú y fallbacks de scripts siguen en Playwright;
- renderizado de `CollectionSearch` (scopes, facets y textos de estado), `WorldMap`/`WorldSubmissionForm` (shell accesible, datos de privacidad, consentimiento y protección anti-bots) y fallback SVG de `AboutEmblem`; el filtrado, mapa, envío y WebGL se ejercitan en Playwright;
- renderizado de los siete componentes de juego aún pendientes con `AstroContainer`: fallback de `GameBallVisual`, simulador de desarrollo, composición del tablero, canvas/atribución del mapa, ranking vacío, reglas provisionales y estado inicial accesible de `GameStatusPanel`; el modo inmersivo, geolocalización, captura, simulación y fallbacks WebGL siguen en Playwright;
- reintento único de navegación de QA visual cuando `astro dev` aborta una ruta con `net::ERR_ABORTED`;
- tokens y guardas de arquitectura CSS.

`pnpm test:coverage` se ha ejecutado con 34 archivos y 188 pruebas; genera `coverage/index.html` y `coverage/lcov.info` (ignorados por Git) y aplica un umbral global del 90% en statements, branches, functions y lines; el CI usa este comando como gate. Esta ejecución dio 93,50% statements, 90,94% branches, 96,55% functions y 96,85% lines. El alcance incluye la lógica de dominio en `src/game/`, los adaptadores puros `src/scripts/convex-game.ts` y `src/scripts/palomarenos-map-data.ts`, las funciones/helpers de `convex/` y los treinta componentes más un layout Astro probados: `SEO`, `BandoCard`, `NewsCard`, `CollectionArchive`, `BaseLayout`, `GamePrivacyNotice`, `GameBallVisual`, `GameDevelopmentSimulator`, `GameMap`, `GameMapCanvas`, `GameRanking`, `GameRules`, `GameStatusPanel`, `CurrentAffairsEmptyState`, `AccommodationCard`, `HeritageCard`, `ActionLink`, `ExternalLink`, `Button`, `CollectionCardMeta`, `NewsSection`, `HomeAudienceCards`, `HomeEditorialGuide`, `ConquenseCredit`, `SiteHeader`, `SideMenu`, `SiteFooter`, `CollectionSearch`, `WorldMap`, `WorldSubmissionForm` y `AboutEmblem`; se excluyen el esquema declarativo y los archivos generados. LCOV confirma el mapeo de las 31 fuentes Astro y 100% de líneas; todas sus funciones y ramas están cubiertas salvo una rama de fallback de `PUBLIC_TURNSTILE_SITE_KEY` en `WorldSubmissionForm`. Los scripts de navegador y las interacciones dinámicas se ejercitan en Playwright.

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

`scripts/visual-qa.ts`, ejecutado mediante `pnpm qa:visual`, recorre once rutas en `1440×900` y `375×812`, incluidos alojamientos, «Palomareños por el mundo» y un detalle de bando. Comprueba HTTP 200, overflow horizontal, foco visible, contraste aproximado y errores de consola. Los tiles de OpenStreetMap y adjuntos de Bandomovil se sustituyen por fixtures SVG compartidos con E2E. No genera snapshots ni realiza comparación de píxeles pese a su nombre. Reintenta una sola vez solo si Astro dev aborta la navegación con `net::ERR_ABORTED`; otros errores siguen fallando. Este comando no forma parte de `.husky/pre-push`; hasta integrarlo en ese gate, se mantienen en Playwright las regresiones responsive de las rutas críticas.

### CSS

`scripts/check-css-architecture.ts`, ejecutado mediante `pnpm check:css:architecture`, inspecciona el diff de `src/` y bloquea nuevos colores, funciones de color, familias tipográficas o pesos literales no autorizados. `tests/unit/css-architecture.test.ts` cubre la política; las excepciones de Leaflet y el mapa del juego están expresamente delimitadas.

### SEO y build

`pnpm build` valida indirectamente las Content Collections y genera `dist/`. `scripts/verify-seo.ts`, ejecutado con `pnpm check:seo`, inspecciona las páginas generadas, metadatos obligatorios, JSON-LD, `sitemap-index.xml` y `robots.txt`. `scripts/seo-metadata.ts` comprueba además la coherencia URL/canonical y WebSite JSON-LD de portada, el tipo/fecha/canonical/Article/BreadcrumbList de cada noticia y la tarjeta social de «Sobre el pueblo».

## Convenciones

Los cambios funcionales deben conservar o ampliar una prueba de comportamiento relevante. Las reglas puras deben permanecer comprobables sin navegador; las pruebas E2E deben verificar el resultado visible, los nombres accesibles y los estados asentados, no detalles transitorios de carga.

La validación de producción, dos navegadores conectados a Convex, spoofing de GPS, revisión física de ubicaciones y observabilidad de la automatización de bandos quedan fuera de la cobertura actual y requieren tareas independientes.
