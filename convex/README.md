# Backend Convex de Palomares del Campo

Este directorio contiene las funciones y el esquema del backend Convex usado por dos flujos concretos del sitio estático Astro:

- **Juego:** estado de temporada, jugadores anónimos identificados mediante `deviceId`, capturas, ranking y presencia temporal.
- **Palomareños por el mundo:** recepción de propuestas, moderación interna y consulta pública de historias aprobadas.

Convex no es el CMS ni la base de datos del contenido editorial general. Las noticias y los bandos se gestionan como Content Collections Markdown en `src/content/`.

## Módulos principales

- `schema.ts`: tablas e índices compartidos.
- `game.ts`, `geo.ts`, `identity.ts`, `leaderboard.ts`, `presence.ts` y `score.ts`: reglas y operaciones del juego.
- `palomarenos.ts` y `palomarenos_validation.ts`: envío, validación, moderación y proyección pública redactada.
- `palomarenos_notifications.ts`, `palomarenos_notification_content.ts`, `resend_response.ts` y `turnstile.ts`: notificaciones y protección del formulario.
- `_generated/`: referencias generadas por Convex; no editarlas manualmente.

## Contratos y límites

- En el juego remoto, Convex vuelve a validar capturas y mantiene el estado autoritativo. El modo local del navegador no es una partida compartida.
- La identidad del jugador usa un identificador local y un nick; no equivale a autenticación fuerte. No hay protección contra spoofing GPS demostrada.
- El formulario de Palomareños verifica Turnstile en una action de servidor y crea propuestas mediante una mutación interna con estado inicial `pending`.
- `api.palomarenos.listApproved` expone solo una proyección de fichas aprobadas con coordenadas válidas; no devuelve email ni campos de moderación.
- Aprobar, rechazar y retirar son operaciones internas. No hay panel público de administración.
- La presencia del juego almacena coordenadas redondeadas temporalmente; no se conserva historial de recorridos.
- Las pruebas locales no demuestran que un deployment remoto esté configurado o disponible.

Consulta [`../docs/architecture.md`](../docs/architecture.md) para los flujos técnicos y límites completos. La operación de Palomareños está descrita en [`../docs/palomarenos-operacion.md`](../docs/palomarenos-operacion.md), y la matriz de entornos en [`../docs/palomarenos-produccion.md`](../docs/palomarenos-produccion.md).

## Desarrollo y validación

El deployment de desarrollo compartido es `dev/europe-ireland`; úsalo solo con datos de prueba. Para sincronizar funciones y regenerar tipos:

```bash
pnpm exec convex dev
```

Las variables privadas de backend se configuran en el deployment Convex y las variables locales en archivos ignorados. El frontend usa `CONVEX_URL`; no debe contener un secreto. Para propuestas, los nombres de variables privados/públicos necesarios se documentan sin valores en `docs/palomarenos-produccion.md`.

Las funciones y contratos se cubren con Vitest y `convex-test`:

```bash
pnpm test:coverage
pnpm typecheck:convex
```

`pnpm exec convex deploy` modifica un deployment remoto: no ejecutarlo sin autorización explícita y sin confirmar previamente el destino. No incluir claves, tokens ni valores de entorno en Git, logs, documentación pública o conversaciones.
