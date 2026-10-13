# Contrato actual del backend del juego con Convex

Este documento describe la integración que existe actualmente. Convex ya tiene funciones y esquema implementados; el despliegue de producción, la administración de temporadas y la autenticación fuerte de jugadores no están resueltos en este repositorio.

## Frontera con el cliente

`src/scripts/convex-game.ts` crea un `ConvexClient` cuando existe `CONVEX_URL`. El cliente:

1. consulta `api.game.getActiveSeason`;
2. se incorpora con `api.game.joinSeason`;
3. consulta el resumen del jugador y el ranking;
4. se suscribe a `api.game.getSeasonState`, `api.game.getPlayerSummary` y `api.leaderboard.getLeaderboard`;
5. envía presencia con `api.game.updatePresence`;
6. solicita capturas con `api.game.captureBall`;
7. desuscribe las tres actualizaciones y cierra el cliente al abandonar la partida.

El cliente puede evaluar distancia y precisión para mostrar feedback inmediato, pero Convex repite la validación y decide el resultado remoto.

## Identidad mínima del jugador

El navegador genera un `deviceId` aleatorio y guarda junto con él el nick en `localStorage` bajo `palomares-player-v1`. El nick se normaliza con NFKC, se recortan espacios, se limita a 24 caracteres y se compara mediante una clave en minúsculas según `es`.

Convex conserva ese `deviceId` como `players.subject`, junto al nick y el progreso necesario para el ranking. Si el mismo dispositivo cambia de nick, `joinSeason` reinicia puntuación, capturas y presencia. El ranking excluye puntuaciones cero.

Este identificador evita confusiones casuales entre dispositivos, pero no es autenticación fuerte. `joinSeason`, `updatePresence`, `getPlayerSummary` y `captureBall` reciben `deviceId` del cliente y no verifican `ctx.auth`. Solo `createSeason` llama a `ctx.auth.getUserIdentity()` y guarda su `subject` como `ownerSubject`; el código actual no usa ese propietario para una autorización posterior.

## Esquema de datos

`convex/schema.ts` define estas tablas:

- `seasons`: `slug`, `name`, `status` (`active` o `finished`), `capturePoints`, `ownerSubject` y `createdAt`. Índices `by_slug` y `by_status`.
- `locations`: ubicaciones ordenadas por temporada, con identificador público, nombre, coordenadas y radio. Índices `by_season_sort` y `by_season_location`.
- `ballState`: una ubicación activa por temporada, versión y fecha de actualización. Índice `by_season`.
- `players`: sujeto/`deviceId`, nick, score, capturas, fechas y presencia redondeada. Índices `by_season_subject` y `by_season_nickname`.
- `captures`: temporada, jugador, clave de idempotencia, huella de petición, ubicación, versión esperada, puntos, distancia, precisión opcional y fecha. Índices `by_season_idempotency` y `by_season_created`.

No existen tablas `scoreEvents`, historial de presencia, ranking diario ni cuentas de jugador.

## Queries actuales

### `game.getActiveSeason()`

Devuelve la temporada activa, la bola, el número total de jugadores y las presencias que siguen dentro del TTL. Devuelve `null` si no hay temporada activa.

### `game.getSeasonState({ seasonId })`

Devuelve el mismo estado compuesto para una temporada concreta, si la temporada y la bola existen.

### `game.getPlayerSummary({ seasonId, deviceId })`

Devuelve nick, score efectivo y número de capturas del jugador identificado por la pareja de temporada y `deviceId`, o `null`.

### `leaderboard.getLeaderboard({ seasonId })`

Calcula el score efectivo, excluye jugadores con cero puntos, ordena por score y después por capturas, y limita la respuesta a 50 entradas.

Estas queries no exigen autenticación en el código actual.

## Mutations actuales

### `game.createSeason({ slug, name, locations })`

Exige una identidad Convex autenticada, exige al menos una ubicación, valida radios positivos y evita slugs duplicados o una segunda temporada activa. Crea la temporada activa, sus ubicaciones y `ballState` con versión `0`.

No existe una mutation de cierre, edición o borrado de temporada.

### `game.joinSeason({ seasonId, deviceId, displayName })`

Comprueba que la temporada existe y está activa, normaliza el nick, evita duplicados de nick dentro de la temporada y crea o actualiza el jugador. Cambiar de nick reinicia el progreso.

### `game.updatePresence({ seasonId, deviceId, latitude, longitude })`

Comprueba la temporada, el rango de coordenadas y la existencia del jugador. Redondea latitud y longitud a cuatro decimales y actualiza `presenceAt`. La presencia se considera activa durante menos de 30 segundos; el cliente intenta renovarla cada 10 segundos.

### `game.captureBall({ seasonId, deviceId, latitude, longitude, accuracy, expectedBallVersion, idempotencyKey })`

La mutation realiza en una operación atómica los pasos siguientes:

1. comprueba temporada y jugador;
2. calcula una huella de la petición;
3. busca una captura previa con la misma clave de idempotencia;
4. lee la bola y su versión;
5. rechaza una clave reutilizada con otra huella;
6. rechaza una temporada no activa o una versión obsoleta;
7. obtiene la ubicación activa desde la base de datos;
8. calcula Haversine en `convex/geo.ts`;
9. rechaza precisión superior a 100 metros o distancia fuera del radio;
10. registra la captura;
11. suma `season.capturePoints` al jugador;
12. mueve la bola a la siguiente ubicación y aumenta la versión.

Una repetición con la misma clave y huella devuelve la captura anterior con `duplicate: true`, sin volver a sumar puntos. La interfaz genera una clave aleatoria nueva por llamada; el backend ofrece la garantía de idempotencia si el mismo consumidor reutiliza la clave.

## Estado y puntuación

`ballState.version` es el control de concurrencia de la captura. Un jugador que envía una versión antigua recibe `stale-ball` y no modifica la bola.

`convex/score.ts` calcula el score efectivo aplicando un 5 % de decaimiento por cada día completo desde `lastCaptureAt`, con mínimo cero. El decaimiento se calcula al leer; no existe un job que lo persista diariamente.

## Presencia y privacidad

La presencia se guarda temporalmente en `players` con coordenadas redondeadas. `getActiveSeason` solo devuelve las filas cuyo `presenceAt` sigue activo. La interfaz interpola la posición para suavizar el movimiento, pero la interpolación es únicamente visual.

No se guarda historial de recorridos ni una coordenada exacta histórica de cada jugador. Sí se guardan las coordenadas redondeadas de la presencia vigente y la distancia/precisión asociadas a una captura.

## Validación de autoridad

La siguiente distinción es contractual:

- **Cliente:** obtiene GPS, calcula feedback provisional, habilita o deshabilita controles, simula posiciones en desarrollo y dibuja el estado.
- **Convex:** decide si la temporada está activa, si el jugador existe, si la versión de la bola es válida, si la precisión y distancia son aceptables, cuántos puntos se suman, qué captura queda registrada y a qué ubicación se mueve la bola.

El cliente puede enviar coordenadas y precisión manipuladas. El backend comprueba las reglas con esos valores, pero no existe una prueba de que el origen físico del GPS sea auténtico.

## Limitaciones de seguridad

- No hay autenticación fuerte de jugadores; `deviceId` y nick proceden del navegador.
- `ownerSubject` se almacena al crear temporadas, pero no hay control de propietario posterior.
- Las queries del estado y ranking son públicas en el código actual.
- Un `deviceId` conocido permite intentar operar con el jugador correspondiente.
- Convex valida distancia y precisión, pero no evita spoofing de GPS.
- No hay configuración de producción ni un procedimiento de administración de temporadas en este repositorio.

Estas limitaciones deben resolverse mediante decisiones independientes antes de presentar el juego como un servicio competitivo o con cuentas reales.
