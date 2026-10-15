# Operación: retirada de Palomareños por el mundo

## Alcance

La primera versión no tiene cuentas de participantes ni panel de administración público. Las retiradas se gestionan mediante una operación interna de Convex cuando Rafa lo solicite expresamente.

La retirada no se hace desde el navegador público y no se debe crear un panel solo para resolver este caso.

## Qué hace la retirada

La operación interna `internal.palomarenos.withdraw`:

- cambia el estado editorial a `withdrawn`;
- registra `reviewedAt`;
- conserva una nota interna opcional;
- mantiene los datos internos para la gestión de la solicitud y los plazos legales;
- impide que la ficha aparezca en `api.palomarenos.listApproved` y, por tanto, en el mapa;
- no expone el email, la nota ni el estado interno.

No elimina físicamente el registro. La eliminación o anonimización dependerá de los plazos de conservación que apruebe el Ayuntamiento.

## Información necesaria para actuar

Preferencia de identificación, en este orden:

1. ID de Convex de la ficha.
2. Nombre mostrado, ciudad y país, si no hay ID.
3. Otros datos de contexto que permitan distinguirla sin ambigüedad.

Si hay más de una coincidencia, no se debe retirar ninguna por intuición: hay que pedir una confirmación adicional.

El email no se solicita ni se publica como mecanismo de identificación en el mapa.

## Procedimiento operativo para el asistente

Cuando Rafa pida retirar una historia:

1. Confirmar qué ficha se quiere retirar. Si el identificador es ambiguo, pedir el dato que falte.
2. Seleccionar explícitamente el deployment correcto. Durante desarrollo es `dev/europe-ireland`; producción será independiente.
3. Leer la ficha mediante la consulta interna `internal.palomarenos.getById`.
4. Comprobar que el ID, nombre, ciudad y país corresponden a la solicitud.
5. Ejecutar la mutación interna `internal.palomarenos.withdraw` con:
   - `id` de la ficha;
   - `reviewNote` breve, por ejemplo: `Retirada solicitada por Rafa.`
6. Leer de nuevo la ficha y comprobar `status: withdrawn`.
7. Consultar `api.palomarenos.listApproved` y verificar que la ficha ya no aparece.
8. Informar de la retirada solo después de verificar ambos estados.

No se debe ejecutar una eliminación física como sustituto de este procedimiento.

## Comportamiento e idempotencia

- Una ficha inexistente produce `palomareno-not-found`.
- Una ficha ya retirada produce `palomareno-already-withdrawn` para evitar ocultar una segunda operación o sobrescribir su contexto.
- Una ficha pendiente, aprobada o rechazada puede pasar a `withdrawn` mediante la operación interna.
- Las coordenadas y el email permanecen fuera de la proyección pública aunque sigan en el registro interno.

## Evidencia mínima que se debe conservar en la respuesta operativa

Sin incluir datos privados innecesarios:

- ID técnico de la ficha;
- estado anterior;
- estado nuevo: `withdrawn`;
- timestamp de la operación;
- confirmación de que no aparece en `listApproved`;
- deployment utilizado.

No se deben copiar emails, tokens, claves ni valores completos de configuración en el chat o en documentos públicos.

## Notificaciones

La retirada no envía automáticamente un correo al creador en esta primera versión. Si la persona necesita una respuesta, se debe tratar como una comunicación separada y usar el canal operativo aprobado, sin exponer el email.

## Pendientes legales

Antes de producción deben confirmarse:

- plazos de conservación del registro retirado;
- cuándo anonimizar o eliminar el email;
- nota interna admisible y periodo de conservación;
- procedimiento de verificación de identidad de quien solicita la retirada;
- si debe enviarse una confirmación al creador.

La operación técnica no sustituye la decisión jurídica. Mientras esos criterios no estén aprobados, se retira la visibilidad pública y se conserva el registro interno sin borrado destructivo.

## Pruebas y contrato

El comportamiento queda cubierto por:

- prueba del parche de retirada con estado, timestamp y nota;
- prueba de que una ficha `withdrawn` no se convierte en proyección pública;
- pruebas de integración/E2E del mapa y la proyección pública existentes.

Las funciones internas no forman parte del API público del frontend.
