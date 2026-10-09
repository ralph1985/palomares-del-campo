# Arquitectura de Palomares del Campo

## Objetivo

Construir una web editorial clara, rápida y mantenible para Palomares del Campo. El sitio debe poder crecer en contenido y secciones sin convertir las páginas en archivos monolíticos ni introducir infraestructura de servidor antes de necesitarla.

## Principios

1. **Estático primero.** Astro genera HTML estático, con buen rendimiento y SEO.
2. **Contenido separado de presentación.** Markdown y Content Collections contienen los datos; los componentes Astro deciden cómo mostrarlos.
3. **Interactividad progresiva.** JavaScript solo se usa donde mejora la experiencia: menú, filtros, mapas, galerías o escenas visuales.
4. **Accesibilidad como contrato.** La navegación debe funcionar con teclado, foco visible, nombres accesibles y sin depender de WebGL.
5. **Cambios verticales y pequeños.** Cada nueva sección debe incluir su contenido, ruta, componente y verificación antes de abrir otra línea de trabajo.
6. **Sin infraestructura prematura.** CMS, API, base de datos y autenticación quedan fuera hasta que exista una necesidad editorial u operativa concreta.

## Capas

### Rutas y composición

`src/pages/` contiene las rutas y compone layouts y secciones. Una página debe describir la estructura de la ruta, no contener toda la implementación visual de la web.

Rutas previstas:

- `/`: portada y resumen de contenidos.
- `/noticias/`: archivo de noticias.
- `/noticias/[slug]/`: noticia individual.
- `/lugares/` y `/lugares/[slug]/`: lugares de interés.
- `/patrimonio/` y `/patrimonio/[slug]/`: patrimonio material e inmaterial.
- `/agenda/`: fiestas, actividades y eventos.

Cada bloque se incorpora solo cuando tiene contenido y una necesidad real.

### Layouts

`src/layouts/` contiene la estructura común:

- `BaseLayout.astro`: `html`, metadatos, cabecera, navegación, pie y estilos globales.
- `ArticleLayout.astro`: título, fecha, fuente, cuerpo y navegación de contenidos editoriales.

La extracción desde el actual `src/pages/index.astro` debe conservar la apariencia y ser un refactor separado de la creación de nuevas funcionalidades.

### Componentes

```text
src/components/
├── layout/       # SiteHeader, SiteFooter, SideMenu
├── ui/           # Button, Tag, SectionHeading, ContentCard
├── sections/     # Hero, NewsSection, FeaturedPlaces
└── news/         # NewsCard, NewsList, ArticleMeta
```

No crear un componente abstracto por anticipado. Se extrae cuando hay repetición real o cuando delimita una responsabilidad clara.

### Contenido

`src/content/` contiene colecciones editoriales:

```text
src/content/
├── noticias/
├── lugares/
├── patrimonio/
└── agenda/
```

Cada colección debe tener:

- un esquema en `src/content.config.ts`;
- campos obligatorios mínimos y validación de tipos;
- una ruta de listado o archivo si procede;
- una ruta individual cuando el contenido lo requiera;
- componentes reutilizables para sus tarjetas y metadatos.

Las noticias externas se mantienen separadas de futuros bandos o comunicados municipales, aunque compartan componentes técnicos.

### JavaScript y Three.js

`src/scripts/` contiene comportamiento cliente. La lógica del menú es independiente de la escena visual:

```text
src/scripts/
├── menu.ts                 # abrir, cerrar, foco y teclado
└── scenes/
    └── menu-scene.ts      # inicialización y animación Three.js
```

Three.js se carga de forma diferida y con manejo de error. Un fallo de WebGL solo degrada la decoración visual; nunca debe inutilizar la navegación.

Cuando aparezca otra interacción compleja, se evaluará primero una isla Astro pequeña antes de introducir un framework de UI.

## CSS

### Organización

```text
src/styles/
├── tokens.css      # variables de diseño
├── global.css      # reset, base, foco y reglas globales
└── typography.css  # reglas tipográficas compartidas, si llegan a ser necesarias
```

Los estilos propios de un componente permanecen en su `<style>` scoped. Los estilos globales no deben vivir accidentalmente en una página concreta.

### Tokens

Los valores repetidos deben expresarse como variables semánticas:

```css
:root {
  --color-background: ...;
  --color-surface: ...;
  --color-ink: ...;
  --color-muted: ...;
  --color-primary: ...;
  --color-accent: ...;
  --content-width: ...;
  --space-section: ...;
  --radius-card: ...;
  --shadow-card: ...;
  --duration-normal: ...;
  --ease-standard: ...;
}
```

Las páginas y componentes no deben repetir sistemáticamente hexadecimales, escalas de espaciado o sombras. Los tokens se cambian en un punto y los componentes consumen esos tokens.

### Reglas visuales

- CSS nativo; no Tailwind ni CSS-in-JS por ahora.
- Enfoque mobile-first.
- Contenedor y ancho de lectura coherentes.
- Estados `:hover` y `:focus-visible` explícitos.
- Respeto a `prefers-reduced-motion`.
- Contraste y tamaño táctil revisados en cada control.
- Animaciones reservadas para transiciones y contenido donde aporten orientación, no como requisito funcional.

## Evolución prevista

### Siguiente bloque técnico

1. Extraer `BaseLayout`, `SiteHeader`, `SiteFooter` y `SideMenu`.
2. Crear `tokens.css` y `global.css`.
3. Reducir `src/pages/index.astro` a composición de secciones.
4. Mantener rutas y aspecto actuales.
5. Ejecutar build y verificación de teclado/navegador.

### Siguientes bloques de producto

1. Lugares de interés.
2. Patrimonio y tradiciones.
3. Agenda y fiestas.
4. Búsqueda y filtros.
5. Mapas o galerías interactivas.
6. Automatización editorial de noticias, cuando se defina y apruebe su alcance.

## Cuándo cambiar de arquitectura

Solo valorar CMS, backend o base de datos si aparece una de estas necesidades:

- varias personas editando contenido sin Git;
- publicación frecuente que haga inviable la revisión por pull request;
- datos dinámicos que no puedan versionarse como Markdown;
- formularios o cuentas de usuario;
- búsquedas, mapas o agenda con estado remoto;
- automatizaciones editoriales que necesiten persistencia y trazabilidad.

Ese cambio sería una decisión de arquitectura independiente, no una consecuencia automática de añadir más páginas.
