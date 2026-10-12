# Inventario de arquitectura CSS

Fecha de referencia: 2026-10-12 20:15 CEST.

Este inventario comenzó en la Fase 1 y se actualiza con las decisiones de refactorización posteriores. Describe responsabilidades; no ordena eliminar todos los bloques `<style>`.

## Resumen

- 10 páginas Astro contienen un bloque `<style>` scoped.
- 20 componentes Astro contienen un bloque `<style>` scoped.
- Hay una hoja CSS externa específica de página: `src/styles/pages/sobre-el-pueblo.css`.
- Los estilos compartidos de layout, UI, archivo y tarjetas permanecen junto a sus componentes porque Astro los encapsula.
- La Fase 2 extrajo responsabilidades independientes del juego y la tarjeta de alojamiento repetida sin crear una hoja global monolítica.
- `/juego/` mantiene un tema independiente y no debe mezclarse con la paleta clara general.

## Páginas

| Archivo                                | Clasificación                 | Decisión de Fase 1                                                                                             |
| -------------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `src/pages/index.astro`                | Composición de portada        | Mantener local mientras la composición sea exclusiva; revisar sus secciones antes de extraer CSS.              |
| `src/pages/agenda/index.astro`         | Composición editorial         | Mantener local; extraer solo patrones que aparezcan en otras rutas.                                            |
| `src/pages/bandos/index.astro`         | Composición de archivo        | Mantener local; compartir comportamiento mediante componentes existentes.                                      |
| `src/pages/bandos/[slug].astro`        | Detalle editorial             | Mantener local; no mezclarlo con la ficha de noticias.                                                         |
| `src/pages/noticias/index.astro`       | Composición de archivo        | Mantener local; compartir solo patrones reales con bandos.                                                     |
| `src/pages/noticias/[slug].astro`      | Detalle editorial             | Mantener local; conservar la diferencia entre noticia y bando.                                                 |
| `src/pages/informacion-practica.astro` | Página informativa grande     | Revisar responsabilidades y posibles secciones; no mover CSS por obligación.                                   |
| `src/pages/rutas/index.astro`          | Página de rutas grande        | Revisar composición de metadatos, mapa y limitaciones; mantener el mapa aislado.                               |
| `src/pages/alojamientos/index.astro`   | Directorio informativo grande | Compone la página y la rejilla; las tarjetas viven en `src/components/accommodations/AccommodationCard.astro`. |
| `src/pages/juego/index.astro`          | Tema independiente del juego  | Mantener local y oscuro; no migrar a la paleta clara.                                                          |

`src/pages/sobre-el-pueblo.astro` no tiene un bloque `<style>` propio: importa la hoja específica `src/styles/pages/sobre-el-pueblo.css`.

## Componentes compartidos

| Archivo                                                         | Clasificación      | Decisión de Fase 1                                                               |
| --------------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------- |
| `src/components/layout/SiteHeader.astro`                        | Shell global       | Mantener scoped junto a la cabecera y su comportamiento sticky.                  |
| `src/components/layout/SideMenu.astro`                          | Shell global       | Mantener scoped junto al DOM, accesibilidad y estados del menú.                  |
| `src/components/layout/SiteFooter.astro`                        | Shell global       | Mantener scoped; revisar tamaño en la Fase 2 antes de separar responsabilidades. |
| `src/components/layout/ConquenseCredit.astro`                   | Shell global       | Mantener scoped junto a su fallback y carga visual.                              |
| `src/components/ui/Button.astro`                                | UI reutilizable    | Mantener scoped; nuevos estados deben consumir tokens.                           |
| `src/components/ui/ActionLink.astro`                            | UI reutilizable    | Mantener scoped; no fusionarlo con enlaces externos sin contrato común.          |
| `src/components/ui/ExternalLink.astro`                          | UI reutilizable    | Mantener scoped y conservar seguridad/atribución.                                |
| `src/components/CollectionSearch.astro`                         | Control compartido | Mantener scoped; lo comparte más de un archivo de colección.                     |
| `src/components/CollectionArchive.astro`                        | Archivo compartido | Mantener scoped; conserva filtros y estados vacíos de las colecciones.           |
| `src/components/BandoCard.astro`                                | Tarjeta editorial  | Mantener separado de `NewsCard.astro`; los dominios no se mezclan.               |
| `src/components/NewsCard.astro`                                 | Tarjeta editorial  | Mantener separado de `BandoCard.astro`; revisar patrones comunes en Fase 3.      |
| `src/components/NewsSection.astro`                              | Sección editorial  | Mantener scoped; candidato a revisar si aparece un segundo consumidor.           |
| `src/components/current-affairs/CurrentAffairsEmptyState.astro` | Estado editorial   | Mantener scoped; extraer solo si aparece en varias colecciones.                  |

## Componentes específicos de página

| Archivo                                                 | Clasificación                | Decisión de Fase 1                                                               |
| ------------------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------- |
| `src/components/home/HomeAudienceCards.astro`           | Sección exclusiva de portada | Mantener junto a la sección; extraer patrones solo con reutilización real.       |
| `src/components/home/HomeEditorialGuide.astro`          | Sección exclusiva de portada | Mantener junto a la sección y conservar su jerarquía editorial.                  |
| `src/components/about/HeritageCard.astro`               | Tarjeta de patrimonio        | Mantener scoped; no crear una tarjeta genérica sin segundo consumidor.           |
| `src/components/accommodations/AccommodationCard.astro` | Tarjeta de alojamiento       | Mantener scoped; expone la variante oscura de alrededores sin duplicar la ficha. |

## Tema independiente del juego

| Archivo                                              | Clasificación                | Decisión de Fase 1                                                                                       |
| ---------------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| `src/components/game/GameMap.astro`                  | Composición del mapa         | Mantener el layout, encabezado y modo inmersivo; delegar la superficie del mapa a `GameMapCanvas.astro`. |
| `src/components/game/GameMapCanvas.astro`            | Superficie del mapa y HUD    | Mantener junto al script Leaflet, atribución, marcadores y responsive del mapa.                          |
| `src/components/game/GameStatusPanel.astro`          | Estado y controles del juego | Mantener el panel de jugador; delegar el simulador de desarrollo y el ranking.                           |
| `src/components/game/GameDevelopmentSimulator.astro` | Herramienta de desarrollo    | Renderizar solo en desarrollo y conservar sus selectores `data-game-*`.                                  |
| `src/components/game/GameRanking.astro`              | Ranking de la partida        | Mantener el marcado y estilos del ranking; los adaptadores siguen actualizando sus selectores globales.  |
| `src/components/game/GameRules.astro`                | Reglas del juego             | Mantener scoped y usar tokens nocturnos.                                                                 |
| `src/components/game/GamePrivacyNotice.astro`        | Privacidad del juego         | Mantener scoped y conservar su contenido explícito.                                                      |

## Hoja CSS específica de página

| Archivo                                | Clasificación                | Decisión de Fase 1                                                                                  |
| -------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------- |
| `src/styles/pages/sobre-el-pueblo.css` | Variante exclusiva de página | Mantener externa porque ya tiene una responsabilidad de página clara; no convertirla en CSS global. |

## Patrones repetidos detectados

Estos patrones merecen revisión posterior, pero no se extraen automáticamente en esta fase:

- combinaciones de titular serif y peso medio en páginas y tarjetas;
- bordes y sombras translúcidos de tarjetas editoriales;
- cabeceras de sección, metadatos y bloques de archivo;
- restricciones de ancho, separación vertical y rejillas en páginas informativas;
- estados nocturnos, bordes y halos del juego.

La Fase 2 materializó tres responsabilidades independientes: `GameMapCanvas` agrupa el mapa interactivo y su HUD, `GameRanking` separa el ranking del panel de jugador y `GameDevelopmentSimulator` aísla la herramienta exclusiva de desarrollo. `AccommodationCard` elimina la duplicación de las fichas locales y cercanas mediante una variante explícita. `rutas/index.astro`, `informacion-practica.astro` y `SiteFooter.astro` se mantienen cohesionados: sus secciones son composiciones únicas y no tienen un segundo consumidor claro.

La repetición de una declaración no basta para crear una abstracción. En la Fase 3 solo se extraerán patrones que tengan más de un consumidor con la misma semántica y estados compatibles.

## Excepciones confirmadas

- `src/scripts/route-map.ts` y `src/scripts/game-map.ts` conservan colores hexadecimales porque son opciones de las APIs de Leaflet.
- `src/styles/pages/sobre-el-pueblo.css` conserva dos colores cálidos ligados a su composición fotográfica y documentados en `docs/design-system.md`.
- Las funciones `rgb()` con transparencia se conservan donde representan bordes, sombras, overlays o gradientes específicos; no deben proliferar sin una decisión documentada.

## Guardia para cambios futuros

`pnpm check:css:architecture` inspecciona las líneas nuevas de `src/` y rechaza, salvo tokens o excepciones aprobadas:

- colores hexadecimales o funciones de color nuevos;
- familias tipográficas literales;
- pesos tipográficos numéricos sin token semántico.

El guardia controla deuda nueva, no pretende fingir que la deuda histórica no existe. Las excepciones deben ser pequeñas, explícitas y reflejar una API externa o una variante visual justificada.
