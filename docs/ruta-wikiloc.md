# Ruta de Wikiloc en `/rutas/`

## Fuente y tratamiento editorial

- Título publicado: **Palomares del Campo a La Cantera**.
- Autor que muestra la ficha original: **Joaquin Alcarria**.
- Fuente: [ficha original en Wikiloc](https://es.wikiloc.com/rutas-senderismo/palomares-del-campo-a-la-cantera-54551889).
- El Ayuntamiento no presenta este recorrido como ruta municipal oficial ni lo ha verificado sobre el terreno. La página remite a la ficha de origen para sus detalles y cambios.

La ayuda oficial de Wikiloc describe la opción **Compartir → Embed Map** para incrustar rutas propias o de otros usuarios y generar el iframe autorizado: [ayuda de Wikiloc sobre incrustar rutas](https://help.wikiloc.com/article/259-share-embed-iframe-insert-embed-trail-route-wikiloc-web-blog-digital-online-html). La integración usa el código oficial facilitado para esta ruta; sus comillas tipográficas se normalizaron a comillas ASCII por sintaxis HTML. Se conservan literalmente el endpoint y sus parámetros:

```text
https://es.wikiloc.com/wikiloc/embedv2.do?id=54551889&elevation=on&images=on&maptype=H
```

El iframe mantiene las dimensiones de referencia `600 × 500`, `frameBorder=0` y `scrolling=no`; el contenedor adapta su ancho al espacio disponible. La atribución visible conserva **Powered by Wikiloc** y añade el crédito a Joaquin Alcarria y el enlace a la ficha original.

## Carga, accesibilidad y fallback

La página no crea un iframe con `src` ni solicita recursos a Wikiloc durante la carga inicial. Explica el contacto externo y solo inserta el iframe oficial cuando la persona pulsa **Cargar mapa de Wikiloc**. No se guarda el consentimiento: la acción se solicita en cada visita. El iframe tiene un título accesible; el estado de carga se anuncia con `role="status"`; la alternativa con enlace directo a Wikiloc permanece visible incluso si el iframe aparece vacío, es bloqueado o no termina de cargar. La carga del mapa no es requisito para consultar la ficha original.

La prueba Playwright intercepta el endpoint para comprobar la ausencia de solicitudes antes del clic, el `src` exacto después, el fallback y el comportamiento en móvil. Una respuesta simulada prueba el comportamiento de la web, no la disponibilidad del servicio real. La navegación de verificación al endpoint en el entorno automatizado mostró la comprobación anti-bots de Cloudflare; no se eludió. La respuesta real de Wikiloc debe considerarse dependiente del proveedor y del navegador del visitante.

## Privacidad y límites

Wikiloc aloja el contenido del iframe. Su [política de privacidad y cookies](https://es.wikiloc.com/wikiloc/privacy_es.html?v=4.3) describe el tratamiento de datos técnicos como IP y navegación, y el uso de cookies del servicio. El botón impide la carga automática y evita una solicitud antes de la acción del visitante; **no se presenta como un gestor general de consentimiento ni como una conclusión jurídica de cumplimiento**. La adecuación del mecanismo, el inventario real de cookies y su aprobación municipal/legal siguen pendientes de revisión.

No se ha descargado, copiado, convertido, almacenado ni redistribuido el GPX o las coordenadas de Wikiloc. La aplicación publica el endpoint de incrustación autorizado y el enlace a la ficha de origen; no copia la geometría del recorrido. Leaflet y OpenStreetMap siguen utilizándose en las otras áreas de mapas del sitio, no para esta ruta.
