# Mapa del juego

La ruta `/juego/` ofrece una experiencia geolocalizada con dos modos:

- **modo local**, disponible sin `CONVEX_URL`, con estado en memoria y simulador de desarrollo;
- **modo remoto**, disponible cuando `CONVEX_URL` apunta a un deployment Convex con una temporada activa.

## Superficie actual

La página incluye:

- mapa interactivo Leaflet;
- teselas de OpenStreetMap con atribución visible;
- seis ubicaciones estáticas de referencia en `src/data/game-locations.ts`;
- geolocalización del dispositivo mediante `watchPosition`;
- cálculo local de distancia y precisión;
- botones de comprobación y captura;
- ranking y presencia de jugadores en modo remoto;
- modo inmersivo del mapa;
- simulador de desarrollo con escenarios exacto, límite, fuera de radio y precisión insuficiente.

La lógica pura de distancia, precisión, puntuación local y siguiente ubicación vive en `src/game/`. Leaflet, geolocalización, Convex y la representación del estado viven en `src/scripts/game-map.ts` y `src/scripts/convex-game.ts`.

## Modo local

Sin `CONVEX_URL`, `createInitialGameState()` empieza en `Plaza del Coso`, con cero puntos y cero capturas. Una captura válida mediante `captureLocation()` suma 10 puntos y mueve la bola a la siguiente ubicación del array.

El score y la ubicación activa solo viven en memoria: al recargar se vuelve a la primera ubicación y se pierden las capturas locales. El nick y el `deviceId` se conservan por separado en `localStorage`, pero no convierten la partida local en persistente.

El simulador solo se renderiza cuando `import.meta.env.DEV` es verdadero; no forma parte de una build de producción.

## Modo remoto

Con `CONVEX_URL`, el navegador usa `ConvexClient` para:

- consultar la temporada activa;
- incorporarse mediante `joinSeason`;
- recibir estado de bola, resumen de jugador y ranking mediante suscripciones reactivas;
- publicar presencia cada 10 segundos;
- solicitar capturas autoritativas con versión esperada e idempotencia.

Convex valida la temporada, jugador, precisión, distancia, versión de la bola y puntuación. La comprobación local solo proporciona feedback y habilita controles.

El modo remoto necesita una temporada activa creada mediante `createSeason`. El repositorio no contiene una interfaz administrativa ni un flujo de autenticación para aprovisionarla.

## Presencia y privacidad

La presencia remota se redondea a cuatro decimales y caduca después de 30 segundos sin heartbeat. Convex conserva temporalmente esas coordenadas redondeadas en la fila del jugador y las devuelve a los lectores de `getActiveSeason`; no existe historial de recorridos.

El cliente interpola las posiciones remotas durante la animación, pero esa interpolación es visual y no modifica el estado autoritativo.

El `deviceId` es generado por el navegador y no equivale a autenticación fuerte. Las coordenadas y la precisión de una captura también llegan desde el cliente; el backend valida sus valores, pero no puede demostrar que el GPS no haya sido manipulado.

## Ubicaciones y fuente cartográfica

Las seis ubicaciones y sus radios son provisionales y se mantienen en `src/data/game-locations.ts`. Sus coordenadas proceden de geometrías cartografiadas en OpenStreetMap y deben revisarse físicamente antes de activar una temporada pública, comprobando acceso, seguridad, tráfico, precisión GPS y alternativas.

Existe una limitación adicional del adaptador actual: el estado remoto de Convex devuelve la ubicación de su propia temporada, pero `game-map.ts` resuelve el nombre, radio y descripción contra el array estático `gameLocations`. Una temporada remota con ubicaciones distintas puede mostrar feedback local incorrecto aunque la validación del servidor siga usando sus propios datos.

La geolocalización del navegador requiere `https://` o `localhost`. Una URL HTTP accesible por Tailnet puede mostrar el mapa, pero no permite obtener la posición del dispositivo.

## Validación y errores

El navegador puede devolver estados como precisión insuficiente, posición fuera del radio o falta de posición. Convex puede devolver `stale-ball`, `low-accuracy`, `outside-radius`, `player-not-found`, `game-not-active` y otros estados de operación. Algunos errores de conexión se muestran de forma genérica en la interfaz y los fallos de presencia se dejan caducar mediante el TTL.

El mapa de juego depende de las teselas externas de OpenStreetMap y no implementa una caché propia. La cartografía puede dejar de estar disponible aunque el resto de la página siga cargando.

## Fuentes

OpenStreetMap publica sus datos bajo la licencia ODbL; la interfaz mantiene la atribución requerida. La selección de lugares, sus nombres y sus radios son configuración provisional del prototipo, no una declaración de ubicaciones oficiales del municipio.
