# Tratamiento de datos: Palomareños por el mundo

## Estado

Borrador operativo para revisión del responsable del tratamiento y, si procede, del delegado de protección de datos. La página pública asociada es `/privacidad/#palomarenos-por-el-mundo`.

## Responsable

- Responsable previsto: Ayuntamiento de Palomares del Campo.
- Dirección: Plaza del Coso, 1, Palomares del Campo, Cuenca.
- Contacto operativo publicado actualmente: `ayto.palomares@gmail.com`.
- Pendiente de confirmar: identidad jurídica exacta del responsable para este tratamiento y contacto del delegado de protección de datos, si resulta aplicable.

## Finalidades

1. Recibir y gestionar propuestas de historias.
2. Contactar con la persona remitente cuando sea necesario para revisar, corregir o retirar una historia.
3. Moderar manualmente el contenido antes de publicarlo.
4. Publicar, cuando exista aprobación, el nombre mostrado, ciudad, país y texto de la historia.
5. Enviar avisos operativos sobre la propuesta y su aprobación.
6. Proteger el formulario frente a automatización y abuso.

No se usan los datos para publicidad, perfiles comerciales, suscripciones ni decisiones editoriales automatizadas.

## Base jurídica de trabajo

Se propone utilizar el consentimiento de la persona remitente para enviar la propuesta y autorizar la publicación si se aprueba. El consentimiento se solicita mediante una casilla no premarcada, con información básica visible y enlace a la información completa.

Debe confirmarse con el responsable si alguna finalidad debe apoyarse en otra base jurídica, especialmente la seguridad del servicio y las obligaciones de conservación.

## Datos tratados

### Datos aportados

- Nombre que la persona quiere mostrar.
- Ciudad.
- País.
- Historia.
- Email de contacto.
- Fecha de consentimiento y fecha de alta.

### Datos derivados u operativos

- Estado editorial: `pending`, `approved`, `rejected` o `withdrawn`.
- Coordenadas aproximadas asignadas durante la moderación.
- Estado e identificador de las notificaciones.
- Nota interna de moderación.
- Clave normalizada del email para el límite antiabuso; no se publica.
- Resultado técnico de Turnstile y rate limiting. No se guarda el token de Turnstile como dato editorial.

No se solicitan direcciones exactas ni fotografías en este primer corte.

## Publicación

Solo las fichas `approved` aparecen en el mapa. La proyección pública contiene únicamente:

- identificador técnico;
- nombre mostrado;
- ciudad;
- país;
- coordenadas aproximadas;
- historia.

El email, la clave normalizada, el consentimiento, las notas de moderación, los estados internos y los datos de notificación quedan fuera de la consulta pública.

## Proveedores

- **Convex:** almacenamiento, mutaciones, consultas y acciones del flujo.
- **Resend:** envío de avisos al moderador y a la persona creadora cuando procede.
- **Cloudflare Turnstile:** protección antibot. El navegador recibe el widget y Convex verifica el token server-side.
- **OpenStreetMap/Leaflet:** cartografía y visualización; no recibe el email ni la historia desde el backend.

Antes de publicar en producción se debe revisar la relación contractual, las condiciones de tratamiento y las garantías de transferencia internacional de cada proveedor. No se deben presentar como encargados, responsables independientes o proveedores europeos sin confirmación contractual.

## Conservación propuesta

- Mientras una propuesta esté pendiente, se conserva durante el periodo necesario para su revisión y posibles aclaraciones.
- Las propuestas rechazadas se conservan solo durante el periodo necesario para gestionar incidencias, derechos, duplicados y responsabilidades legales.
- Las historias aprobadas se conservan mientras sigan publicadas.
- El email de contacto se mantiene separado de la información pública y se elimina cuando ya no sea necesario para gestionar la historia, su retirada o una incidencia.
- Tras la retirada o el fin de la finalidad, se elimina o anonimiza la información cuando ya no sea necesaria, salvo obligación legal o necesidad de defensa de reclamaciones.

El responsable debe convertir estos criterios en plazos concretos y alinearlos con su política general de conservación y copias de seguridad.

## Derechos y retirada

La página pública informa de los derechos de acceso, rectificación, supresión, oposición, limitación y, cuando proceda, portabilidad. También ofrece un canal para retirar el consentimiento y pedir la retirada de una historia publicada.

El operador debe verificar la identidad de la persona solicitante antes de aplicar cambios que afecten a una ficha. La retirada debe impedir que la ficha siga apareciendo en `listApproved`; los registros internos se eliminan o anonimizan conforme al plazo aprobado.

## Seguridad y abuso

- Límites server-side: nombre 80, ciudad 80, país 80, historia 1200 y email 254 caracteres.
- Consentimiento obligatorio.
- Estado inicial forzado a `pending`.
- Coordenadas no aceptadas desde el cliente.
- Honeypot enviado y validado server-side.
- Rate limiting: tres propuestas por email normalizado en una ventana de una hora.
- Turnstile verificado en una acción server-side antes de la mutación interna.
- Moderación manual antes de publicar.
- Proyección pública redactada.
- Emails HTML escapados y notificaciones idempotentes.

## Fuentes de trabajo

- Reglamento (UE) 2016/679, especialmente artículos 5, 6, 12-14, 15-22, 25, 28, 32 y 44-49.
- AEPD: derecho de información y presentación por capas.
- AEPD: derechos de las personas.
- Cloudflare Turnstile: integración, validación server-side y privacidad del widget.

## Aviso legal

La ruta pública `/aviso-legal/` se ha creado con una franja visible de borrador y datos de prueba para completar la estructura durante el desarrollo. Antes de publicar debe sustituirse, como mínimo:

- `P0000000X` por el NIF/CIF oficial.
- `L00000000` por el DIR3 o dato registral que corresponda.
- `dpd-prueba@example.invalid` por el contacto real del DPD, si procede.
- La fecha y cualquier dato institucional pendiente.

No presentar esta página como definitiva mientras conserve la marca `DATO DE PRUEBA — SUSTITUIR`.

## Pendientes antes de producción

- Confirmar responsable jurídico y contacto del DPD, si corresponde.
- Confirmar base jurídica definitiva por finalidad.
- Aprobar plazos de conservación concretos.
- Revisar contratos, DPA y transferencias de Convex, Resend y Cloudflare.
- Confirmar el texto público con el responsable jurídico.
- Revisar el hostname de producción de Turnstile.
- Ejecutar una prueba manual mediante `palomaresdelcampo.conquense.dev`.
