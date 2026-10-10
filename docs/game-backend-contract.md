# Contrato del backend del juego con Convex

Este documento define la frontera que conserva la integración. Convex ya está desplegado en el proyecto de desarrollo; todavía no hay despliegue de producción ni integración con la interfaz.

## Estado autoritativo

Convex será la autoridad para la temporada activa, la bola, las capturas, los jugadores y la puntuación. El navegador solo mostrará estado y solicitará acciones.

La captura no debe implementarse como una secuencia cliente de leer, comprobar y escribir. Debe ser una única mutation atómica:

```text
captureBall({
  playerId,
  latitude,
  longitude,
  accuracy,
  expectedBallVersion,
  idempotencyKey,
})
```

La mutation tendrá que:

1. comprobar que la temporada está activa;
2. validar la identidad del jugador;
3. leer la bola y bloquear lógicamente su versión;
4. calcular la distancia en el backend;
5. rechazar una precisión insuficiente;
6. rechazar una versión obsoleta;
7. registrar una captura única;
8. sumar puntos;
9. mover la bola;
10. incrementar la versión y devolver el nuevo estado.

## Queries previstas

```text
getActiveSeason()
getBallState()
getLeaderboard({ scope: 'season' | 'daily' })
getRecentCaptures()
getPlayerSummary({ playerId })
```

Las queries deberán devolver solo los datos necesarios para la interfaz. No se expondrá la coordenada exacta del jugador después de validar la captura.

## Datos previstos

- `seasons`: temporadas y ciclo de vida.
- `locations`: lugares, radios, estado y metadatos.
- `ballState`: ubicación activa y versión.
- `players`: identidad pública y estado de puntuación.
- `captures`: historial inmutable de capturas.
- `scoreEvents`: capturas, decaimiento y ajustes administrativos.

## Idempotencia y concurrencia

Cada intento de captura deberá llevar una clave idempotente. Repetir la misma petición no puede sumar puntos dos veces. Dos jugadores con la misma versión de la bola competirán en Convex; solo una mutation válida podrá avanzar el estado.

## Frontera con el cliente

El cliente puede reutilizar las funciones puras de `src/game/` para presentar feedback inmediato, pero esa comprobación será orientativa. Convex repetirá la validación y decidirá el resultado definitivo.
