# Ruta cartográfica provisional de Palomares del Campo

## Estado y alcance

El archivo `public/routes/campos-palomares-osm-provisional.gpx` contiene una **ruta planificada** (`<rte>`) a partir de geometrías de OpenStreetMap. No es una grabación GPS, no es una ruta municipal oficial ni homologada y no ha sido recorrida ni inspeccionada sobre el terreno. No se confirma titularidad, derecho de paso, acceso peatonal, firme, seguridad ni continuidad física. **No debe recomendarse ni seguirse hasta que el Ayuntamiento confirme los caminos y se haga una inspección presencial.**

La página omite distancia, duración, dificultad, desnivel y accesibilidad como datos para visitantes. La longitud geométrica calculada de la polilínea es aproximadamente 1.474,8 m; es una comprobación interna de la línea cartográfica, no una distancia caminable.

## Fuente y geometría

Datos cartográficos consultados en OpenStreetMap el 15 de noviembre de 2026. El circuito usa únicamente nodos consecutivos de estos seis ways OSM:

- [660170707](https://www.openstreetmap.org/way/660170707) — `highway=track`
- [660170712](https://www.openstreetmap.org/way/660170712) — `highway=track`
- [178879058](https://www.openstreetmap.org/way/178879058) — `highway=track`, `surface=compacted`, `tracktype=grade2`
- [660170709](https://www.openstreetmap.org/way/660170709) — `highway=track`, `surface=compacted`
- [660170708](https://www.openstreetmap.org/way/660170708) — `highway=track`, `surface=compacted`
- [660170704](https://www.openstreetmap.org/way/660170704) — `highway=track`

La geometría se comprobó por IDs de nodos: 42 puntos GPX, 41 nodos únicos y cierre exacto entre el primero y el último. Cada par de puntos consecutivos corresponde a nodos adyacentes de uno de esos ways en el extracto utilizado. La longitud se calculó sumando distancias geodésicas Haversine entre nodos; no se utilizó un servicio de enrutamiento para inventar conexiones.

En los seis ways no aparecen etiquetas `access`, `foot`, `vehicle` ni `motor_vehicle`. Esa ausencia **no** prueba ni permiso público ni prohibición. En los datos cercanos aparece un área `tourism=picnic_site` etiquetada `access=yes` y un `leisure=bandstand`; ninguno forma parte del circuito, ni se ha comprobado su estado, acceso físico o conexión con la línea. La página los menciona solo como elementos cartografiados próximos.

No se incorporó geometría de rutas GPX de terceros.

## Licencias y atribución

- Los datos de OpenStreetMap se publican bajo **ODbL 1.0**. La polilínea derivada se ofrece también bajo ODbL 1.0 como criterio conservador. La página y el GPX atribuyen a OpenStreetMap contributors y enlazan a su información de copyright/licencia: [copyright de OpenStreetMap](https://www.openstreetmap.org/copyright) y [texto ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/).
- Leaflet es software bajo **BSD 2-Clause**; se conserva la licencia de la dependencia. Esa licencia no concede derechos sobre datos OSM ni sobre el servicio de teselas: [licencia de Leaflet](https://github.com/Leaflet/Leaflet/blob/main/LICENSE).
- El mapa usa el endpoint canónico `https://tile.openstreetmap.org/{z}/{x}/{y}.png` y muestra atribución enlazada. Se siguen las condiciones del servicio público de teselas: uso interactivo normal, sin descarga masiva, precarga ni almacenamiento offline: [OSMF Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/).
- El GPX declara la versión 1.1, autoría de la compilación provisional, procedencia OSM, ways fuente y licencia ODbL en sus metadatos, conforme al [esquema GPX 1.1](https://www.topografix.com/gpx/1/1/). Sus puntos son `rtept` porque representan una ruta planificada, no un track grabado.

## Validación técnica y pendientes

- El GPX se validó contra el esquema oficial GPX 1.1 y se comprobó que los 42 `rtept` coinciden exactamente con los nodos OSM del circuito, con extremos cerrados y sin saltos entre ways.
- La prueba E2E verifica que Leaflet y el enlace de descarga usan el mismo archivo, que este se descarga como GPX, que la polilínea se renderiza y que la geometría está cerrada.
- Pendiente antes de cualquier recomendación para visitantes: confirmación municipal del inventario y acceso de cada camino; inspección completa de cancelas, firme, continuidad física, cruces, tráfico, seguridad, estacionalidad y condiciones de los elementos cercanos.
