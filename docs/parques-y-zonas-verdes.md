# Parques y zonas verdes de Palomares del Campo

Revisión documental realizada el **16 de noviembre de 2026**. Es una búsqueda acotada a espacios del núcleo urbano; no equivale a una visita sobre el terreno.

## Registro institucional localizado

La capa pública de GeoEIEL «Parque y Jardín» ofrece para Palomares del Campo un punto en la fase 2024. La respuesta geográfica lo clasifica en esa capa y devuelve `geom_id=2409718`, `geom_key=2024-PJ-16-148-0001-01-001` y el punto `[longitud -2.60033216669301, latitud 39.9457706937704]`. La fuente no proporciona nombre propio, perímetro, equipamientos ni condiciones de acceso; el dato tampoco confirma por sí solo el estado actual del espacio.[1][2][17]

La misma coordenada aparece en las fases 2022 y 2023 del visor. La fase 2024 es la más reciente disponible en el selector consultado.[18][19]

El registro se conserva en esta investigación, pero no se muestra como ficha pública mientras no se identifique el espacio ni se confirme su correspondencia con la información municipal.[1][2][17]

## Candidatos de OpenStreetMap

Se consultó la API pública de OpenStreetMap en el recuadro `bbox=-2.605,39.938,-2.589,39.950`, centrado en el núcleo. El recuadro sirve para acotar la búsqueda; no es un límite administrativo ni una delimitación oficial del casco. Los centros siguientes son **aproximaciones calculadas como promedio de los vértices de cada way**, no coordenadas puntuales publicadas por OSM.[3]

| Tipo según OSM             | Objeto             | Centro aproximado (latitud, longitud) | Tags relevantes                                         | Última edición del objeto |
| -------------------------- | ------------------ | ------------------------------------: | ------------------------------------------------------- | ------------------------- |
| Parque · con nombre        | way/736748627 [4]  |              39.94357541, -2.59686890 | `leisure=park`, `name=El Jardinillo`                    | 2020-09-11                |
| Parque · sin nombre        | way/803253410 [8]  |              39.94819141, -2.59844527 | `leisure=park`                                          | 2020-05-13                |
| Parque · sin nombre        | way/804339696 [9]  |              39.94720959, -2.59922416 | `leisure=park`                                          | 2020-05-16                |
| Parque · sin nombre        | way/804566561 [10] |              39.94814491, -2.59890496 | `leisure=park`, `surface=dirt`                          | 2020-05-16                |
| Área infantil · sin nombre | way/736975877 [11] |              39.94474935, -2.59903513 | `leisure=playground`; acceso no especificado            | 2019-10-20                |
| Área infantil · sin nombre | way/738926290 [12] |              39.94536530, -2.60039145 | `leisure=playground`; acceso no especificado            | 2019-10-26                |
| Área infantil · privada    | way/736265961 [13] |              39.94453352, -2.59744783 | `leisure=playground`, `access=private`, `surface=paved` | 2019-10-17                |
| Área infantil · privada    | way/806709602 [14] |              39.94700810, -2.59807506 | `leisure=playground`, `access=private`, `surface=paved` | 2020-05-21                |
| Jardín · sin nombre        | way/738286432 [15] |              39.94327172, -2.59949545 | `leisure=garden`; acceso no especificado                | 2019-10-24                |
| Jardín · sin nombre        | way/738286441 [16] |              39.94347357, -2.59936467 | `leisure=garden`; acceso no especificado                | 2019-10-24                |

- Los diez objetos aparecen con esos tags en OSM, pero son datos colaborativos, no una confirmación municipal de titularidad o estado actual.[3]
- Los dos patios infantiles con `access=private` no se presentan como espacios para visitantes.[13][14]
- Los otros dos objetos `leisure=playground` no especifican `access`; esta página no los da por públicos.[11][12]
- Los dos objetos `leisure=garden` tampoco especifican acceso, y no se les atribuyen equipamientos.[15][16]
- La página enlaza la atribución y la licencia de los datos de OpenStreetMap.[7]

El programa municipal de fiestas de 2025 sitúa una carrera infantil de bicicletas en el «Jardinillo de las Pastoras». Es una referencia a una actividad y a un topónimo, no una ficha del parque ni una geolocalización; no basta para vincular ese nombre con el punto EIEL o con el way OSM «El Jardinillo».[5][4]

El catálogo de servicios municipales consultado no aporta una ficha identificable de parques. La omisión en ese catálogo no se toma como prueba de que no existan otros espacios.[6]

## Decisión editorial y límites

- La página pública muestra un estado de catálogo en preparación y no publica fichas de espacios aún no identificados y confirmados. El punto EIEL 2024 y los diez candidatos OSM se conservan en esta documentación como evidencia de investigación.
- No se atribuyen al punto los nombres, polígonos o patios infantiles de OSM sin una correspondencia confirmada.
- No se anuncian horario, acceso público, accesibilidad, seguridad, estado de conservación ni equipamientos: las fuentes consultadas no los verifican.
- No se ha hecho inspección presencial ni se han usado fotografías genéricas, de otros parques o generadas por IA.
- `src/data/parks.ts` mantiene separados los datos publicables de la presentación. `ParkCard.astro` admite una imagen municipal local optimizada y requiere crédito y referencia/fecha del permiso antes de incorporarla. Actualmente no se publica ninguna fotografía.

## Confirmación pendiente del Ayuntamiento

Para publicar las primeras fichas con información útil y verificable, el Ayuntamiento debe confirmar:

1. Si el punto EIEL de 2024 sigue correspondiendo a un espacio existente y cuál es su nombre de uso.
2. La ubicación reconocible y, si se puede, el perímetro real del recinto; confirmar también si el acceso es público y si hay restricciones.
3. Si el objeto OSM «El Jardinillo» (way/736748627) corresponde a un espacio verde actual y cuál es su ubicación. Confirmar por separado si guarda alguna relación con el punto EIEL o con «Jardinillo de las Pastoras»; no se presupone ninguna coincidencia.[4][5]
4. Los equipamientos existentes hoy; accesibilidad, horarios o condiciones solo si se pueden verificar.
5. Si hay otros parques, jardines o áreas recreativas dentro del núcleo y su ubicación oficial.
6. Fotografías municipales originales, con crédito/autores y autorización o licencia de publicación documentada para cada una.

## Sources

[1] https://eiel.redsara.es/visor/layer-json/fase:2024-codine:16148/capa:PJ — GeoEIEL, capa Parque y Jardín, fase 2024
[2] https://eiel.redsara.es/visor — Visor público GeoEIEL
[3] https://api.openstreetmap.org/api/0.6/map?bbox=-2.605,39.938,-2.589,39.950 — OpenStreetMap API, recuadro urbano consultado
[4] https://www.openstreetmap.org/way/736748627 — OpenStreetMap, El Jardinillo
[5] https://www.bandomovil.com/userFiles/f1/f19FWFIESTAS2025-09PALOMARESDELCAMPO.pdf — Ayuntamiento de Palomares del Campo, programa de fiestas 2025
[6] https://palomaresdelcampo.dipucuenca.es/index.php/shortcodes/catalogo-de-servicios — Catálogo de servicios municipales
[7] https://www.openstreetmap.org/copyright — OpenStreetMap, atribución y licencia
[8] https://www.openstreetmap.org/way/803253410 — OpenStreetMap way 803253410, parque sin nombre
[9] https://www.openstreetmap.org/way/804339696 — OpenStreetMap way 804339696, parque sin nombre
[10] https://www.openstreetmap.org/way/804566561 — OpenStreetMap way 804566561, parque sin nombre
[11] https://www.openstreetmap.org/way/736975877 — OpenStreetMap way 736975877, área infantil sin nombre
[12] https://www.openstreetmap.org/way/738926290 — OpenStreetMap way 738926290, área infantil sin nombre
[13] https://www.openstreetmap.org/way/736265961 — OpenStreetMap way 736265961, área infantil privada
[14] https://www.openstreetmap.org/way/806709602 — OpenStreetMap way 806709602, área infantil privada
[15] https://www.openstreetmap.org/way/738286432 — OpenStreetMap way 738286432, jardín sin nombre
[16] https://www.openstreetmap.org/way/738286441 — OpenStreetMap way 738286441, jardín sin nombre
[17] https://mptmd.gob.es/portal/politica-territorial/local/coop_econom_local_estado_fondos_europeos/eiel.html — Ministerio de Política Territorial, EIEL
[18] https://eiel.redsara.es/visor/layer-json/fase:2022-codine:16148/capa:PJ — GeoEIEL, Parque y Jardín, fase 2022
[19] https://eiel.redsara.es/visor/layer-json/fase:2023-codine:16148/capa:PJ — GeoEIEL, Parque y Jardín, fase 2023
