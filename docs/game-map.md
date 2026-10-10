# Mapa del juego

La ruta `/juego/` es el primer prototipo navegable de la idea de la bola.

## Qué incluye

- mapa interactivo del núcleo urbano;
- teselas de OpenStreetMap con atribución visible;
- seis coordenadas provisionales de lugares cartografiados;
- geolocalización local del dispositivo;
- cálculo de distancia en el navegador;
- captura simulada y cambio de ubicación en la sesión actual.
- reglas puras de distancia, precisión, captura, puntuación y siguiente ubicación en `src/game/`.
- escenarios de simulación: exacto, límite del radio, fuera del radio y precisión insuficiente.

## Qué no incluye todavía

No hay cuentas, base de datos, ranking compartido, validación autoritativa ni sincronización entre jugadores. El estado de captura se pierde al recargar y no debe considerarse una partida real.

En desarrollo, la página muestra además un simulador de posición no incluido en producción. Permite elegir cualquiera de los lugares estáticos y probar la validación y la captura sin conceder permisos de ubicación al navegador.

La geolocalización del navegador requiere un contexto seguro: `https://` o `localhost`. Por eso la URL de desarrollo accesible por Tailnet mediante `http://` puede mostrar el mapa, pero no obtener la posición del dispositivo. El despliegue previsto en Vercel usará HTTPS.

## Fuente de coordenadas

Las coordenadas iniciales se obtuvieron de geometrías de OpenStreetMap mediante la API `/api/0.6/map` para el área urbana de Palomares del Campo. OpenStreetMap publica sus datos bajo la licencia ODbL; el mapa mantiene la atribución requerida.

La selección, los nombres y los radios son una configuración provisional del prototipo y deberán revisarse antes de convertirlos en lugares oficiales de una temporada.
