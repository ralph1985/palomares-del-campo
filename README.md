# Palomares del Campo

Web editorial y experiencia interactiva para Palomares del Campo, construida con [Astro](https://astro.build/), TypeScript, Leaflet y Three.js.

El proyecto combina contenido editorial estático —portada, noticias y patrimonio— con `/juego/`, una experiencia geolocalizada cuyo estado compartido se apoya en Convex cuando se configura un deployment de desarrollo.

## Estado del proyecto

- Web editorial estática generada por Astro.
- Noticias gestionadas mediante Content Collections y Markdown.
- Mapa Leaflet con teselas de OpenStreetMap y atribución visible.
- Escena Three.js opcional y cargada bajo demanda.
- Juego con captura autoritativa, ranking y presencia temporal mediante Convex.
- Coordenadas y radios del juego todavía provisionales hasta su revisión física.

## Requisitos

- Node.js `>=22.12.0` (Astro 7).
- `pnpm` 10.25.0.
- Chromium instalado para ejecutar Playwright E2E.
- Convex solo es necesario para probar el modo multijugador remoto; la web puede arrancar en modo local sin él.

Comprueba las versiones del proyecto con:

```bash
node --version
pnpm --version
```

## Instalación y desarrollo

Clona el repositorio e instala las dependencias usando el lockfile:

```bash
git clone https://github.com/ralph1985/palomares-del-campo.git
cd palomares-del-campo
pnpm install --frozen-lockfile
```

Arranca la web en modo local:

```bash
pnpm dev
```

Astro servirá la aplicación en `http://localhost:4321/`. Sin `CONVEX_URL`, `/juego/` funciona con el simulador local de desarrollo y no representa una partida autoritativa compartida.

### Modo multijugador de desarrollo

El juego remoto usa un deployment de desarrollo de Convex. En una terminal separada:

```bash
pnpm exec convex dev
```

Mantén ese proceso activo mientras trabajas en las funciones de `convex/`. Convex sincroniza el código del backend, valida las funciones y regenera `convex/_generated/`.

Después, arranca Astro:

```bash
pnpm dev
```

Las variables de entorno se mantienen en archivos locales ignorados por Git. No copies `.env.local`, tokens, claves ni URLs privadas al repositorio o a una conversación.

> `pnpm exec convex deploy` está reservado para una publicación explícita del backend. El flujo normal de desarrollo usa `pnpm exec convex dev`.

## Comandos

| Comando             | Uso                                                                         |
| ------------------- | --------------------------------------------------------------------------- |
| `pnpm dev`          | Servidor Astro con recarga en desarrollo.                                   |
| `pnpm build`        | Genera el sitio estático en `dist/`.                                        |
| `pnpm typecheck`    | Comprueba Astro, scripts, tests y Convex con sus configuraciones separadas. |
| `pnpm preview`      | Sirve localmente el build generado.                                         |
| `pnpm test`         | Ejecuta las pruebas unitarias y de integración con Vitest.                  |
| `pnpm test:watch`   | Ejecuta Vitest en modo observación.                                         |
| `pnpm test:e2e`     | Ejecuta Playwright contra la aplicación en un navegador.                    |
| `pnpm lint`         | Ejecuta ESLint sobre el repositorio.                                        |
| `pnpm format`       | Formatea el código con Prettier.                                            |
| `pnpm format:check` | Comprueba que el formato sea correcto sin modificar archivos.               |
| `pnpm fetch-bandos` | Importa los comunicados nuevos del RSS oficial sin eliminar históricos.     |
| `pnpm sync-bandos`  | Ejecuta el sincronizador aislado; requiere `gh` y está pensado para cron.   |

### Sincronización automática de bandos

`pnpm fetch-bandos` usa por defecto el RSS oficial de Bandomovil como fuente incremental. Añade y actualiza comunicados, conserva los Markdown históricos que no aparezcan en la ventana del RSS y mantiene los adjuntos externos de Bandomovil. Para ejecutar manualmente el backfill histórico ya existente, usa `BANDOS_IMPORT_MODE=archive pnpm fetch-bandos`; ese modo está restringido a los años configurados en `scripts/fetch-bandos.ts` y sí reconcilia el directorio generado.

`pnpm sync-bandos` está diseñado para ejecutarse desde cron en un host con `pnpm`, Node.js y una sesión válida de GitHub CLI. Bloquea ejecuciones concurrentes, alinea `main`, trabaja en un worktree temporal, ejecuta el importador incremental, valida el contenido y crea una Pull Request limitada a `src/content/bandos/*.md`. No publica directamente en `main`.

El aviso posterior a la fusión se envía por SMTP, igual que en `ayuntamiento-de-belmontejo`, mediante `nodemailer` y un `.env` local ignorado por Git. Reutiliza estas variables:

```text
BANDOS_SMTP_HOST
BANDOS_SMTP_PORT=587
BANDOS_SMTP_SECURE=false
BANDOS_SMTP_USER
BANDOS_SMTP_PASSWORD
BANDOS_NOTIFY_FROM
BANDOS_NOTIFY_TO
```

`BANDOS_SITE_URL` es opcional. Si se configura, el correo enlaza al bando publicado en Palomares; si no, conserva el enlace oficial original de Bandomovil. El sincronizador no envía notificaciones por Telegram ni guarda credenciales en el repositorio.

Para comprobar el flujo sin crear ramas, PRs, merges ni notificaciones:

```bash
SYNC_BANDOS_DRY_RUN=1 pnpm sync-bandos
```

La instalación de cron, la configuración SMTP y el auto-merge requieren un host autorizado y variables locales ignoradas por Git. Nunca guardes esas credenciales en el repositorio.

Validación completa antes de publicar cambios:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
CI=1 pnpm test:e2e
pnpm build
git diff --check
```

La cobertura porcentual todavía no está configurada; `pnpm test` informa de pruebas ejecutadas, pero no genera un informe de cobertura.

## Estructura del proyecto

```text
src/
├── components/
│   ├── about/          # Tarjetas de patrimonio y fuentes
│   ├── game/           # Mapa, estado, reglas y controles del juego
│   ├── layout/         # Cabecera, menú, pie y crédito
│   └── ui/             # Botones y enlaces reutilizables
├── content/             # Colecciones editoriales Markdown
├── data/                # Datos de sitio, pueblo y ubicaciones del juego
├── game/                # Reglas puras de geolocalización y sesión
├── pages/               # Rutas Astro y composición de páginas
└── scripts/             # Adaptadores de navegador, Leaflet, Convex y menú

convex/
├── game.ts              # Temporadas, jugadores, presencia y capturas
├── geo.ts               # Validación geográfica autoritativa
├── identity.ts          # Normalización de nicks
├── leaderboard.ts       # Ranking compartido
├── presence.ts          # TTL y redondeo de presencia
├── schema.ts            # Esquema de Convex
└── _generated/          # Código generado por Convex; no editar manualmente

tests/
├── unit/                # Reglas puras y límites
├── integration/         # Contratos del adaptador cliente–Convex
├── e2e/                 # Flujos visibles en navegador
└── features/            # Especificaciones BDD en Gherkin

docs/
├── architecture.md      # Decisiones y límites de arquitectura
└── testing.md           # Estrategia y convenciones de pruebas
```

## Rutas principales

- `/`: portada y selección de noticias.
- `/noticias/`: archivo editorial.
- `/noticias/[slug]/`: detalle de una noticia.
- `/sobre-el-pueblo/`: historia, patrimonio, paisaje y fuentes.
- `/juego/`: mapa y experiencia de la bola.

## Arquitectura del juego

Convex es la autoridad para la partida remota. El cliente solicita acciones y representa el estado recibido; no decide capturas válidas ni puntuaciones.

- La captura se valida en backend por ubicación, precisión, versión de la bola y concurrencia.
- Las capturas incluyen una clave de idempotencia.
- La identidad es anónima: `deviceId` local y nick visible; no hay cuentas ni nombres reales.
- La presencia se publica solo durante la sesión activa.
- Las coordenadas de presencia se redondean antes de almacenarse.
- La presencia caduca tras 30 segundos sin actualización.
- No se conserva historial de recorridos.
- Los marcadores remotos se interpolan visualmente en el cliente para evitar saltos entre posiciones.

La lógica pura vive en `src/game/`. Los adaptadores de Leaflet, geolocalización, Convex y `requestAnimationFrame` viven en `src/scripts/`.

## Pruebas

La suite sigue tres niveles:

- **Unitarias:** distancia, radios, precisión GPS, puntuación, decaimiento, identidad, presencia e interpolación.
- **Integración:** conexión del adaptador cliente–Convex, callbacks reactivos, presencia, captura, versión de bola e idempotencia.
- **E2E:** mapa, navegación, modo inmersivo, captura desde el simulador, accesibilidad, CTAs y enlaces externos.

## Contenido y fuentes

El contenido editorial debe conservar sus fechas, fuentes y enlaces originales cuando proceda. No se deben inventar datos municipales, patrimoniales, horarios, contactos o coordenadas.

Las ubicaciones del juego son provisionales. Antes de convertir una ubicación en parte de una partida pública hay que revisar acceso, seguridad, tráfico, precisión GPS y alternativas.

## Contribución

Los cambios deben ser pequeños y verificables:

1. Revisa `AGENTS.md` y la documentación relevante antes de editar.
2. Mantén la separación entre composición, componentes, reglas puras, adaptadores y backend.
3. Añade o actualiza una prueba de comportamiento para cada cambio funcional.
4. Ejecuta la validación completa antes de crear un commit.
5. No incluyas secretos, archivos `.env`, artefactos generados, `dist/`, `.astro/` ni `node_modules/`.
6. No ejecutes despliegues de Convex o producción sin autorización explícita.

El flujo de ramas, PRs, Preview y releases está descrito en [`docs/development-workflow.md`](docs/development-workflow.md). Los cambios aún no promocionados a `main` se registran en [`CHANGELOG.md`](CHANGELOG.md).

## Documentación relacionada

- [`AGENTS.md`](AGENTS.md): reglas operativas del repositorio.
- [`docs/architecture.md`](docs/architecture.md): principios y límites de arquitectura.
- [`docs/testing.md`](docs/testing.md): estrategia de pruebas.
- [README files en GitHub](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes).
- [Estructura de proyectos Astro](https://docs.astro.build/en/basics/project-structure/).
- [CLI de Astro](https://docs.astro.build/en/reference/cli-reference/).
- [Flujo de desarrollo de Convex](https://docs.convex.dev/understanding/workflow).

## Mantenimiento

Proyecto mantenido por [ralph1985](https://github.com/ralph1985).
