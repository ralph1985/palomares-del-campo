# Arquitectura actual de Palomares del Campo

## Alcance y criterio de lectura

Este documento describe la implementación que existe en el repositorio. No describe una arquitectura objetivo ni convierte la hoja de ruta en funcionalidades disponibles. Cuando una capacidad todavía no está implementada aparece en **Evolución prevista** o en **Limitaciones conocidas**.

La web tiene dos superficies relacionadas, pero con fronteras distintas:

- una web editorial estática generada por Astro;
- un prototipo de juego geolocalizado con un modo local y un modo remoto respaldado por Convex cuando se configura `CONVEX_URL`.

El contenido editorial no depende de Convex. Convex solo interviene en el estado compartido del juego.

## Visión general

### Objetivo y responsabilidades

El proyecto publica información sobre Palomares del Campo y ofrece una experiencia interactiva alrededor de la “bola”. Sus responsabilidades actuales son:

- generar HTML estático para las páginas editoriales;
- validar y renderizar noticias y bandos desde Markdown;
- exponer información mantenida en módulos TypeScript para historia, patrimonio, rutas, alojamientos, contacto municipal y agenda;
- proporcionar navegación, búsqueda y filtros en el navegador sin introducir un framework de UI;
- mostrar mapas de Leaflet con cartografía de OpenStreetMap y atribución visible;
- ofrecer el juego en modo local y conectarlo a una temporada remota de Convex cuando existe un deployment configurado;
- cargar mejoras visuales Three.js de forma diferida, siempre con un fallback HTML, imagen o CSS.

No hay CMS, servidor Astro, API editorial, cuentas de usuario ni una base de datos para el contenido editorial.

### Stack verificado

Las versiones son las declaradas en `package.json`; las dependencias están fijadas sin rangos:

- **Astro 7.3.8**, con salida `static` y configuración de `site` en `astro.config.mjs`.
- **TypeScript** para el código de aplicación y las funciones de Convex. El repositorio no declara una dependencia directa `typescript` en `package.json`.
- **CSS nativo** con estilos scoped de Astro y tokens compartidos.
- **Leaflet 1.9.4** y `@types/leaflet` 1.9.20 para los mapas.
- **Three.js 0.186.1** y `@types/three` 0.186.0 para las escenas decorativas.
- **Convex 1.46.0** para el estado remoto del juego.
- **`@astrojs/sitemap` 3.7.4** para el sitemap estático.
- **Vitest 5.0.3** para pruebas unitarias y de integración.
- **Playwright 1.64.0** para pruebas E2E en Chromium.
- **ESLint 10.12.0**, `eslint-plugin-astro` 3.2.1 y **Prettier 3.9.10** para calidad y formato.
- **`dotenv` 17.2.3** y **Nodemailer 10.0.10** para la notificación SMTP del sincronizador de bandos.
- **pnpm 10.25.0**, declarado en `packageManager`.

### Principios que sí aplica el código

1. **Generación estática primero.** Las rutas Astro se generan durante el build; no se ha configurado un adaptador de servidor.
2. **Contenido separado de presentación.** Noticias y bandos viven en Content Collections; el resto del contenido estructurado vive en módulos de `src/data/`.
3. **Interactividad localizada.** Los scripts de navegador se cargan desde los componentes o las páginas que los necesitan.
4. **Degradación visual segura.** Three.js mejora la presentación, pero el menú, el mapa y el contenido disponen de una superficie no dependiente de WebGL.
5. **Estado remoto autoritativo para el juego.** El cliente puede calcular feedback provisional, pero Convex decide una captura remota, sus puntos y el avance de la bola.
6. **Fuentes visibles.** Las páginas editoriales y los directorios muestran enlaces a sus fuentes cuando el dato procede de un recurso externo.
7. **Sin infraestructura editorial prematura.** No se ha añadido CMS, backend editorial, autenticación general ni Supabase.

### Estrategia de renderizado

`astro build` produce un sitio estático en `dist/`. El build observado informa de `output: "static"` y genera las rutas de archivo durante la compilación. Las páginas que usan `getCollection()` o `getStaticPaths()` se resuelven en build time; no existe renderizado SSR en el repositorio.

La interactividad se hidrata mediante scripts normales incluidos en componentes Astro. No se usa React, Vue, Svelte ni otra capa de islas de UI.

## Estructura real del repositorio

La estructura siguiente refleja las carpetas y archivos de aplicación presentes. Los artefactos generados o las dependencias no forman parte de la arquitectura fuente.

```text
src/
├── pages/
├── layouts/
├── components/
├── scripts/
├── styles/
├── content/
├── game/
├── data/
└── content.config.ts

convex/
tests/
scripts/
docs/
public/
astro.config.mjs
package.json
playwright.config.ts
vitest.config.ts
```

### `src/pages/`

Rutas implementadas:

```text
src/pages/
├── index.astro                         /
├── sobre-el-pueblo.astro               /sobre-el-pueblo/
├── informacion-practica.astro          /informacion-practica/
├── agenda/index.astro                  /agenda/
├── alojamientos/index.astro            /alojamientos/
├── rutas/index.astro                   /rutas/
├── juego/index.astro                   /juego/
├── avisos/index.astro                  /avisos/ (redirección 301)
├── noticias/index.astro                /noticias/
├── noticias/[slug].astro               /noticias/[slug]/
├── bandos/index.astro                  /bandos/
└── bandos/[slug].astro                 /bandos/[slug]/
```

No existen actualmente rutas para `/lugares/`, `/lugares/[slug]/` ni `/patrimonio/` como páginas independientes. La información de patrimonio está integrada en `/sobre-el-pueblo/`.

### `src/layouts/`

```text
src/layouts/
└── BaseLayout.astro
```

`BaseLayout` es el único layout compartido. Inserta el documento HTML, `SEO.astro`, `SiteHeader`, el slot principal y `SiteFooter`. Acepta `bodyClass`, datos de Open Graph, configuración de schema, `noindex`, datos de artículo, breadcrumbs y un slot nombrado `head`.

### `src/components/`

```text
src/components/
├── SEO.astro
├── NewsCard.astro
├── NewsSection.astro
├── BandoCard.astro
├── CollectionArchive.astro
├── CollectionSearch.astro
├── about/
│   ├── AboutEmblem.astro
│   └── HeritageCard.astro
├── accommodations/
│   └── AccommodationCard.astro
├── current-affairs/
│   └── CurrentAffairsEmptyState.astro
├── game/
│   ├── GameBallVisual.astro
│   ├── GameDevelopmentSimulator.astro
│   ├── GameMap.astro
│   ├── GameMapCanvas.astro
│   ├── GamePrivacyNotice.astro
│   ├── GameRanking.astro
│   ├── GameRules.astro
│   └── GameStatusPanel.astro
├── home/
│   ├── HomeAudienceCards.astro
│   └── HomeEditorialGuide.astro
├── layout/
│   ├── ConquenseCredit.astro
│   ├── SideMenu.astro
│   ├── SiteFooter.astro
│   └── SiteHeader.astro
└── ui/
    ├── ActionLink.astro
    ├── Button.astro
    ├── CollectionCardMeta.astro
    └── ExternalLink.astro
```

Los componentes de `layout/` forman el shell común. `CollectionArchive` y `CollectionSearch` son compartidos por noticias y bandos. Los componentes de `game/` componen la superficie del juego; la lógica del mapa y la comunicación con Convex están en scripts de cliente separados.

### `src/scripts/`

```text
src/scripts/
├── auto-hide-header.ts   # Oculta/muestra la cabecera según el desplazamiento.
├── menu.ts               # Menú lateral, foco, Escape, inert y backdrop.
├── menu-scene.ts         # Escena Three.js del menú.
├── conquense-logo.ts     # Logo 3D del crédito del pie.
├── about-emblem.ts       # Emblema 3D de Sobre el pueblo.
├── game-ball.ts          # Bola 3D del encabezado del juego.
├── game-map.ts           # Leaflet, geolocalización, juego local y adaptadores remotos.
├── convex-game.ts        # Cliente Convex, identidad y suscripciones remotas.
└── route-map.ts          # Descarga, parseo y renderizado Leaflet de GPX.
```

### `src/styles/`

```text
src/styles/
├── global.css
├── tokens.css
└── pages/sobre-el-pueblo.css
```

`tokens.css` contiene colores, tipografías, pesos, escala y superficies del juego. `global.css` importa los tokens y define el reset mínimo, la tipografía base, el foco visible y `prefers-reduced-motion`. Los componentes Astro mantienen la mayor parte de sus estilos en bloques scoped. `/sobre-el-pueblo/` importa una hoja de página específica.

No existe `src/styles/typography.css` actualmente.

### `src/content/`

Solo existen dos Content Collections:

```text
src/content/
├── noticias/*.md
└── bandos/*.md
```

No hay colecciones para lugares, patrimonio o agenda. Esos contenidos, cuando existen, se mantienen en `src/data/` o se representan como páginas vacías.

### `src/game/`

```text
src/game/
├── geo.ts       # Haversine, precisión, evaluación local e interpolación.
├── rules.ts     # Reglas de demostración y decaimiento de puntuación.
└── session.ts   # Estado y captura de la sesión local.
```

Son funciones puras reutilizables por el cliente. No son la fuente autoritativa de una partida remota.

### `src/data/`

Los módulos TypeScript contienen datos estructurados que no son Content Collections:

```text
src/data/
├── about-palomares.ts
├── accommodations.ts
├── current-affairs.ts
├── game-locations.ts
├── home.ts
├── municipal-info.ts
├── navigation.ts
├── routes.ts
└── site-footer.ts
```

`current-affairs.ts` declara el contrato de agenda, pero `agendaItems` está vacío; por eso `/agenda/` muestra el estado vacío.

### `convex/`

```text
convex/
├── schema.ts
├── game.ts
├── geo.ts
├── identity.ts
├── leaderboard.ts
├── presence.ts
├── score.ts
├── tsconfig.json
├── _generated/       # generado por Convex; no editar manualmente
└── README.md         # README genérico del scaffolding de Convex
```

`convex/_generated/` se regenera con la CLI y contiene las referencias que importa `src/scripts/convex-game.ts`.

### `tests/`

```text
tests/
├── unit/              # Vitest: reglas, datos y políticas auxiliares.
├── integration/      # Vitest: adaptador cliente–Convex.
├── e2e/               # Playwright: flujos visibles en Chromium.
└── features/          # Escenarios Gherkin documentales.
```

### `scripts/`

```text
scripts/
├── fetch-bandos.ts
├── sync-bandos-cron.sh
├── bandos-sync-policy.ts
├── notify-bando-sync.ts
├── ensure-main-synced.ts
├── verify-seo.ts
├── visual-qa.ts
└── check-css-architecture.ts
```

## Arquitectura Astro

### Composición y generación

Todas las páginas de contenido importan `BaseLayout.astro` y componen su contenido dentro del slot principal; `/avisos/` es la excepción porque solo ejecuta una redirección. El layout siempre genera `lang="es"`, `SiteHeader`, el contenido de la página y `SiteFooter`.

- `/noticias/` carga la colección `noticias`, ordena por fecha y compone `CollectionArchive` con `NewsCard`.
- `/noticias/[slug]/` usa `getStaticPaths()`, `render(post)` y genera una página estática por entrada.
- `/bandos/` y `/bandos/[slug]/` hacen lo mismo con la colección `bandos`, usando `BandoCard` y recursos adjuntos.
- `/` usa datos de portada y muestra las tres noticias más recientes mediante `NewsSection`.
- `/sobre-el-pueblo/` usa `aboutPalomares`, `AboutEmblem`, `HeritageCard` y contenido de paisaje, tradiciones y fuentes.
- `/rutas/` usa `localRoutes`, carga un GPX público y crea el mapa interactivo en el navegador.
- `/alojamientos/` usa `ruralAccommodations` y separa opciones del municipio y alrededores.
- `/informacion-practica/` usa `municipalInfo` para contacto, servicios oficiales y horarios de transporte.
- `/agenda/` usa el array `agendaItems`; al estar vacío, renderiza `CurrentAffairsEmptyState`.
- `/juego/` calcula `hasRemoteGame` a partir de `import.meta.env.CONVEX_URL` y compone la experiencia local o remota.
- `/avisos/` ejecuta `Astro.redirect('/bandos/', 301)` y no genera contenido editorial propio.

### Content Collections

`src/content.config.ts` define las colecciones con `glob` loader de Astro:

- `noticias`: `title`, `description`, `author`, `authorType`, `date`, `sourceName`, `sourceUrl`, `category` opcional e `isFeatured`.
- `bandos`: `title`, `description`, `author`, `authorType`, `date`, `category`, `sourceName`, `sourceUrl`, `sourceId` y `attachments`.
- `attachments` valida `type` (`image`, `document` o `video`), URL, etiqueta y texto alternativo opcional.

Las fechas usan `z.coerce.date()`. `authorType` limita el tipo de autor de los datos estructurados a `Person` u `Organization`. El loader ignora archivos cuyo nombre empieza por `_`.

El contenido Markdown se valida al sincronizarse con el esquema de Astro y vuelve a comprobarse indirectamente durante `pnpm build`.

### Estilos

La regla efectiva es CSS nativo:

- tokens compartidos en `src/styles/tokens.css`;
- base global y foco visible en `src/styles/global.css`;
- estilos específicos en cada `.astro` mediante `<style>` scoped;
- una hoja separada solo para la composición de `/sobre-el-pueblo/`.

`check:css:architecture` analiza el diff de `src/` y bloquea nuevos colores, funciones de color, familias tipográficas o pesos literales no autorizados, con excepciones explícitas para los mapas. La existencia del script no significa que se ejecute automáticamente en cada `pnpm build`; se invoca mediante su comando propio y tiene cobertura adicional en Vitest.

### SEO y metadatos

`SEO.astro` centraliza:

- `<title>`, descripción y `robots`;
- canonical absoluto basado en `Astro.site` y `canonicalPath`;
- Open Graph y Twitter Cards;
- `Article` JSON-LD para noticias y bandos;
- `WebSite` JSON-LD en la portada;
- `BreadcrumbList` cuando la página lo proporciona.

Las páginas de detalle pasan `author`, `authorType`, fecha, sección y fuente original al schema `Article`. Los bandos pueden aportar una imagen adjunta como imagen social. No se fabrica una imagen social cuando no existe.

`astro.config.mjs` fija el sitio canónico en `https://palomaresdelcampo.conquense.dev` y configura `@astrojs/sitemap`, excluyendo `/avisos/`. `public/robots.txt` permite el rastreo y referencia `sitemap-index.xml`. `scripts/verify-seo.ts`, ejecutado por `pnpm check:seo` después del build, comprueba metadatos, idioma, canonical, JSON-LD, sitemap y robots.

## Arquitectura del juego

### Superficie y flujo general

`GameMap.astro` compone `GameMapCanvas` y `GameStatusPanel`. `GameMapCanvas` incluye el contenedor `#game-map` y carga `game-map.ts`, que inicializa Leaflet y conecta la sesión local o Convex.

El flujo de captura es:

1. el navegador obtiene o simula una posición;
2. `src/game/geo.ts` ofrece feedback local mediante Haversine, radio y precisión;
3. el jugador debe comprobar la posición antes de habilitar la captura;
4. en modo local, `captureLocation()` avanza el estado en memoria;
5. en modo remoto, `convex-game.ts` envía `captureBall` con la versión de bola esperada y una clave de idempotencia;
6. Convex vuelve a validar la petición dentro de una mutation y actualiza captura, jugador y bola atomáticamente;
7. las suscripciones actualizan el mapa, la puntuación y el ranking.

La comprobación del navegador es orientativa. Las coordenadas, la precisión y la versión recibidas por Convex son datos proporcionados por el cliente; la aceptación definitiva la decide `convex/game.ts`.

### Leaflet y representación visual

El mapa del juego:

- usa `L.map()` con centro inicial `39.9464, -2.5988` y zoom 16;
- carga teselas `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`;
- muestra atribución de OpenStreetMap;
- representa los lugares con `CircleMarker`;
- representa la bola activa, la posición propia y los jugadores remotos con marcadores distintos;
- interpola visualmente la posición remota durante 7 segundos, sin convertir esa interpolación en estado autoritativo.

El mapa de `/rutas/` se implementa en `route-map.ts`. Descarga el GPX desde `public/routes/`, lo parsea con `DOMParser`, dibuja una polilínea y sus waypoints y muestra un estado de error si la descarga o el XML fallan. También conserva la descarga del GPX como fallback.

### Modo local

El modo local se activa cuando no hay `CONVEX_URL`. `createInitialGameState()` empieza en la primera ubicación de `gameLocations`, con cero puntos y cero capturas. Una captura válida suma 10 puntos y mueve la bola a la siguiente ubicación del array.

La posición puede proceder de `navigator.geolocation.watchPosition()` o del simulador de desarrollo. El simulador se renderiza solo cuando `import.meta.env.DEV` es verdadero y permite escenarios exactos, próximos al límite, fuera del radio y con precisión insuficiente.

El estado de puntuación local vive en memoria: una recarga vuelve a cero y devuelve la bola a la primera ubicación. El nick y el `deviceId` sí se guardan localmente, de forma independiente, en `localStorage` bajo `palomares-player-v1`.

### Modo remoto y comunicación con Convex

Cuando `CONVEX_URL` está definido, `convex-game.ts` crea un `ConvexClient` y:

- consulta `api.game.getActiveSeason`;
- se incorpora mediante `api.game.joinSeason`;
- consulta el resumen del jugador y el ranking;
- se suscribe a `api.game.getSeasonState`, `api.game.getPlayerSummary` y `api.leaderboard.getLeaderboard`;
- actualiza presencia mediante `api.game.updatePresence`;
- captura mediante `api.game.captureBall`;
- cancela las suscripciones y cierra el cliente en `dispose()` o al abandonar la página.

Si existe un nick guardado, el cliente intenta conectar automáticamente. Si no existe temporada activa, el nick está ocupado o Convex falla, la interfaz muestra un mensaje de estado y conserva la posibilidad de seguir en el modo disponible.

### Estados de la partida y puntuación

Una temporada tiene estado `active` o `finished`. La mutación `createSeason` crea temporadas activas con un único estado de bola y una secuencia ordenada de ubicaciones. En el código actual no hay una mutation para finalizar temporadas ni una interfaz administrativa para gestionarlas.

`ballState` mantiene la ubicación activa, una versión monotónica y `updatedAt`. Cada captura aceptada:

- valida que la temporada sigue activa;
- comprueba la versión esperada;
- calcula la distancia con la función Haversine del backend;
- rechaza precisión superior a 100 metros;
- registra la captura;
- suma los puntos definidos por la temporada;
- incrementa la versión y desplaza la bola a la siguiente ubicación.

El score efectivo aplica un decaimiento del 5 % por cada día completo desde `lastCaptureAt`, con mínimo cero. El valor decaído se calcula al leer; no se observa una tarea que persista diariamente ese decaimiento.

### Capturas, idempotencia y concurrencia

`captureBall` recibe `expectedBallVersion` e `idempotencyKey`.

- Si la clave ya existe con la misma huella de petición, devuelve el resultado como duplicado sin volver a sumar puntos.
- Si la misma clave llega con otra huella, devuelve `idempotency-conflict`.
- Si la versión de bola ya cambió, devuelve `stale-ball`.
- Las escrituras de la captura, el jugador y la bola están dentro de una única mutation de Convex.

La interfaz genera una clave aleatoria nueva por llamada a `capture()`. El backend soporta idempotencia, pero el adaptador no reutiliza automáticamente la misma clave en un reintento posterior.

La concurrencia se controla mediante la versión esperada y la transacción de la mutation: dos clientes con una versión antigua no pueden avanzar la bola después de que otro la haya actualizado.

### Ranking

`leaderboard.getLeaderboard` lee jugadores de una temporada, calcula su score efectivo, descarta puntuaciones cero, ordena por puntuación y después por número de capturas, y limita la respuesta a 50 entradas. Se actualiza reactivamente mediante `ConvexClient.onUpdate`.

No existe un ranking diario separado, un historial de eventos de puntuación ni una tabla `scoreEvents`.

### Identidad y presencia

El navegador genera un identificador aleatorio de 16 bytes con `crypto.getRandomValues()` y conserva el nick junto a él en `localStorage`. Convex normaliza el nick con NFKC, elimina espacios extremos, limita su longitud a 24 caracteres y compara la clave en minúsculas según `es`.

Cambiar el nick de un mismo `deviceId` reinicia puntuación, capturas y presencia. El ranking excluye a los jugadores con puntuación cero.

La presencia:

- se envía cada 10 segundos mientras hay partida remota y una posición disponible;
- redondea latitud y longitud a cuatro decimales antes de almacenarlas;
- se considera activa durante menos de 30 segundos desde `presenceAt`;
- se elimina visualmente al caducar;
- no mantiene un historial de recorridos.

El backend sí almacena temporalmente las coordenadas redondeadas en la fila del jugador. La afirmación correcta es que no se guarda un historial de ubicación exacta, no que la ubicación nunca se almacene.

### Errores y límites del cliente

El cliente diferencia, entre otros, `nickname-taken`, `no-active-season`, `stale-ball`, `low-accuracy`, `outside-radius`, `player-not-found` y errores de conexión. Un fallo al publicar presencia se ignora deliberadamente porque el TTL hará caducar la presencia.

El navegador puede ser manipulado y puede enviar coordenadas o precisión falsificadas. La validación de distancia, precisión, temporada, puntuación, idempotencia y versión se repite en Convex, pero el código no demuestra una protección contra spoofing de GPS.

### Seguridad conocida de Convex

Solo `createSeason` llama a `ctx.auth.getUserIdentity()` y exige una identidad autenticada; utiliza su `subject` como `ownerSubject`. Las operaciones `joinSeason`, `updatePresence`, `getPlayerSummary` y `captureBall` identifican al jugador mediante el `deviceId` enviado por el cliente y no comprueban `ctx.auth`.

Por tanto:

- el `deviceId` no es autenticación fuerte;
- `ownerSubject` se guarda, pero el código actual no muestra una autorización posterior basada en ese propietario;
- las queries de temporada, estado, jugador y ranking no requieren autenticación explícita;
- quien consiga un `deviceId` puede intentar operar en nombre de ese jugador;
- el servidor valida las reglas de juego, pero no la autenticidad física de la posición GPS.

Estas limitaciones son parte del estado actual y no deben documentarse como si existiera autenticación de jugadores.

## Contenido editorial

### Noticias

Las noticias son Markdown en `src/content/noticias/`. La colección exige título, descripción, fecha, fuente y URL original; permite categoría y marca de destacada. `/noticias/` ordena las entradas por fecha y ofrece búsqueda, categoría y año en el cliente. `/noticias/[slug]/` genera páginas estáticas con contenido Markdown renderizado, autor, fecha, fuente, Article JSON-LD y breadcrumbs.

### Bandos municipales

Los bandos son una colección separada en `src/content/bandos/`. No se mezclan con las noticias aunque compartan el patrón de archivo y búsqueda. Cada entrada conserva autor, fecha, categoría, `sourceName`, `sourceUrl`, `sourceId` y adjuntos externos tipados.

La página de detalle renderiza imágenes, documentos y vídeos según el tipo validado. Las imágenes usan `loading="lazy"` y `decoding="async"`; los documentos y vídeos se muestran como enlaces externos. `/avisos/` se conserva como redirección 301 de compatibilidad hacia `/bandos/`.

### Importación externa

`scripts/fetch-bandos.ts` implementa dos modos:

- `rss` es el modo por defecto e importa de forma incremental el RSS oficial de Bandomovil. Añade o actualiza entradas y conserva Markdown históricos y adjuntos ya presentes que no aparezcan en la ventana del RSS.
- `archive` recorre el archivo de Bandomovil, limita la importación a los años configurados en `TARGET_YEARS` (actualmente 2025 y 2026) y reconcilia el directorio, eliminando archivos que ya no formen parte del conjunto descargado.

El importador convierte HTML a Markdown, valida URLs HTTPS, restringe los adjuntos a recursos `userFiles` del origen de Bandomovil, conserva `sourceId` y ejecuta Prettier cuando hay cambios. No hay descubrimiento automático de noticias externas.

### Sincronización automatizada de bandos

`scripts/sync-bandos-cron.sh` está diseñado para ser invocado desde cron en un host con Node.js, pnpm, GitHub CLI y credenciales locales. El repositorio no contiene una instalación de cron ni un workflow de GitHub que pruebe que el proceso esté programado.

El flujo implementado bloquea ejecuciones concurrentes, alinea `main` con `origin/main` mediante `ensure-main-synced.ts`, trabaja desde un worktree de `origin/main`, ejecuta el importador RSS y valida formato, lint, Vitest y build. Si hay cambios, limita la rama y la Pull Request a `src/content/bandos/*.md`, espera los checks obligatorios, fusiona la PR y vuelve a alinear `main`.

`SYNC_BANDOS_DRY_RUN=1` detiene el flujo antes de crear la rama de bandos, la PR, la fusión y las notificaciones. No equivale a un dry-run completamente no destructivo del checkout: `ensure-main-synced.ts` se ejecuta antes de comprobar la variable y puede crear una rama de respaldo y alinear `main` con `origin/main` si detecta divergencia. Tras una fusión normal, `notify-bando-sync.ts` puede enviar un correo SMTP con Nodemailer; si falta la configuración o falla el envío, la PR ya fusionada no se deshace.

## Rendimiento y carga de cliente

### Estrategias aplicadas

- Astro genera HTML estático, por lo que el contenido editorial no necesita JavaScript para aparecer.
- El menú importa `menu-scene` únicamente al abrirse.
- El logo del pie, el emblema de `/sobre-el-pueblo/` y la bola del juego cargan Three.js con `import()` cuando sus elementos son visibles o entran en el margen del viewport.
- Cada escena mantiene una imagen o dibujo CSS de fallback y oculta el canvas si WebGL o la carga de recursos falla.
- Los recursos de imagen declaran dimensiones en las superficies principales y las imágenes secundarias de algunas páginas usan `loading="lazy"`.
- El juego y los mapas cargan Leaflet solo en las rutas que los incluyen.
- `prefers-reduced-motion` desactiva o reduce las animaciones de CSS y Three.js donde está contemplado.

No hay una integración de optimización de imágenes de Astro ni una estrategia de CDN definida en el repositorio. La mayoría de las imágenes proceden de `public/` o de URLs externas de los contenidos.

El build observado emite una advertencia de Vite por chunks superiores a 500 kB. No se debe afirmar que la división de código ha eliminado ese coste; la optimización de bundles queda como tarea independiente.

### JavaScript enviado al navegador

El shell global incluye comportamiento de menú y cabecera/pie. Las páginas de colecciones incluyen filtros en cliente. `/juego/` añade Leaflet, geolocalización, la lógica de sesión y, si procede, Convex. `/rutas/` añade Leaflet y el parser GPX. Las escenas Three.js se cargan bajo demanda, pero Three.js sigue siendo un recurso real cuando el usuario activa o alcanza esas superficies.

### Leaflet y fuentes cartográficas

Los dos mapas usan teselas públicas de OpenStreetMap con atribución. El código no implementa caché propia, proxy de teselas ni control de disponibilidad del proveedor. La experiencia puede mostrar un estado de error en el mapa de rutas; el juego conserva su estructura, pero depende de la carga de las teselas para la cartografía.

## Testing y validación

### Configuración real

- `vitest.config.ts` usa entorno `node` e incluye `tests/unit/**/*.test.ts` y `tests/integration/**/*.test.ts`.
- `playwright.config.ts` ejecuta `tests/e2e/` en Chromium, con base URL `http://127.0.0.1:4321`, servidor Astro de desarrollo, trazas y capturas solo en fallo, y vídeo retenido en fallo.
- En CI Playwright usa un worker y hasta dos reintentos; localmente no reintenta.
- Los escenarios de `tests/features/` son Gherkin de referencia. No hay Cucumber ni un ejecutor de steps conectado a esos archivos.

### Pruebas existentes

Las pruebas Vitest cubren:

- sesión local, reglas, distancia y precisión;
- validación geográfica y decaimiento del score en Convex;
- normalización de nicks y TTL/redondeo de presencia;
- contrato del adaptador cliente–Convex, callbacks reactivos, presencia, captura e idempotencia del payload;
- importación y política de sincronización de bandos;
- notificación SMTP aislada;
- tokens y guardas de arquitectura CSS;
- alineación segura de `main`.

La ejecución verificada actual contiene 19 archivos y 68 pruebas Vitest, todas correctas. No hay informe de cobertura configurado.

Playwright cubre navegación, menú accesible, portada, noticias, bandos, agenda vacía, información práctica, alojamientos, rutas, SEO, juego local, modo inmersivo, simulador, presencia visual de Three.js y responsive. Las pruebas del juego usan el servidor Astro de desarrollo y el simulador local; no constituyen una prueba E2E contra un deployment remoto de Convex ni un flujo de dos jugadores.

`scripts/visual-qa.ts` recorre nueve rutas en dos viewports y comprueba HTTP 200, overflow horizontal, foco, contraste aproximado y errores de consola. Es una comprobación reproducible de calidad visual, no un sistema de snapshots de imagen.

`scripts/check-css-architecture.ts` inspecciona cambios en `src/` y aplica las excepciones de arquitectura CSS. `scripts/verify-seo.ts` inspecciona el contenido generado de `dist/` y el sitemap.

### Comandos disponibles

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm build
pnpm preview
pnpm test
pnpm test:watch
pnpm test:e2e
pnpm qa:visual
pnpm check:css:architecture
pnpm check:seo
pnpm lint
pnpm format
pnpm format:check
pnpm fetch-bandos
pnpm sync-bandos
```

`pnpm check:seo` necesita un build previo. `pnpm qa:visual` necesita un servidor accesible en `VISUAL_QA_BASE_URL` o en `http://127.0.0.1:4321`; a diferencia de Playwright, el script no arranca Astro por sí mismo.

### Validaciones no automáticas o futuras

No existe en el repositorio una prueba E2E real con dos navegadores conectados al mismo deployment de Convex, una validación física de ubicaciones, una protección contra spoofing de GPS ni cobertura de producción. Son necesidades futuras o tareas operativas, no capacidades actuales.

## Despliegue, configuración y automatizaciones

### Sitio web

El repositorio verifica una salida estática en `dist/` y declara como dominio canónico `https://palomaresdelcampo.conquense.dev`. `AGENTS.md` identifica Vercel como plataforma prevista, pero no hay adaptador de Vercel, `vercel.json`, workflow de despliegue ni evidencia de un proyecto remoto en este repositorio. Por tanto, Vercel es una decisión prevista, no una integración de producción verificable aquí.

Para desplegar el sitio, el proceso verificable en código es:

```bash
pnpm install --frozen-lockfile
pnpm build
```

La publicación real, sus variables de entorno y su estado remoto requieren comprobación en la plataforma de hosting y no se pueden inferir de un build local correcto.

### Convex

Para desarrollo remoto del juego, el README y `AGENTS.md` indican:

```bash
pnpm exec convex dev
```

Este comando apunta al deployment de desarrollo y regenera `convex/_generated/`. `pnpm exec convex deploy` existe como capacidad de la CLI, pero no forma parte del flujo local normal y requiere autorización explícita para un despliegue.

La interfaz solo considera remoto el juego cuando `CONVEX_URL` está disponible en el build. No hay en el repositorio una configuración de producción de Convex ni un mecanismo de migración o administración de temporadas fuera de la mutation `createSeason`.

### Variables de entorno e integraciones externas

Los nombres utilizados por el código son:

- `CONVEX_URL` para activar el cliente remoto del juego;
- `BANDOS_IMPORT_MODE` para elegir `rss` o `archive`;
- `SYNC_BANDOS_DRY_RUN` para el modo seguro del sincronizador;
- `BANDOS_CHECK_DISCOVERY_ATTEMPTS` y `BANDOS_CHECK_DISCOVERY_INTERVAL_SECONDS` para la espera de checks;
- `BANDOS_SITE_URL` para enlazar al sitio publicado en los correos;
- `BANDOS_SMTP_HOST`, `BANDOS_SMTP_PORT`, `BANDOS_SMTP_SECURE`, `BANDOS_SMTP_USER`, `BANDOS_SMTP_PASSWORD`, `BANDOS_NOTIFY_FROM` y `BANDOS_NOTIFY_TO` para SMTP.

Los secretos deben permanecer en archivos de entorno ignorados o en el proveedor de ejecución. Este documento no contiene valores de secretos, tokens, URLs privadas ni credenciales.

Las integraciones externas verificables son OpenStreetMap, Bandomovil, fuentes enlazadas por el contenido, GitHub CLI/API para el sincronizador y un servidor SMTP opcional para notificaciones.

## Auditoría de la documentación anterior

La clasificación se basa en la comparación entre el `architecture.md` anterior y los archivos fuente actuales.

| Clasificación  | Hallazgo                                                                                                                         | Corrección aplicada                                                                                                |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Desactualizado | El juego se describía principalmente como prototipo local, con Convex como estado compartido futuro.                             | Se documentan el modo remoto actual, las subscriptions, las mutations y sus límites.                               |
| Incorrecto     | Se enumeraban `/lugares/`, `/patrimonio/` y otras rutas “previstas” como si fueran la superficie existente.                      | Se sustituye por el inventario real de `src/pages/`; patrimonio queda situado en `/sobre-el-pueblo/`.              |
| Incorrecto     | Se atribuían Content Collections a lugares, patrimonio y agenda.                                                                 | Se documentan únicamente `noticias` y `bandos`; la agenda real es un array vacío en `src/data/current-affairs.ts`. |
| Incompleto     | La estructura de componentes omitía `about`, `game`, `home`, `accommodations`, `current-affairs`, componentes de colección y UI. | Se incorpora el árbol real y la separación de responsabilidades observada.                                         |
| Incompleto     | La lista de scripts solo cubría menú y Three.js.                                                                                 | Se añaden mapas, Convex, sesión, geolocalización, GPX, cabecera y sincronización visual.                           |
| Incompleto     | No se describían esquema, índices, queries, mutations, presencia, ranking, score ni seguridad de Convex.                         | Se añade una sección basada en `convex/schema.ts` y las funciones exportadas.                                      |
| Incompleto     | La documentación trataba SEO y sitemap como intención, sin describir el contrato de `SEO.astro` ni la verificación.              | Se documentan metadatos, JSON-LD, canonical, sitemap, robots y `check:seo`.                                        |
| Incompleto     | No se explicaban importación RSS, backfill, worktree, Pull Request, checks y SMTP.                                               | Se describe el flujo real y se separa de la instalación de cron, que no está en el repositorio.                    |
| Incorrecto     | Se presentaba `src/styles/typography.css` como parte de la estructura.                                                           | Se elimina del inventario porque no existe.                                                                        |
| Incompleto     | Three.js aparecía reducido a menú y crédito.                                                                                     | Se incluyen también emblema y bola, carga bajo demanda y fallbacks.                                                |

## Estado actual, limitaciones y evolución

### Estado actual

- La web editorial se genera estáticamente con Astro.
- Noticias y bandos están validados mediante Content Collections y tienen rutas de archivo y detalle.
- El juego local funciona con geolocalización o simulador de desarrollo.
- Convex implementa temporada activa, jugadores, bola, capturas, ranking, presencia y suscripciones remotas.
- El cliente y el backend comparten reglas de distancia y precisión, pero el backend es la autoridad remota.
- El SEO técnico, el sitemap y la validación de artefactos generados están implementados.
- El sincronizador de bandos tiene un flujo de PR y merge implementado, aunque su programación y credenciales pertenecen al host de automatización.

### Limitaciones conocidas

- No hay autenticación fuerte para las operaciones de jugador; `deviceId` llega del cliente.
- No hay protección contra manipulación de GPS.
- La presencia almacena coordenadas redondeadas temporalmente en Convex.
- Las coordenadas y radios de `src/data/game-locations.ts` son provisionales y no equivalen a una revisión física.
- No hay mutation de finalización de temporadas ni administración de backend.
- No hay prueba E2E de varios jugadores contra Convex real.
- No hay cobertura de código configurada.
- El build advierte de chunks grandes.
- No se puede verificar desde el repositorio el despliegue de producción, la instalación de cron ni la configuración real de SMTP o Convex.
- Las teselas y algunos adjuntos dependen de servicios externos sin caché propia.
- El adaptador remoto sigue resolviendo el nombre, radio y descripción contra `src/data/game-locations.ts`; una temporada Convex con ubicaciones distintas puede mostrar feedback local incorrecto.
- Las queries de estado y ranking son públicas, no hay rate limiting ni cuotas de jugador, y el índice de idempotencia no declara una restricción de unicidad en el esquema.
- `captureBall` valida la regla de distancia y precisión sobre los valores recibidos, pero no implementa una prueba de autenticidad del GPS ni una validación explícita de rangos de coordenadas equivalente a la de `updatePresence`.
- `src/pages/rutas/index.astro` e `src/pages/informacion-practica.astro` superan el umbral operativo de 400 líneas y requieren revisión estructural independiente; no se han refactorizado en esta tarea.

### Evolución prevista

Estas líneas no están implementadas como parte de la arquitectura actual:

- revisar físicamente los lugares y radios antes de abrir una temporada real;
- añadir gestión explícita del ciclo de vida de temporadas;
- decidir un mecanismo de identidad y autorización más fuerte si el juego deja de ser un prototipo;
- añadir pruebas E2E remotas con dos jugadores y pruebas de concurrencia contra Convex;
- revisar el tamaño de chunks y la optimización de recursos después de medir el build;
- verificar y documentar el hosting, el despliegue de Convex, cron y la observabilidad del sincronizador;
- añadir nuevas colecciones o automatización editorial solo cuando exista una decisión de alcance y trazabilidad.

No existe una ADR separada porque las decisiones relevantes ya están expresadas en el código, `AGENTS.md` y esta documentación; crear otra capa de registros no aportaría evidencia histórica adicional.

## Verificación de este documento

La auditoría se contrastó con:

- `package.json`, `astro.config.mjs`, `playwright.config.ts` y `vitest.config.ts`;
- todas las rutas de `src/pages/` y el layout `BaseLayout.astro`;
- `src/content.config.ts`, componentes, scripts de cliente, `src/game/` y `src/data/`;
- `convex/schema.ts` y las funciones de `convex/`;
- scripts de importación, SEO, CSS, QA visual y sincronización;
- pruebas unitarias, de integración, E2E y escenarios Gherkin;
- el build estático, Vitest y `check:seo` ejecutados en el repositorio.

No se han modificado archivos de aplicación, dependencias, configuraciones, pruebas ni lógica del juego.
