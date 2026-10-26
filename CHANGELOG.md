# Changelog

Este archivo adopta las convenciones principales de [Keep a Changelog 2.0](https://keepachangelog.com/en/2.0.0/): resume cambios notables para quienes usan y mantienen el proyecto; no reproduce cada commit. Usa las categorías `Security`, `Removed`, `Changed`, `Deprecated`, `Fixed` y `Added`, y fechas ISO `YYYY-MM-DD`. `Unreleased` recoge cambios en `develop` aún no promocionados. El histórico de `main` muestra fechas de commit, no fechas de release. El repositorio aún no tiene etiquetas ni releases publicados.

## [Unreleased]

### 2026-10-26

#### Changed

- Ajustado el menú lateral: accesos algo más compactos en móvil y escudo visible en escritorio.
- Añadido al menú el acceso a Inicio fuera de la portada y una marca accesible de la página o sección actual.

### 2026-10-25

#### Changed

- Rediseñada la portada con un hero editorial, accesos claros para vecinos y visitantes y una guía tipográfica para descubrir el pueblo.
- Unificados los controles de acción del sitio con una base visual compartida; los enlaces externos conservan la misma pestaña por defecto y solo abren otra con indicación accesible explícita.

### 2026-10-24

#### Added

- Añadido el control de build `PUBLIC_BALL_GAME_ENABLED`, desactivado por defecto; al activarlo muestra el juego y sus accesos en portada, navegación, pie y rutas.
- Añadida una guía ampliada de la iglesia de Nuestra Señora de la Asunción, enlazada desde la tarjeta de patrimonio y con fuentes institucionales visibles.
- Ampliada la guía de la iglesia con tres fotografías exteriores de Wikimedia Commons, crédito visible y licencia CC BY-SA 4.0.
- Añadida una guía del Castillo de Torrebuceit a «Qué ver cerca», con el testimonio familiar sobre Crescente y Eusebia, contexto documentado sobre el trabajo en la finca, cautelas de acceso y vídeo grabado por Rafa en homenaje a su abuelo Crescente.
- Añadidas tres fotografías de Torrebuceit con atribución a 19Tarrestnom65 y licencia CC BY-SA 4.0; las copias WebP locales enlazan a sus originales y a la licencia.
- Añadidas guías ampliadas de Segóbriga, la Mina de la Mora Encantada y Noheda, con fotografías licenciadas y créditos visibles, fuentes oficiales y condiciones de visita.

#### Changed

- Convertidas las imágenes raster locales, municipales y de bandos a variantes WebP responsive de Astro; se conservan las fuentes originales y se añaden URLs estáticas versionadas. Los fallos detectados en el sondeo inicial conservan la URL de origen.
- Reforzada la identidad de la cabecera con el escudo enmarcado, el nombre en dos niveles y un botón «Explorar» destacado, manteniendo el conjunto compacto en móvil.
- Aplicada una superficie verde salvia al hero de portada para separarlo de la cabecera clara y conservar su composición vertical.
- Priorizado el acceso a las guías internas de «Qué ver cerca» frente a los enlaces externos de fuentes en las tarjetas.
- Centralizadas las migas de pan de las páginas jerárquicas y eliminados los enlaces de retorno redundantes en noticias, bandos, guías cercanas y la página de la iglesia.
- Ampliado el borrador del aviso legal para aclarar el alcance informativo del sitio y marcar los datos institucionales pendientes de verificación sin conservar identificadores ficticios.

### 2026-10-22

#### Added

- Añadida a la Agenda la búsqueda de texto y filtros combinables por tipo, categoría y año, con estado de resultados accesible y filtros restaurables desde la URL.
- Añadida paginación progresiva a los grupos de Agenda con más de seis fechas, conservando el archivo cerrado por defecto y priorizando las fechas más recientes en el archivo.
- Añadido a la Agenda el plazo oficial de la convocatoria 2026 de ayudas a la accesibilidad en viviendas de Castilla-La Mancha.
- Añadidos los plazos JCCM 2026 para ayudas de conciliación mediante cuidados en el hogar y para la contratación indefinida (línea 1).
- Añadida la feature flag de build `PUBLIC_PALOMARENOS_ENABLED`, desactivada por defecto, que oculta el mapa y el formulario hasta su activación explícita.

### 2026-10-21

#### Fixed

- Interpretar las horas locales del archivo de Bandomovil en `Europe/Madrid` y corregir 124 fechas históricas mal etiquetadas como UTC; las fechas RSS con offset explícito se conservan.

#### Added

- Completada `/agenda/` con actividades, servicios públicos y plazos con fuente visible; las fechas vencidas pasan automáticamente a un archivo cerrado según `Europe/Madrid`.
- Añadida la extracción determinista de fechas elegibles desde bandos y su proyección generada en la misma PR automática de sincronización, con allowlist limitada a los bandos y el archivo generado.

### 2026-10-20

#### Added

- Añadido un worker manual de descubrimiento de noticias locales: búsqueda web de solo lectura, filtros de fuente y actualidad, PR revisable contra `main` y aviso SMTP con enlace; no instala cron ni fusiona la PR.

#### Changed

- Reutilizado `ActionLink` en los enlaces de regreso de noticias y bandos, con foco visible consistente.
- Sincronizada automáticamente la rama `main` hacia `develop` mediante una PR protegida tras cada ejecución del importador de bandos.

### 2026-10-19

#### Changed

- Componentizados los Hero de las páginas en `EditorialHero` y `SplitHero`, conservando sus variantes, accesibilidad y composiciones multimedia.
- Mejorado el contraste de las etiquetas de sección en las páginas legales sobre superficies claras.

#### Added

- Añadida la flag de build `PUBLIC_PAGE_TRANSITIONS_ENABLED`, desactivada por defecto, para controlar las transiciones de página.
- Añadida una transición de página completa en cubo con Three.js, activable mediante la flag; conserva la navegación normal, respeta `prefers-reduced-motion` y ofrece un fallback CSS.
- Añadida la guía «Qué ver cerca» con recursos culturales y naturales de la zona, fuentes oficiales y avisos de visita.
- Mejorado el nombre accesible del botón del menú para conservarlo también en móviles.

### 2026-10-18

#### Changed

- `develop` pasa a ser la rama de integración con Preview persistente y backend Convex de desarrollo compartido; debe usar solo datos de prueba.
- CI ejecuta `Verify` también en pushes y Pull Requests dirigidos a `develop`.
- Actualizada la documentación para describir las rutas, el backend y las pruebas que existen actualmente.

#### Fixed

- Evitado el zoom automático de móvil en los campos de texto del formulario de Palomareños.

#### Added

- Favicon basado en el escudo de Palomares del Campo.

## Historial integrado en `main` — fechas de commit, no de release

### 2026-10-17

#### Security

- Añadidas comprobaciones de seguridad para GitHub Actions y revisión de dependencias.

#### Changed

- Aplicada una espera mínima de tres días para que las dependencias recién publicadas puedan instalarse.

#### Added

- Ampliada la cobertura de componentes Astro y activada su verificación en CI.

### 2026-10-16

#### Changed

- Aisladas las pruebas de mapas y adjuntos externos con fixtures; ampliadas las pruebas E2E y visuales.
- Incorporada la CI de calidad para formato, TypeScript, lint, pruebas, build y SEO.

#### Fixed

- Validados con más rigor los datos geográficos, JSON-LD y respuestas de Resend; conservado el menú si falla la escena 3D.

### 2026-10-15

#### Changed

- Documentada la configuración de producción por entorno, sin guardar valores secretos.
- Activadas comprobaciones estrictas de TypeScript para Astro, Convex, scripts y pruebas.

#### Fixed

- Corregidas la validación de respuestas de Turnstile y la presentación de tarjetas editoriales.

#### Added

- Añadido el flujo interno para retirar historias de «Palomareños por el mundo».

### 2026-10-14

#### Security

- Protegido el envío de propuestas con Turnstile server-side, límites antiabuso y controles por hostname.

#### Fixed

- Corregidos el bucle de error de Turnstile, el contraste de páginas legales y la superposición de mapas con la cabecera.

#### Added

- Publicados el mapa y el formulario moderado de «Palomareños por el mundo», con avisos a quienes envían historias cuando se aprueban.
- Añadidas páginas de privacidad y cookies, y un borrador de aviso legal.

### 2026-10-13

#### Changed

- Simplificada la navegación para visitas y los accesos a servicios municipales.
- Ampliadas las escenas opcionales de Three.js y alineada la arquitectura documentada con el código.

#### Fixed

- Mantenido visible el emblema de la página «Sobre el pueblo».

### 2026-10-12

#### Changed

- Centralizados los tokens de diseño y tipografía; reorganizados componentes, layouts y límites CSS.

#### Added

- Incorporados SEO técnico, sitemap y datos estructurados.
- Añadidos el directorio de alojamientos rurales, mapas Leaflet para rutas y carga de recorridos GPX.
- Automatizada la importación y sincronización de bandos municipales, con búsqueda, filtros y adjuntos.

### 2026-10-11

#### Fixed

- Mejorada la lectura de resúmenes y enlaces largos de bandos en móvil.

#### Added

- Añadidas páginas de información práctica, agenda, rutas, horarios de autobús y bandos municipales.
- Mejorados los accesos editoriales de portada y la navegación para vecinos y visitantes.
- Incorporadas la presencia de jugadores remotos y controles inmersivos al juego.

### 2026-10-10

#### Added

- Creado el prototipo geolocalizado del juego y un simulador de posiciones para desarrollo.
- Añadido Convex para capturas autoritativas, temporadas, identidad por nick, ranking y decaimiento de puntuación.
- Incorporadas pruebas unitarias y E2E, lint, formato y hooks de Git.

### 2026-10-09

#### Added

- Iniciado el sitio estático con Astro y pnpm, noticias, navegación compartida, imagen municipal y crédito de `conquense.dev`.
- Añadido el menú animado con Three.js y una alternativa funcional cuando WebGL falla.

---

Cada fecha del histórico resume los cambios notables de ese día; Git conserva el detalle completo de los commits.
