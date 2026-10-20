# Matriz de configuración: Palomareños por el mundo

## Propósito

Este documento describe qué configuración necesita cada entorno para publicar **Palomareños por el mundo**. La matriz contiene nombres de variables, responsables y reglas de validación, pero nunca valores secretos.

El despliegue de Convex producción, la creación o modificación del proyecto Vercel, los cambios DNS y la configuración de secretos siguen siendo autorizaciones separadas.

## Entornos y límites

| Entorno          | Frontend                           | Backend                                                                      | Hostname esperado                         | Uso                                                        |
| ---------------- | ---------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------- |
| Desarrollo local | Astro local                        | `dev/europe-ireland`                                                         | `localhost`, Tailscale o equivalente      | Desarrollo y pruebas controladas                           |
| Playwright       | Servidor gestionado por Playwright | Backend de desarrollo o fixture controlada                                   | Host local del runner                     | Widget Turnstile simulado; no usa claves reales            |
| Preview          | Vercel Preview                     | `dev/europe-ireland` (compartido con desarrollo local; usar datos de prueba) | `develop.palomaresdelcampo.conquense.dev` | Revisión previa; no debe usar el widget real de producción |
| Producción       | Vercel Production                  | Deployment Convex de producción independiente                                | `palomaresdelcampo.conquense.dev`         | Servicio público                                           |

El deployment Convex de desarrollo no debe reutilizarse como backend de producción.

## Variables del frontend

Estas variables llegan al build de Astro y pueden formar parte del navegador. No deben contener secretos.

| Variable                     | Entorno                       | Servicio               | Visibilidad | Obligatoria                          | Validación                                                                                      |
| ---------------------------- | ----------------------------- | ---------------------- | ----------- | ------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `CONVEX_URL`                 | Desarrollo/Preview/Producción | Astro y cliente Convex | Pública     | Sí para mapa y formulario remotos    | Debe ser la URL HTTPS del deployment Convex previsto para ese entorno                           |
| `PUBLIC_TURNSTILE_SITE_KEY`  | Desarrollo/Preview/Producción | Widget Turnstile       | Pública     | Sí cuando se habilita Turnstile real | Debe corresponder al widget y hostname del entorno                                              |
| `PUBLIC_TURNSTILE_HOSTNAMES` | Desarrollo/Preview/Producción | Guard del formulario   | Pública     | Recomendable                         | Lista separada por comas; producción debe contener únicamente `palomaresdelcampo.conquense.dev` |

En Playwright se usa una clave sintética y un widget simulado mediante `window.__PALOMARENOS_TURNSTILE_TEST__`. Ese bypass solo existe en modo de desarrollo y en los tests; no es una alternativa para producción.

## Variables privadas de Convex

Estas variables solo deben configurarse en el deployment Convex correspondiente. Nunca deben exponerse al frontend, documentarse con su valor ni guardarse en Git.

| Variable                      | Entorno               | Uso                                 | Obligatoria            | Validación                                                            |
| ----------------------------- | --------------------- | ----------------------------------- | ---------------------- | --------------------------------------------------------------------- |
| `RESEND_API_KEY`              | Desarrollo/Producción | Autenticación HTTPS con Resend      | Sí para notificaciones | Presente en el panel de Convex y válida para el remitente configurado |
| `RESEND_FROM`                 | Desarrollo/Producción | Remitente de las notificaciones     | Sí para notificaciones | Dominio/remitente autorizado por Resend                               |
| `REPORT_TO`                   | Desarrollo/Producción | Destinatario del aviso al moderador | Sí para notificaciones | Dirección operativa confirmada; no publicar su valor en el frontend   |
| `TURNSTILE_SECRET_KEY`        | Desarrollo/Producción | Verificación server-side del token  | Sí para propuestas     | Pertenece al mismo widget que la clave pública                        |
| `TURNSTILE_ALLOWED_HOSTNAMES` | Desarrollo/Producción | Restricción de hostname server-side | Sí                     | En producción: `palomaresdelcampo.conquense.dev`                      |
| `TURNSTILE_EXPECTED_ACTION`   | Desarrollo/Producción | Restricción de acción Turnstile     | Sí                     | En este proyecto: `submit-story`                                      |

La configuración de Resend y Turnstile de desarrollo no debe copiarse automáticamente a producción. Los valores se introducen directamente en el panel seguro del deployment.

## Reglas por entorno

### Desarrollo local

- Puede apuntar a `dev/europe-ireland`.
- La revisión por Tailscale no está autorizada por el widget real de producción.
- El formulario debe evitar cargar Turnstile real en un hostname no autorizado.
- Las pruebas E2E pueden utilizar el widget simulado documentado arriba.
- Las propuestas y fichas sintéticas deben permanecer identificables como datos de desarrollo.

### Preview

- No debe utilizar automáticamente `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY` ni la clave pública de producción.
- Puede usar un widget de pruebas o mantener el envío deshabilitado.
- Debe apuntar a un backend expresamente elegido para preview, nunca al backend de producción por defecto.
- Las propuestas de prueba deben usar direcciones no entregables y poder localizarse para su retirada.

### Producción

- `CONVEX_URL` debe apuntar al deployment Convex de producción.
- El hostname autorizado debe ser exactamente `palomaresdelcampo.conquense.dev`.
- Turnstile debe utilizar el widget y las claves asociadas al dominio público.
- Convex debe comenzar sin historias de demostración ni propuestas sintéticas.
- Las claves privadas deben estar configuradas en Convex, no en Vercel ni en el navegador.

## Comprobaciones antes de publicar

- [ ] El deployment Convex de producción es independiente de `dev/europe-ireland`.
- [ ] `CONVEX_URL` de producción apunta al backend correcto.
- [ ] La clave pública y la secreta de Turnstile pertenecen al mismo widget.
- [ ] `TURNSTILE_ALLOWED_HOSTNAMES` contiene el dominio público final.
- [ ] `TURNSTILE_EXPECTED_ACTION` es `submit-story`.
- [ ] Resend tiene autorizado el remitente elegido.
- [ ] `REPORT_TO` corresponde al canal operativo aprobado.
- [ ] No hay valores secretos en Git, `.env.example`, documentación ni logs.
- [ ] Preview no reutiliza las credenciales de producción.
- [ ] El backend de producción no contiene datos de demostración.
- [ ] La configuración legal está aprobada antes de abrir el formulario público.

## Dónde se guardan los valores reales

- **Convex:** variables privadas de backend (`RESEND_*`, `REPORT_TO`, `TURNSTILE_SECRET_KEY` y controles server-side).
- **Vercel:** variables públicas necesarias para compilar el frontend (`CONVEX_URL`, `PUBLIC_TURNSTILE_SITE_KEY` y, si procede, `PUBLIC_TURNSTILE_HOSTNAMES`).
- **Desarrollo local:** `.env.local`, fuera de Git y sin compartir sus valores.
- **Repositorio:** solo esta matriz, nombres de variables, reglas y comprobaciones.

## Relación con el plan de producción

Las tareas de creación de recursos, configuración de secretos, DNS y despliegue permanecen en `.hermes/plans/2026-10-14_palomarenos-produccion.md`. Este documento es la referencia operativa de variables y separación de entornos; no autoriza por sí mismo ninguna publicación.
