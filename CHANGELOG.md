# Changelog

Resumen de cambios relevantes del proyecto, organizado por lo que aportan a la web. El historial de Git conserva el detalle de cada commit. Como todavía no hay etiquetas ni releases publicados, no se inventan versiones: `Unreleased` recoge lo que está en `develop` y aún no se ha promocionado a producción; el histórico resume los principales hitos desde el inicio.

## [Unreleased]

### Web y experiencia

- Añadido un favicon basado en el escudo de Palomares del Campo.
- Evitado el zoom automático de móvil en los campos de texto del formulario de Palomareños.

### Preview y calidad de entrega

- Documentado `develop` como rama de integración con Preview persistente y backend Convex de desarrollo compartido; debe utilizarse únicamente con datos de prueba.
- Ampliada la CI para ejecutar `Verify` también en pushes y Pull Requests dirigidos a `develop`.
- Documentado el flujo de ramas, Preview y promoción a producción.

### Documentación

- Actualizados README, instrucciones de agentes y guías de arquitectura y pruebas para reflejar la implementación actual.
- Sustituida la guía genérica de Convex por la descripción de los backends de juego y Palomareños.

## Hitos del proyecto

### Web editorial y servicios locales · 9–12 de octubre de 2026

- Creada la web estática con Astro, navegación compartida, identidad visual del municipio y mejoras progresivas con Three.js.
- Incorporadas noticias y bandos municipales con fuentes, adjuntos, búsqueda y filtros; añadido el importador RSS y el flujo automatizado de sincronización de bandos mediante Pull Request.
- Añadidas páginas de información práctica, agenda, rutas verificadas con mapa GPX/Leaflet, horarios de transporte y alojamientos rurales.
- Mejoradas la navegación para vecinos y visitantes, la accesibilidad, la adaptación móvil y la presentación de contenido editorial.

### Juego geolocalizado · 10–11 de octubre de 2026

- Evolucionado el prototipo local con reglas de captura, ubicaciones y simulador de desarrollo.
- Añadido Convex para el estado remoto autoritativo: temporadas, capturas, identidad por nick, ranking con decaimiento de puntuación y presencia temporal.
- Incorporados controles inmersivos y mejoras del mapa, con fallbacks cuando falla WebGL.

### Palomareños por el mundo · 14–15 de octubre de 2026

- Añadidos el mapa público y el formulario de propuestas con moderación: solo las historias aprobadas y con ubicación válida se proyectan públicamente.
- Incorporadas validaciones antiabuso, rate limiting y verificación server-side con Turnstile; las notificaciones de moderación y aprobación pueden enviarse mediante Resend.
- Añadidas operaciones internas de aprobación, rechazo y retirada, además de páginas de privacidad, cookies y aviso legal.
- Documentación legal y configuración de producción mantenidas como pendientes de revisión; su presencia en la web no implica aprobación jurídica ni despliegue de producción.

### Diseño, arquitectura y SEO · 12–16 de octubre de 2026

- Centralizados tokens de diseño y tipografía; documentadas las fronteras de CSS y añadida una comprobación de arquitectura para los cambios de estilos.
- Reorganizados layouts y componentes para separar responsabilidades y facilitar su reutilización.
- Añadidos metadatos SEO, datos estructurados y sitemap; diferidas las escenas Three.js con alternativas visuales accesibles.
- Endurecidos los límites de TypeScript y la validación de respuestas externas, datos del juego, Turnstile y Resend.

### Pruebas y cadena de suministro · 10–17 de octubre de 2026

- Ampliadas las pruebas unitarias, de integración, de componentes Astro, E2E y QA visual; aisladas las pruebas de servicios externos mediante fixtures.
- Añadida cobertura de código con umbral mínimo y CI para formato, tipos, lint, pruebas, build y verificación SEO.
- Incorporadas automatizaciones de seguridad y dependencias, revisión de dependencias y una política de antigüedad mínima para paquetes nuevos.

---

Las fechas del histórico corresponden a los commits integrados en `main`; los cambios posteriores siguen en `Unreleased` hasta una promoción autorizada.
