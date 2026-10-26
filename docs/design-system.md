# Sistema visual de Palomares del Campo

Este documento registra el lenguaje visual actual de la web. Los tokens se importan desde `src/styles/global.css`; su adopción por páginas y componentes se mantiene incremental para evitar una reescritura visual brusca.

## Colores

| Token                  | Valor actual | Uso previsto                                                     |
| ---------------------- | ------------ | ---------------------------------------------------------------- |
| `--color-ink`          | `#19342d`    | Texto principal, cabecera y superficies institucionales oscuras. |
| `--color-forest`       | `#2f6652`    | Acciones, enlaces y elementos interactivos.                      |
| `--color-muted`        | `#4a685b`    | Texto secundario, descripciones y metadatos.                     |
| `--color-paper`        | `#f4f1e9`    | Fondo general de la web.                                         |
| `--color-surface`      | `#fffdf8`    | Superficies claras y tarjetas.                                   |
| `--color-surface-soft` | `#eff5ed`    | Superficies claras suaves y texto claro sobre fondos oscuros.    |
| `--color-sage`         | `#d8e6d6`    | Fondos verdes claros de secciones.                               |
| `--color-sage-light`   | `#b7d0bc`    | Texto claro secundario sobre fondos oscuros.                     |
| `--color-clay`         | `#a05c32`    | Acento terracota decorativo y estados destacados.                |
| `--color-clay-text`    | `#914f2c`    | Texto terracota con contraste AA sobre papel y salvia.           |
| `--color-ochre`        | `#e5b77e`    | Acento cálido sobre fondos oscuros.                              |

- `--color-night` | `#0a1513` | Fondo principal del tema oscuro del juego. |
  | `--color-night-surface` | `#10231f` | Superficie oscura del tablero y tarjetas del juego. |
  | `--color-night-panel` | `#214538` | Controles y selectores sobre el tablero oscuro. |
  | `--color-night-muted` | `#8fb49c` | Etiquetas y metadatos del juego. |
  | `--color-night-text` | `#a9cbb6` | Texto secundario legible sobre el tema oscuro. |
  | `--color-night-soft` | `#d4e4d5` | Texto claro de notas y reglas del juego. |
  | `--color-night-highlight` | `#f0c995` | Estado de aviso dentro del juego. |
  | `--color-game-capture` | `#3f9b69` | Estado de captura o conexión positiva. |
  | `--color-game-map` | `#dce8dc` | Superficie cartográfica del mapa local. |
  | `--color-game-marker` | `#c68455` | Marcador secundario del mapa. |

Los componentes pueden conservar colores adicionales cuando representen un estado o una visualización específica. Esas excepciones deberán documentarse antes de convertirse en tokens nuevos.

## Tipografía

- **Inter con fallback de sistema** (`--font-sans`): interfaz, navegación, botones, filtros, metadatos y texto de lectura.
- **Georgia con fallback Times** (`--font-serif`): titulares, navegación editorial, tarjetas y bloques destacados.

Inter no está importada ni empaquetada actualmente. `src/styles/global.css` usa `--font-sans` con Inter como primera opción y fallback del sistema; antes de cambiar la estrategia de entrega de fuentes habrá que tomar una decisión independiente.

## Pesos y escala

- `--font-weight-regular`: 400, texto normal.
- `--font-weight-medium`: 500, titulares serif y énfasis moderado.
- `--font-weight-bold`: 700, controles y navegación.
- `--font-weight-strong`: 750, etiquetas y encabezados de grupos.
- `--font-weight-emphasis`: 800, controles y datos destacados del juego.
- `--font-weight-display`: 850, displays principales del juego.
- `--font-size-body`: 1rem, tamaño base.
- `--font-size-small`: 0.85rem, información secundaria.
- `--font-size-label`: 0.7rem, etiquetas en mayúsculas.
- `--font-size-display`: escala fluida para titulares principales.
- `--font-size-page-title`: escala fluida de títulos interiores y artículos, con máximo de 4.5rem. La portada conserva su escala propia: hasta 6rem en escritorio y 6.5rem en móvil.
- `--font-size-section-heading`: escala común de encabezados de sección, con máximo de 3.75rem.
- `--spacing-section-y`: ritmo vertical fluido para secciones, con máximo de 5.5rem.

Los tokens de ritmo (`--line-height-body`, `--line-height-heading`, `--tracking-label` y `--tracking-heading`) describen las proporciones actuales y se migrarán junto con cada superficie, no mediante una reescritura global brusca.

## Componentes Hero

- `EditorialHero.astro` comparte el patrón de una columna con slots para antetítulo, H1, introducción, aviso y acciones. Usa superficies `paper` o `sage`, un acento lineal y la escala secundaria común; `paper-compact` conserva el fondo papel y reduce el espaciado vertical. `fullHeight` se reserva a estados vacíos que necesiten ocupar parte de la ventana.
- `SplitHero.astro` comparte la retícula de dos columnas con slots `copy` y `visual`. `heritage` usa salvia clara y escala interior; `game` conserva la composición y el tema oscuro de la partida.
- Las páginas conservan textos y datos; las excepciones de ancho de título o introducción se expresan con modificadores tipados, no con selectores globales ni CSS repetido.

## Jerarquía de portada e interiores

- `/` es la portada visual: `HomeHero` conserva en exclusiva el gran display serif sobre fondo oscuro, la fotografía protagonista y su marco cálido. No reutilizar esa composición en páginas interiores.
- Las páginas interiores comparten tipografía, antetítulos, acento terracota y superficies de papel/salvia, pero abren con títulos de hasta `4.5rem` y composición más contenida. El objetivo es reconocer la misma publicación sin crear varias portadas competidoras.
- Los fondos oscuros siguen disponibles para contenido que lo justifique —por ejemplo, bloques destacados o el tema independiente de `/juego/`—, no como hero editorial por defecto.
- Para etiquetas pequeñas en superficies claras, usar `--color-clay-text`; reservar `--color-clay` para acentos no textuales o combinaciones con contraste suficiente. En salvia muy pálida, usar `--color-ink`.
- Agenda mantiene sus filtros y resultados agrupados en su propia superficie salvia; solo su masthead se comparte con las páginas editoriales.

## Botones y enlaces

- Usa enlaces (`<a>`) para navegar a una URL, y botones (`<button>`) para ejecutar acciones; no conviertas uno en el otro solo por su apariencia.
- `SiteButton` ofrece variantes primaria/secundaria y `ActionLink` con variante `solid` usa la primaria; ambos comparten `ui-control`, con alto/ancho mínimos de 2,75 rem, foco visible, hover y `prefers-reduced-motion`. Los botones añaden estado deshabilitado. El tamaño elegido apunta a un objetivo táctil cómodo de 44 px; WCAG 2.2 AA fija 24 × 24 CSS px como mínimo general con excepciones, no 44 px como requisito universal.
- `SiteButton` exige `type` (`button`, `submit` o `reset`) para evitar envíos accidentales. `Button.astro` se reserva al tema oscuro del juego y conserva sus variantes de partida.
- Los enlaces externos usan el contexto actual por defecto. `ExternalLink newTab` es optativo; cuando se activa, el componente añade `target="_blank"`, `rel="noopener noreferrer"` y anuncia “se abre en una pestaña nueva” de forma accesible. Evitar nuevas pestañas inesperadas es el valor predeterminado.
- Mantener enlaces inline, de navegación, de fuentes y de tarjetas con sus tratamientos editoriales cuando su contrato visual sea diferente; no forzar cada `<a>` a convertirse en botón.

Estas decisiones siguen la semántica HTML de [MDN para enlaces](https://developer.mozilla.org/es/docs/Web/HTML/Reference/Elements/a), la recomendación de [GOV.UK de evitar pestañas nuevas y anunciarlas si se necesitan](https://design-system.service.gov.uk/styles/links/), los criterios WCAG de [foco visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible) y [tamaño mínimo de objetivo](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum), y el uso de texto de acción en sentence case recomendado por [GOV.UK para botones](https://design-system.service.gov.uk/components/button/).

## QA visual y excepciones

La comprobación reproducible se ejecuta con `pnpm qa:visual` mientras el servidor Astro esté disponible. Recorre 19 rutas por defecto en escritorio (`1440×900`) y móvil (`375×812`), incluidos los patrones Hero editoriales, divididos, de agenda y legales, el directorio de alojamientos, el formulario del mapa mundial y un bando con URL larga. Verifica HTTP 200, ausencia de overflow horizontal, focus visible, contraste aproximado WCAG y errores de consola.

Se conservan dos familias de excepciones documentadas:

- `src/styles/pages/sobre-el-pueblo.css` mantiene dos superficies cálidas/verde oscuro ajustadas a sus fotografías (`#315f4e` y `#efe6d6`); no son colores de interfaz compartidos.
- `src/scripts/route-map.ts` y `src/scripts/game-map.ts` mantienen valores hexadecimales para las opciones de color de Leaflet creadas en JavaScript. Son valores de una API de visualización y reflejan tokens ya definidos; no son declaraciones CSS independientes.

## Reglas de evolución

1. Preferir nombres semánticos (`--color-ink`) frente a nombres basados en apariencia (`--dark-green`).
2. No introducir un color nuevo para resolver una sola página sin comprobar si es un estado, una excepción o una necesidad compartida.
3. Mantener la pareja sans-serif/serif mientras no exista una decisión explícita para cambiarla.
4. Revisar contraste y focus visible cuando un token se aplique a controles o texto pequeño.
5. Migrar página a página y validar escritorio y móvil antes de eliminar los valores literales antiguos.
6. Ejecutar `pnpm check:css:architecture` antes de cerrar un cambio de estilos; las excepciones deben quedar documentadas.
7. Consultar `docs/css-architecture-inventory.md` antes de extraer CSS o crear una nueva abstracción.
8. Mantener el CSS exclusivo de una composición en su `<style>` scoped; usar `src/styles/pages/` solo para una hoja de página grande con importador único y responsabilidad documentada. No introducir `@layer` sin conflicto de cascada reproducible.
