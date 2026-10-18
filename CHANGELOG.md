# Changelog

Este archivo adopta las convenciones principales de [Keep a Changelog 2.0](https://keepachangelog.com/en/2.0.0/): resume cambios notables para quienes usan y mantienen el proyecto; no reproduce cada commit. Usa las categorías `Security`, `Removed`, `Changed`, `Deprecated`, `Fixed` y `Added`, y fechas ISO `YYYY-MM-DD`. `Unreleased` recoge cambios en `develop` aún no promocionados. El histórico de `main` muestra fechas de commit, no fechas de release. El repositorio aún no tiene etiquetas ni releases publicados.

## [Unreleased]

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
