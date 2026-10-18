# Flujo de ramas, Preview y releases

Este proyecto mantiene `develop` como integración y Preview persistente, y `main` como rama de producción.

## Entornos

- **`develop`**: integración de cambios y Preview estable en `develop.palomaresdelcampo.conquense.dev`. Usa Convex `dev/europe-ireland`, compartido con el desarrollo local; solo debe contener datos de prueba.
- **`main`**: código listo para producción. Vercel lo despliega al dominio de producción cuando se fusiona una PR aprobada.
- **Ramas de tarea**: despliegues Preview efímeros para revisar una PR; no son una alternativa al entorno persistente `develop`.

## Trabajo habitual

1. Parte del `develop` actualizado y crea una rama corta por tarea: `feat/<slug>`, `fix/<slug>` o `docs/<slug>`.
2. Abre una Pull Request hacia `develop`. No hagas push directo a `develop` ni a `main`.
3. Antes de fusionar, espera al check requerido `Verify` y comprueba el Preview de la PR en Vercel. La fusión actualiza el Preview persistente de `develop`.
4. Conserva el cambio integrado en `develop` hasta que forme parte de una promoción autorizada a producción.

## Promoción a producción

1. Cuando haya un conjunto coherente listo, abre una PR de `develop` a `main`; mantén el diff de lanzamiento manejable.
2. Actualiza `CHANGELOG.md` dentro de `Unreleased` con los cambios relevantes que incluye la PR.
3. Espera a que `Verify` pase y revisa el diff y el Preview. La protección de `main` requiere PR y el check `Verify`; el número de aprobaciones obligatorias es cero, así que la autorización de fusión debe venir del responsable del proyecto.
4. Fusiona solo con autorización explícita. Después, verifica que el deployment de producción de Vercel corresponde al commit fusionado.
5. Si un arreglo urgente se hace mediante una PR separada a `main`, intégralo después también en `develop` mediante PR.

## CI y protección de ramas

El workflow `CI` ejecuta el check `Verify` en pushes a `develop` y `main`, y en PRs cuya base sea cualquiera de esas ramas. `develop` y `main` requieren PR y el check `Verify`, con ramas actualizadas respecto a su base antes de fusionar. No se exigen aprobaciones obligatorias para permitir el flujo de un solo responsable; esto no sustituye la revisión y autorización del responsable.

## Versiones e historial

- `CHANGELOG.md` empieza en `Unreleased`; no se reconstruyen versiones o releases que nunca se etiquetaron.
- No se incrementa `package.json` por cada despliegue del sitio. El SHA identifica exactamente cada build.
- Crear una etiqueta SemVer y un GitHub Release solo cuando se decida publicar un hito con versión. Si se adopta SemVer, usar `MAJOR.MINOR.PATCH` conforme a los cambios incompatibles, funcionalidad compatible y correcciones.
- La Preview de `develop` y sus datos siguen siendo de prueba; no usarla como si fuese producción.
