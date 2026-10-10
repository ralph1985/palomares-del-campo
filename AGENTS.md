# Instrucciones para agentes de código

Estas reglas se aplican a todo el repositorio. La arquitectura explicada está en [`docs/architecture.md`](docs/architecture.md); este archivo contiene las reglas operativas que deben seguirse en cada cambio.

## Proyecto

- Es una web editorial de Palomares del Campo construida con Astro y TypeScript.
- Astro genera el sitio estático. No introducir backend, base de datos, CMS, autenticación ni automatización de descubrimiento de noticias sin una decisión explícita.
- `/juego/` puede contener un prototipo local sin persistencia; Convex queda reservado para la fase posterior de estado compartido, usuarios y ranking real.
- El contenido editorial vive en `src/content/` mediante Content Collections y sus esquemas en `src/content.config.ts`.
- Las noticias externas y los futuros comunicados municipales son contenidos distintos y no deben mezclarse.
- Three.js es una mejora visual opcional. La navegación y la accesibilidad del menú deben funcionar aunque Three.js o WebGL fallen.

## Estructura prevista

- `src/layouts/`: layouts compartidos de página y artículo.
- `src/components/layout/`: cabecera, pie y menú global.
- `src/components/ui/`: piezas visuales reutilizables y pequeñas.
- `src/components/sections/`: secciones de páginas.
- `src/components/news/`: componentes específicos de noticias.
- `src/scripts/`: comportamiento cliente; las escenas Three.js deben vivir en `src/scripts/scenes/`.
- `src/styles/`: tokens y estilos globales.
- `src/pages/`: rutas, composición y datos de la página; no convertirlas en almacenes de componentes o CSS global.

Si una carpeta aún no existe, créala solo cuando el primer cambio que la necesita esté justificado.

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
- El comportamiento del menú y la inicialización de Three.js son responsabilidades separadas.
- El menú debe mantener apertura, cierre, `Escape`, foco, `aria-expanded`, `aria-hidden` e `inert`.
- La escena 3D nunca puede impedir que el botón del menú funcione.

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

No añadir secretos, `.env`, credenciales, artefactos generados, `dist/`, `.astro/` ni `node_modules/` al repositorio.
