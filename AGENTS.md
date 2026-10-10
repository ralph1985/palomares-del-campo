# Instrucciones para agentes de código

Estas reglas se aplican a todo el repositorio. La arquitectura explicada está en [`docs/architecture.md`](docs/architecture.md); este archivo contiene las reglas operativas que deben seguirse en cada cambio.

## Proyecto

- Es una web editorial de Palomares del Campo construida con Astro y TypeScript.
- Astro genera el sitio estático. No introducir backend, base de datos, CMS, autenticación ni automatización de descubrimiento de noticias sin una decisión explícita.
- `/juego/` puede contener un prototipo local sin persistencia; Convex queda reservado para la fase posterior de estado compartido, usuarios y ranking real.
- El contenido editorial vive en `src/content/` mediante Content Collections y sus esquemas en `src/content.config.ts`.
- Las noticias externas y los futuros comunicados municipales son contenidos distintos y no deben mezclarse.
- Three.js es una mejora visual opcional. La navegación y la accesibilidad del menú deben funcionar aunque Three.js o WebGL fallen.

## Infraestructura decidida

- Astro genera la web estática y su despliegue previsto es Vercel.
- El juego tendrá un backend Convex independiente cuando necesite usuarios, ranking, persistencia o sincronización.
- La carpeta `convex/` contiene funciones y esquema del backend; `convex/_generated/` se regenera con la CLI y no se edita manualmente.
- `pnpm exec convex dev` solo apunta al deployment de desarrollo; `pnpm exec convex deploy` requiere autorización explícita y nunca debe ejecutarse por accidente desde una revisión local.
- Las variables de Convex viven en archivos de entorno ignorados; no imprimirlas ni añadirlas al repositorio.
- No introducir un servidor dedicado ni Supabase para este proyecto.
- No añadir backend, base de datos, autenticación o infraestructura remota sin una decisión explícita para la fase correspondiente.

## Juego y estado autoritativo

- El prototipo local de `/juego/` puede funcionar sin persistencia; su estado y sus capturas no representan una partida real.
- La lógica pura de geolocalización y reglas vive en `src/game/`; los adaptadores de Leaflet y del navegador viven fuera de ella.
- El cliente puede ofrecer feedback provisional, pero nunca decide una captura real.
- La futura mutation de Convex deberá validar distancia, precisión, temporada, versión de la bola y concurrencia de forma atómica e idempotente.
- El simulador de posiciones solo se renderiza con `import.meta.env.DEV` y no debe aparecer en producción.
- La geolocalización real requiere HTTPS o `localhost`; una URL HTTP de Tailnet solo permite revisar el mapa.
- No almacenar coordenadas exactas de jugadores sin una decisión explícita de privacidad.

## Mapa y datos geográficos

- El mapa del juego usa Leaflet y teselas de OpenStreetMap con atribución visible.
- Las coordenadas y radios de `src/data/game-locations.ts` son provisionales hasta revisar cada lugar físicamente.
- Antes de activar un lugar en una temporada hay que revisar acceso público, seguridad, tráfico, precisión GPS y posibles alternativas.
- No presentar datos de OpenStreetMap como ubicaciones oficiales sin esa revisión.

## Pruebas previstas del juego

Cuando se incorpore la infraestructura real, cubrir como mínimo la distancia y las reglas con tests unitarios, la mutation de captura y sus carreras con tests de integración, y el flujo de dos jugadores con contextos de navegador independientes en E2E.

## Estructura prevista

- `src/layouts/`: layouts compartidos de página y artículo.
- `src/components/layout/`: cabecera, pie y menú global.
- `src/components/ui/`: piezas visuales reutilizables y pequeñas.
- `src/components/sections/`: secciones de páginas.
- `src/components/news/`: componentes específicos de noticias.
- `src/scripts/`: comportamiento cliente; cada módulo debe tener una responsabilidad clara.
- `src/styles/`: tokens y estilos globales.
- `src/pages/`: rutas, composición y datos de la página; no convertirlas en almacenes de componentes o CSS global.

Si una carpeta aún no existe, créala solo cuando el primer cambio que la necesita esté justificado.

## Responsabilidades y tamaño de archivos

- `src/pages/` compone rutas y datos; no contiene la implementación completa de componentes, del shell global ni CSS de otras rutas.
- `SiteHeader.astro` contiene la cabecera; `SideMenu.astro` contiene el DOM, estilos y accesibilidad del menú lateral.
- `GameMap.astro` compone el mapa; `GameStatusPanel.astro` contiene estado, controles, simulador y ranking provisional.
- Por encima de 300 líneas de aplicación se revisa si un archivo mezcla responsabilidades; por encima de 400 se divide o se documenta por qué todavía no compensa.
- Al dividir un componente se mueven también sus estilos responsive; no dejar CSS duplicado o huérfano en la página consumidora.
- Toda refactorización estructural conserva o amplía una prueba de comportamiento y vuelve a medir el bundle si cambia la carga de cliente.

## CSS

- Usar CSS nativo con estilos scoped de Astro.
- Centralizar colores, tipografía, espacios, radios, sombras y motion tokens en `src/styles/tokens.css`.
- Mantener reset, base tipográfica, foco visible y reglas globales en `src/styles/global.css`.
- Mantener los estilos específicos junto al componente Astro que los utiliza.
- No introducir Tailwind, CSS-in-JS ni otra capa de utilidades sin decisión explícita.
- No repetir valores de diseño en varios componentes cuando puedan ser un token semántico.
- Diseñar primero para móvil y comprobar los estados de foco, teclado, `prefers-reduced-motion` y contraste.

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

## Comandos y verificación

Usar `pnpm` y versiones fijadas.

```bash
pnpm install --frozen-lockfile
pnpm run build
```

Antes de considerar terminado un cambio:

1. Ejecutar el build.
2. Verificar la ruta o interacción afectada en el navegador cuando sea UI.
3. Ejecutar `git diff --check`.
4. Revisar que el diff solo contiene los archivos previstos.
5. No afirmar que algo está publicado o desplegado sin comprobar el estado remoto correspondiente.

No añadir secretos, `.env`, credenciales ni artefactos generados fuera de `convex/_generated/`; tampoco `dist/`, `.astro/` ni `node_modules/` al repositorio.
