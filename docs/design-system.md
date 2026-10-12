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
| `--color-surface-soft` | `#eff5ed`    | Texto claro o superficies suaves sobre fondos oscuros.           |
| `--color-sage`         | `#d8e6d6`    | Fondos verdes claros de secciones.                               |
| `--color-sage-light`   | `#b7d0bc`    | Texto claro secundario sobre fondos oscuros.                     |
| `--color-clay`         | `#a05c32`    | Acento terracota, etiquetas y estados destacados.                |
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

Los tokens de ritmo (`--line-height-body`, `--line-height-heading`, `--tracking-label` y `--tracking-heading`) describen las proporciones actuales y se migrarán junto con cada superficie, no mediante una reescritura global brusca.

## QA visual y excepciones

La comprobación reproducible se ejecuta con `pnpm qa:visual` mientras el servidor Astro esté disponible. Recorre nueve rutas en escritorio (`1440×900`) y móvil (`375×812`) y verifica HTTP 200, ausencia de overflow horizontal, focus visible, contraste aproximado WCAG y errores de consola.

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
