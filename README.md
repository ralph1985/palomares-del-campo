# Palomares del Campo

Web editorial y experiencias interactivas para Palomares del Campo, construidas con [Astro](https://astro.build/), TypeScript, Leaflet, Three.js y Convex.

El sitio genera estáticamente sus páginas editoriales. Convex proporciona estado remoto para el juego geolocalizado y gestiona las propuestas moderadas de «Palomareños por el mundo». Son superficies separadas: el contenido editorial general no depende de Convex.

## Estado del proyecto

- Noticias y bandos municipales gestionados en colecciones Markdown separadas.
- Mapa Leaflet con teselas de OpenStreetMap y atribución visible; rutas con mapa GPX.
- Escenas Three.js opcionales, cargadas bajo demanda y con fallback.
- Juego con modo local y remoto: Convex es la autoridad para capturas, puntuación, ranking y presencia en el modo remoto.
- «Palomareños por el mundo»: mapa público de historias aprobadas y formulario de propuestas moderadas. El flujo remoto usa Convex, Turnstile server-side y notificaciones mediante Resend cuando el deployment está configurado.
- Las coordenadas y radios del juego siguen siendo provisionales hasta su revisión física.
- Las pruebas E2E usan fixtures o modos simulados; no prueban un deployment remoto de Convex ni una partida real de dos jugadores.

## Requisitos

- Node.js `>=22.12.0`.
- `pnpm` 10.25.0.
- Chromium instalado para ejecutar Playwright E2E.
- Convex solo es necesario para probar los flujos remotos; el sitio editorial se puede arrancar localmente sin él.

Comprueba las versiones con:

```bash
node --version
pnpm --version
```

## Instalación y desarrollo

```bash
git clone https://github.com/ralph1985/palomares-del-campo.git
cd palomares-del-campo
pnpm install --frozen-lockfile
pnpm dev
```

Astro sirve la web en `http://localhost:4321/`. Sin `CONVEX_URL`, el juego usa el modo local de desarrollo; sus capturas y puntuación no son una partida compartida ni autoritativa.

### Backend Convex de desarrollo

Para trabajar con los flujos remotos, configura localmente las variables del deployment de desarrollo en un archivo ignorado por Git y ejecuta en una terminal separada:

```bash
pnpm exec convex dev
```

Luego arranca Astro con `pnpm dev`. El deployment `dev/europe-ireland` se comparte entre desarrollo local y Preview: usa únicamente datos de prueba. No copies archivos de entorno, claves, tokens ni URLs privadas al repositorio o al chat. `pnpm exec convex deploy` no forma parte del desarrollo habitual y requiere autorización explícita.

## Comandos

| Comando                             | Uso                                                                               |
| ----------------------------------- | --------------------------------------------------------------------------------- |
| `pnpm dev`                          | Servidor Astro con recarga en desarrollo.                                         |
| `pnpm build`                        | Genera el sitio estático en `dist/`.                                              |
| `pnpm preview`                      | Sirve localmente el build generado.                                               |
| `pnpm typecheck`                    | Comprueba Astro/scripts/tests y Convex con configuraciones separadas.             |
| `pnpm lint`                         | Ejecuta ESLint.                                                                   |
| `pnpm format` / `pnpm format:check` | Formatea / comprueba el formato con Prettier.                                     |
| `pnpm test`                         | Ejecuta Vitest sin informe de cobertura.                                          |
| `pnpm test:coverage`                | Ejecuta Vitest con cobertura; es el gate de CI.                                   |
| `pnpm test:watch`                   | Ejecuta Vitest en modo observación.                                               |
| `pnpm test:e2e`                     | Ejecuta Playwright contra Chromium.                                               |
| `pnpm qa:visual`                    | QA visual/funcional contra un servidor ya iniciado.                               |
| `pnpm check:css:architecture`       | Comprueba las reglas CSS aplicables al diff.                                      |
| `pnpm check:seo`                    | Verifica SEO y sitemap del build; requiere un build previo.                       |
| `pnpm fetch-bandos`                 | Importa comunicados desde el RSS oficial sin eliminar históricos.                 |
| `pnpm sync-agenda-from-bandos`      | Regenera la proyección de Agenda desde bandos con fechas públicas verificables.   |
| `pnpm sync-bandos`                  | Ejecuta el sincronizador previsto para cron; requiere `gh` y configuración local. |

`pnpm test:coverage` genera `coverage/` (ignorado por Git) y aplica los umbrales de cobertura configurados. CI ejecuta formato, typecheck, lint, tests con cobertura, E2E, build y verificación SEO. `pnpm qa:visual` y `pnpm check:css:architecture` son comandos independientes, no pasos del workflow CI actual.

### Importación y sincronización de bandos

`pnpm fetch-bandos` usa por defecto el RSS oficial de Bandomovil como fuente incremental. Añade y actualiza comunicados, conserva los Markdown históricos que no aparezcan en la ventana del RSS y mantiene los adjuntos externos. El backfill histórico se ejecuta con `BANDOS_IMPORT_MODE=archive pnpm fetch-bandos`; ese modo está restringido a los años configurados en `scripts/fetch-bandos.ts` y reconcilia el directorio generado.

`pnpm sync-agenda-from-bandos` lee los Markdown locales de `src/content/bandos/` y regenera `src/data/agenda-bandos.generated.ts`. Solo produce actividades, servicios fechados o plazos con fecha verificable y enlace del canal oficial de Bandomovil; ignora horarios permanentes, avisos operativos sin fecha y cancelaciones o aplazamientos que requieren revisar el comunicado y sus adjuntos. Conserva las entradas generadas anteriores cuando un comunicado desaparece del RSS y usa un identificador estable por comunicado y ocurrencia para aplicar correcciones sin duplicarlas. Las entradas verificadas solo en adjuntos se mantienen en `src/data/agenda-manual.ts`, fuera del generador.

`/agenda/` muestra actividades, servicios y trámites futuros con fuente visible. Las fechas terminadas pasan a un `<details>` cerrado por defecto; el cliente las reclasifica con la fecha de `Europe/Madrid` en cada visita para que el archivo se actualice aunque no haya un nuevo build. La entrada se conserva en datos y no se borra al vencer.

`pnpm sync-bandos` está diseñado para cron en un host con Node.js, pnpm y una sesión válida de GitHub CLI. Bloquea ejecuciones concurrentes, alinea `main`, trabaja en un worktree temporal, importa el RSS y regenera la proyección de Agenda. Si hay cambios, valida y crea una PR limitada a `src/content/bandos/*.md` y `src/data/agenda-bandos.generated.ts`; los dos resultados pasan juntos los checks y se fusionan en `main` solo cuando los checks obligatorios están verdes. Después crea o actualiza una PR de `main` hacia `develop`, espera `Verify` y la fusiona automáticamente cuando pasa. También reconcilia promociones pendientes aunque el RSS no traiga bandos nuevos. Esta lógica solo se activa cuando llega a la rama `main` desde la que se ejecuta el cron; a partir de ahí, las actualizaciones de bandos ya no esperan a una release posterior de `develop`.

El aviso posterior a la fusión puede enviarse por SMTP mediante Nodemailer. La configuración se mantiene fuera de Git (`BANDOS_SMTP_HOST`, `BANDOS_SMTP_PORT`, `BANDOS_SMTP_SECURE`, `BANDOS_SMTP_USER`, `BANDOS_SMTP_PASSWORD`, `BANDOS_NOTIFY_FROM` y `BANDOS_NOTIFY_TO`). `BANDOS_SITE_URL` es opcional. No se envían notificaciones por Telegram.

`SYNC_BANDOS_DRY_RUN=1 pnpm sync-bandos` omite la rama y la PR de bandos, su fusión, la notificación y la promoción a `develop`. No evita necesariamente la alineación inicial de `main`: consulta `docs/architecture.md` antes de tratarlo como un dry-run sin efectos sobre el checkout. La instalación de cron, SMTP y auto-merge requiere un host autorizado y configuración local.

### Descubrimiento de noticias

`pnpm discover-news` ejecuta manualmente el descubrimiento para Palomares del Campo con Codex CLI y búsqueda web en sandbox de solo lectura. Propone como máximo tres noticias con fecha de hoy o de los 29 días naturales anteriores (30 fechas en total), con vínculo explícito al municipio y fuente HTTPS de la lista permitida. Excluye bandos de Bandomovil, anuncios/avisos, agendas, empleo y opinión; no descarga imágenes ni destaca noticias automáticamente.

La ejecución real obtiene `origin/main`, compara sus noticias existentes, crea un worktree temporal basado en `main` dentro del caché privado del usuario, valida los Markdown y abre una PR de contenido contra `main`. Si no hay propuestas válidas, no crea PR ni envía correo. No publica ni fusiona la PR. Si ya hay una PR automática de noticias abierta, se detiene para no duplicar propuestas. El wrapper evita ejecuciones simultáneas con un lock exclusivo `fcntl` bajo el caché privado del usuario; lo abre sin seguir enlaces simbólicos. El dry-run no toma ese bloqueo. Tras leer de vuelta y verificar la PR, envía un correo con el enlace directo de GitHub.

```bash
pnpm discover-news:dry-run
```

El dry-run sí realiza una búsqueda web de solo lectura, pero no hace `fetch`, no crea worktree, archivos, ramas o PRs, y no envía correo; toma como referencia la colección de noticias del checkout actual. El proceso real usa el `origin/main` actualizado.

Se requiere Codex CLI autenticado localmente (`codex login`), Python 3, una sesión autenticada de `gh` y SMTP. La búsqueda usa solo la herramienta web de Codex: desactiva shell, navegador, control del ordenador, code-mode y herramientas de apps; además, el subproceso solo recibe variables de ejecución permitidas y no hereda credenciales SMTP/GitHub ni API keys del proceso principal. El SMTP acepta `NEWS_SMTP_HOST`, `NEWS_SMTP_PORT`, `NEWS_SMTP_SECURE`, `NEWS_SMTP_USER`, `NEWS_SMTP_PASSWORD`, `NEWS_NOTIFY_FROM` y `NEWS_NOTIFY_TO`; si no se configuran, reutiliza las variables `BANDOS_*` existentes. No se configura ni instala cron en esta fase; la programación se hará después de revisar el worker y promover su código a `main`.

## Estructura

```text
src/
├── components/       # about, accommodations, game, home, layout, ui, world…
├── content/          # noticias/ y bandos/ (Markdown)
├── data/             # datos estructurados del sitio
├── game/             # reglas puras y sesión local
├── layouts/          # layout compartido de Astro
├── pages/            # rutas y composición
├── scripts/          # mapas, Convex, menú y adaptadores de navegador
└── styles/           # tokens, estilos globales y hojas específicas

convex/               # backend de juego y propuestas de Palomareños
scripts/              # importación, sincronización y QA
tests/                # unit, integration, e2e y features
docs/                 # arquitectura, testing, operación y releases
```

`convex/_generated/` se regenera con la CLI; no se edita manualmente. La arquitectura fuente detallada está en [`docs/architecture.md`](docs/architecture.md).

## Rutas principales

- `/`: portada.
- `/noticias/` y `/noticias/[slug]/`: archivo y detalle de noticias.
- `/bandos/` y `/bandos/[slug]/`: comunicados municipales; `/avisos/` redirige a `/bandos/`.
- `/sobre-el-pueblo/`: historia, patrimonio, paisaje y fuentes.
- `/informacion-practica/`, `/agenda/`, `/alojamientos/` y `/rutas/`: recursos e información local.
- `/juego/`: mapa y experiencia geolocalizada.
- `/palomarenos-por-el-mundo/`: mapa público y formulario de propuestas moderadas.
- `/privacidad/`, `/politica-de-cookies/` y `/aviso-legal/`: información legal. La documentación de privacidad y aviso legal conserva pendientes de revisión; no asumir que está aprobada para producción.

## Límites del backend y privacidad

En el juego remoto, el backend valida las capturas y mantiene el estado compartido; el modo local no persiste puntuaciones. La identidad del jugador se basa en un `deviceId` local y un nick, no en cuentas de usuario. La presencia guarda temporalmente coordenadas redondeadas y no mantiene historial de recorridos. No hay protección demostrada contra spoofing de GPS ni E2E con varios jugadores conectados a un deployment real.

En Palomareños, las propuestas comienzan pendientes y solo las aprobadas con coordenadas válidas aparecen en la proyección pública. El email y los campos internos de moderación no se exponen en esa proyección. La moderación no tiene un panel administrativo público; las operaciones internas se describen en [`docs/palomarenos-operacion.md`](docs/palomarenos-operacion.md). Antes de producción deben resolverse los pendientes legales y de configuración indicados en [`docs/palomarenos-por-el-mundo.md`](docs/palomarenos-por-el-mundo.md) y [`docs/palomarenos-produccion.md`](docs/palomarenos-produccion.md).

Las ubicaciones del juego son provisionales; antes de activar una temporada pública hay que revisar acceso, seguridad, tráfico y precisión GPS. No presentar datos de OpenStreetMap como ubicaciones oficiales sin esa revisión.

## Pruebas y contribución

La suite Vitest cubre reglas y componentes, las funciones Convex y adaptadores, importación y políticas auxiliares. Playwright comprueba flujos visibles con el servidor de desarrollo, simuladores o respuestas interceptadas: no constituye validación de producción. La ejecución de cobertura verificada el 20 de octubre de 2026 pasó **43 archivos y 241 pruebas**, con 93,78 % de statements, 91,36 % de branches, 96,58 % de functions y 96,58 % de lines.

Validación local equivalente al gate principal de CI:

```bash
pnpm format:check
pnpm typecheck
pnpm lint
pnpm test:coverage
CI=1 pnpm test:e2e
pnpm build
pnpm check:seo
```

Para cambios de UI, usar también `pnpm qa:visual` cuando haya un servidor disponible. Revisar `AGENTS.md` y la documentación relevante antes de editar; ejecutar `git diff --check` y comprobar que el diff contiene solo los archivos previstos. No desplegar Convex ni producción sin autorización explícita.

## Documentación relacionada

- [`AGENTS.md`](AGENTS.md): reglas operativas para cambios.
- [`docs/architecture.md`](docs/architecture.md): arquitectura implementada, límites y evolución prevista.
- [`docs/testing.md`](docs/testing.md): estrategia, alcance y límites de las pruebas.
- [`docs/development-workflow.md`](docs/development-workflow.md): ramas, Preview y releases.
- [`docs/palomarenos-por-el-mundo.md`](docs/palomarenos-por-el-mundo.md): tratamiento de datos y pendientes de revisión.
- [`docs/palomarenos-produccion.md`](docs/palomarenos-produccion.md): configuración por entorno, sin valores secretos.
- [`docs/palomarenos-operacion.md`](docs/palomarenos-operacion.md): procedimiento interno de retirada de historias.
- [`CHANGELOG.md`](CHANGELOG.md): cambios aún no promocionados y releases deliberados.

Mantenido por [ralph1985](https://github.com/ralph1985).
