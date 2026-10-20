# Instrucciones para agentes de código

Estas reglas se aplican a todo el repositorio. La arquitectura explicada está en [`docs/architecture.md`](docs/architecture.md); este archivo contiene las reglas operativas que deben seguirse en cada cambio.

## Proyecto

- Es una web editorial de Palomares del Campo construida con Astro y TypeScript, con salida estática.
- Las noticias y los bandos editoriales viven en `src/content/` mediante Content Collections y sus esquemas en `src/content.config.ts`; no hay CMS ni backend para gestionar el contenido editorial general.
- Convex ya se usa para el estado compartido del juego y para las propuestas moderadas de «Palomareños por el mundo». No añadir otros servicios, bases de datos o superficies de autenticación general sin una decisión explícita.
- El juego dispone de modo local y modo remoto. En remoto, Convex es la autoridad de capturas, puntuación, ranking y presencia; el modo local no representa una partida compartida.
- Las propuestas de Palomareños se guardan en Convex, empiezan pendientes y solo las aprobadas forman parte de la proyección pública. No exponer datos de contacto ni crear un panel público de administración sin decisión explícita.
- Las noticias externas y los comunicados municipales son colecciones distintas y no deben mezclarse.
- Three.js es una mejora visual opcional. La navegación y la accesibilidad del menú deben funcionar aunque Three.js o WebGL fallen.

## Infraestructura decidida

- Astro genera la web estática; Vercel está documentado como plataforma de despliegue, pero la configuración remota debe verificarse antes de afirmar que un entorno está publicado.
- Convex contiene el backend existente del juego y del flujo de propuestas de Palomareños. El deployment `dev/europe-ireland` se comparte entre desarrollo local y Preview; usar solo datos de prueba.
- La carpeta `convex/` contiene funciones y esquema del backend; `convex/_generated/` se regenera con la CLI y no se edita manualmente.
- `pnpm exec convex dev` solo apunta al deployment de desarrollo; `pnpm exec convex deploy` requiere autorización explícita y nunca debe ejecutarse por accidente desde una revisión local.
- Las variables de Convex viven en archivos de entorno ignorados; no imprimirlas ni añadirlas al repositorio.
- No introducir un servidor dedicado, Supabase ni infraestructura remota adicional para este proyecto.
- No añadir nuevas bases de datos, mecanismos de autenticación ni servicios externos sin una decisión explícita para la fase correspondiente.

## Juego y estado autoritativo

- El modo local de `/juego/` puede funcionar sin persistencia; su estado y sus capturas no representan una partida compartida ni autoritativa.
- La lógica pura de geolocalización y reglas vive en `src/game/`; los adaptadores de Leaflet y del navegador viven fuera de ella.
- El cliente puede ofrecer feedback provisional, pero nunca decide una captura real.
- La identidad de jugador usa un `deviceId` aleatorio local y un nick; no introducir cuentas ni datos personales para el MVP. El cambio de nick reinicia el progreso y el ranking excluye puntuaciones cero.
- La mutation de Convex deberá validar distancia, precisión, temporada, versión de la bola y concurrencia de forma atómica e idempotente.
- El simulador de posiciones solo se renderiza con `import.meta.env.DEV` y no debe aparecer en producción.
- La geolocalización real requiere HTTPS o `localhost`; una URL HTTP de Tailnet solo permite revisar el mapa.
- No almacenar coordenadas exactas de jugadores sin una decisión explícita de privacidad.

## Mapa y datos geográficos

- El mapa del juego usa Leaflet y teselas de OpenStreetMap con atribución visible.
- Las coordenadas y radios de `src/data/game-locations.ts` son provisionales hasta revisar cada lugar físicamente.
- Antes de activar un lugar en una temporada hay que revisar acceso público, seguridad, tráfico, precisión GPS y posibles alternativas.
- No presentar datos de OpenStreetMap como ubicaciones oficiales sin esa revisión.

## Pruebas del juego y límites de E2E

- La lógica de dominio y las funciones de Convex deben conservar sus pruebas unitarias y de integración. Las pruebas E2E actuales usan el modo local o respuestas simuladas; no equivalen a validar dos jugadores contra un deployment Convex real.

## Estructura vigente (orientativa)

- `src/layouts/`: layouts compartidos de página y artículo.
- `src/components/layout/`: cabecera, pie y menú global.
- `src/components/ui/`: piezas visuales reutilizables y pequeñas.
- `src/components/about/`, `accommodations/`, `current-affairs/`, `game/`, `home/`, `layout/`, `ui/` y `world/`: componentes por superficie; comprobar el árbol real antes de crear una carpeta nueva.
- `src/scripts/`: comportamiento cliente; cada módulo debe tener una responsabilidad clara.
- `src/styles/`: tokens y estilos globales.
- `src/pages/`: rutas, composición y datos de la página; no convertirlas en almacenes de componentes o CSS global.

La estructura puede evolucionar; comprobar los archivos existentes antes de describirla o añadir nuevas convenciones.

## Responsabilidades y tamaño de archivos

- `src/pages/` compone rutas y datos; no contiene la implementación completa de componentes, del shell global ni CSS de otras rutas.
- `SiteHeader.astro` contiene la cabecera; `SideMenu.astro` contiene el DOM, estilos y accesibilidad del menú lateral.
- `GameMap.astro` compone el mapa; `GameMapCanvas.astro` contiene la superficie Leaflet y su HUD; `GameStatusPanel.astro` contiene el estado y los controles del jugador; el simulador y el ranking viven en sus componentes específicos.
- Por encima de 300 líneas de aplicación se revisa si un archivo mezcla responsabilidades; por encima de 400 se divide o se documenta por qué todavía no compensa.
- Al dividir un componente se mueven también sus estilos responsive; no dejar CSS duplicado o huérfano en la página consumidora.
- Toda refactorización estructural conserva o amplía una prueba de comportamiento y vuelve a medir el bundle si cambia la carga de cliente.

## CSS

- Usar CSS nativo con estilos scoped de Astro. La calidad no se mide por tener cero bloques `<style>` en los archivos `.astro`.
- Centralizar colores, tipografía, espacios, radios, sombras y motion tokens en `src/styles/tokens.css`.
- Mantener reset, base tipográfica, foco visible y reglas globales en `src/styles/global.css`.
- Mantener los estilos específicos junto al componente Astro que los utiliza; Astro recomienda los estilos scoped para la mayoría de componentes.
- Mantener en una página Astro el CSS de su composición exclusiva cuando siga siendo legible y no se reutilice en otras rutas.
- Extraer CSS a `src/styles/pages/` solo cuando una hoja de página grande mejore realmente la mantenibilidad; no convertir esos archivos en estilos globales accidentales.
- Una hoja externa de página debe tener un único importador claro, clases con ámbito de página y una ganancia de revisión demostrable; no introducir `@layer` sin un conflicto de cascada reproducible.
- Extraer primero patrones repetidos a componentes reutilizables, no a un CSS monolítico con selectores genéricos.
- Antes de mover CSS, clasificarlo como token/base global, componente compartido, variante de página, tema independiente o excepción de librería.
- Si un archivo supera 300 líneas de aplicación, revisar si mezcla responsabilidades; por encima de 400, dividirlo o documentar por qué todavía no compensa. Al dividirlo, mover también sus estilos responsive y sus pruebas.
- El tema oscuro de `/juego/` conserva su identidad propia y sus tokens nocturnos; no forzarlo a reutilizar la paleta clara.
- No introducir Tailwind, CSS-in-JS ni otra capa de utilidades sin decisión explícita.
- No repetir valores de diseño en varios componentes cuando puedan ser un token semántico.
- Diseñar primero para móvil y comprobar los estados de foco, teclado, `prefers-reduced-motion` y contraste.
- En cambios de UI, ejecutar también `pnpm qa:visual` cuando el servidor de desarrollo esté disponible, además de la validación general indicada abajo.
- La arquitectura CSS vigente está documentada en `docs/architecture.md` y `docs/design-system.md`; mantener esas fuentes actualizadas en lugar de crear planes paralelos.

## Menú y Three.js

- Conservar `data-menu-toggle`, `data-menu-close`, `data-menu-backdrop`, `#site-menu` y `#menu-scene` salvo que se actualicen también las pruebas y el comportamiento accesible.
- El comportamiento del menú (`src/scripts/menu.ts`) y la escena visual (`src/scripts/menu-scene.ts`) son responsabilidades separadas.
- Three.js debe cargarse de forma diferida: la escena del menú solo se solicita al abrirlo y el logo 3D de `conquense.dev` solo se inicializa cuando entra en viewport.
- Los módulos de carga inicial no deben importar ni inicializar Three.js de forma inmediata.
- El menú debe mantener apertura, cierre, `Escape`, foco, `aria-expanded`, `aria-hidden` e `inert`.
- La escena 3D nunca puede impedir que el botón del menú funcione; si WebGL o Three.js fallan, debe conservarse el fallback HTML o de imagen.

## Contenido

- Validar cada nueva colección en `src/content.config.ts`.
- Las entradas Markdown deben conservar fecha, fuente y enlace original cuando proceda.
- No inventar datos ni presentar una inferencia como hecho publicado.
- No iniciar todavía scripts de descubrimiento automático de noticias.

## TypeScript y fronteras de datos

- La configuración raíz cubre Astro, scripts y tests; `convex/tsconfig.json` es un proyecto separado. Ambos usan `strict`, `exactOptionalPropertyTypes` y `noUncheckedIndexedAccess`; ejecutar `pnpm typecheck` antes de cerrar cambios (`pnpm typecheck:astro` y `pnpm typecheck:convex` permiten diagnosticar cada frontera por separado).
- Tratar JSON, HTTP, RSS/HTML, `localStorage` y respuestas externas como `unknown`; validar su forma antes de usarlas. `JSON.parse` y `as T` no validan datos en runtime.
- Mantener las referencias y respuestas de Convex ligadas a `convex/_generated/api` y a los tipos generados; no borrar contratos mediante clientes ad hoc ni editar `convex/_generated/`.
- No usar `any` como salida fácil, aserciones `!` postfix ni supresiones para silenciar errores. ESLint aplica `no-explicit-any`, `ban-ts-comment`, `no-non-null-assertion` y reglas `no-unsafe-*`; las aserciones de fixtures solo se permiten cuando representan deliberadamente un tipo nominal de prueba.
- Con `exactOptionalPropertyTypes`, omitir claves cuyo valor sea `undefined`; permitir `?: T | undefined` solo cuando forme parte explícita del contrato.
- Con `noUncheckedIndexedAccess`, comprobar la presencia de elementos antes de leer arrays, resultados de búsqueda o claves; no añadir `!` para acallar el checker.
- Al corregir una frontera o acceso opcional, añadir una prueba focalizada para el dato válido y el caso ausente/malformado; conservar el comportamiento de los casos válidos.

## Ramas, PR y releases

- `main` es la rama de producción; `develop` es la rama de integración y Preview persistente (`develop.palomaresdelcampo.conquense.dev`). La Preview comparte `dev/europe-ireland` con el desarrollo local: usa solo datos de prueba y nunca secretos ni datos de producción.
- Trabaja cada tarea en una rama corta creada desde `develop` (`feat/`, `fix/`, `docs/`, etc.) y abre una PR hacia `develop`. No hagas push directo a `develop` ni a `main`.
- Para el trabajo interactivo de agentes, usa por defecto el worktree ya abierto en el repositorio; no crees worktrees persistentes adicionales. Crea uno temporal solo si hace falta trabajar en paralelo de verdad o una automatización del proyecto lo requiere, y nómbralo para identificar tarea y rama.
- Antes de cambiar de rama, revisa `git status --short --branch` y `git worktree list`. Una rama solo puede estar abierta en un worktree a la vez: si ya está ocupada en otra ruta, no crees otro worktree ni muevas o borres el existente por iniciativa propia; informa de la ruta y pide autorización antes de cambiar esa disposición.
- Retira un worktree temporal al terminar solo después de verificar que está limpio y que no contiene cambios del usuario; nunca uses `--force` para eliminarlo. Si tiene cambios, consérvalo y consulta antes de tocarlo.
- Para integrar en `develop`, espera a que el check requerido `Verify` pase y revisa la Preview de Vercel. No fusiones PRs ni publiques cambios sin autorización explícita del usuario.
- Promueve cambios a producción mediante una PR de `develop` a `main`. Mantén la PR acotada; espera `Verify`, obtén autorización explícita para fusionar y verifica que Vercel desplegó el commit esperado en producción. Si hay un arreglo independiente en `main`, tráelo de vuelta a `develop` mediante PR.
- Actualiza `CHANGELOG.md` en `Unreleased` con cambios relevantes para usuarios o para operar el proyecto. No cambies la versión de `package.json` en cada despliegue ni inventes versiones anteriores; crea etiquetas de versión solo para releases explícitos.
- El procedimiento completo está en [`docs/development-workflow.md`](docs/development-workflow.md).

## Comandos y verificación

Usar `pnpm` y versiones fijadas.

```bash
pnpm install --frozen-lockfile
pnpm run build
```

Antes de considerar terminado un cambio:

1. Ejecutar `pnpm format:check`, `pnpm typecheck`, `pnpm lint` y `pnpm test:coverage` cuando afecte al código o a la configuración.
2. Para cambios que afecten a rutas o interacciones, ejecutar `CI=1 pnpm test:e2e`; para cambios de UI, comprobar el navegador y ejecutar `pnpm qa:visual` cuando el servidor esté disponible.
3. Ejecutar `pnpm build`; tras el build, ejecutar `pnpm check:seo` cuando cambien páginas, contenido o metadatos.
4. Ejecutar `git diff --check`.
5. Revisar que el diff solo contiene los archivos previstos.
6. No afirmar que algo está publicado o desplegado sin comprobar el estado remoto correspondiente.

No añadir secretos, `.env`, credenciales ni artefactos generados fuera de `convex/_generated/`; tampoco `dist/`, `.astro/` ni `node_modules/` al repositorio.
