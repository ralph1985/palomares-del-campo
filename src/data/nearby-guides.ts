import type { ImageMetadata } from 'astro';
import segobrigaTeatro from '../assets/nearby-guides/Segobriga_teatro.webp';
import segobrigaAnfi from '../assets/nearby-guides/Segobriga_anfi.webp';
import minaMoraEncantada from '../assets/nearby-guides/Mina_de_la_Mora_Encantada.webp';
import nohedaMosaico from '../assets/nearby-guides/Noheda_mosaico.webp';
import nohedaEscenas from '../assets/nearby-guides/Noheda_mosaico_escenas.webp';

export interface NearbyGuideImage {
  src: ImageMetadata;
  alt: string;
  caption: string;
  author: string;
  fileUrl: string;
  license: string;
  licenseUrl: string;
}

export interface NearbyGuideSection {
  heading: string;
  paragraphs: string[];
}

export interface NearbyPlaceGuide {
  slug: string;
  title: string;
  description: string;
  eyebrow: string;
  introduction: string;
  sections: NearbyGuideSection[];
  images: NearbyGuideImage[];
  beforeYouGo: string;
  visitUrl: string;
  visitLabel: string;
  sources: { label: string; href: string }[];
}

export const nearbyPlaceGuidesReviewedAt = '2026-10-24';

export const nearbyPlaceGuides: NearbyPlaceGuide[] = [
  {
    slug: 'segobriga-saelices',
    title: 'Segóbriga: una ciudad romana en la Meseta',
    description:
      'Guía para descubrir el teatro, el anfiteatro y el paisaje arqueológico de Segóbriga desde Palomares del Campo.',
    eyebrow: 'Parque arqueológico · Saelices',
    introduction:
      'Segóbriga conserva los espacios públicos de una ciudad romana en un paisaje abierto de la Meseta. La visita permite leer el conjunto sobre el terreno: del teatro y el anfiteatro a los restos del foro.',
    sections: [
      {
        heading: 'Qué merece la pena mirar',
        paragraphs: [
          'El centro de interpretación es una buena puerta de entrada: combina piezas originales, audiovisuales y reconstrucciones virtuales. En el parque, el teatro, el anfiteatro y el foro ofrecen distintas pistas sobre la vida pública de la ciudad.',
          'La visita arqueológica se entiende mejor como un paseo por varias áreas, no como una parada breve ante un único monumento. Lleva calzado cómodo y cuenta con que buena parte del recorrido transcurre al aire libre.',
        ],
      },
      {
        heading: 'Una parada que conecta con la comarca',
        paragraphs: [
          'El lapis specularis —yeso translúcido extraído en minas de la zona— enlaza la historia de Segóbriga con explotaciones como la Mina de la Mora Encantada. Son recursos distintos y sus visitas se organizan por separado; no des por hecho que una entrada o reserva sirve para ambos.',
          'Desde Palomares, la ficha de esta guía estima 28,1 km y unos 38 minutos en coche hasta el parque. Es una orientación de ruta, no una previsión de tráfico ni de aparcamiento.',
        ],
      },
    ],
    images: [
      {
        src: segobrigaTeatro,
        alt: 'Vista del teatro romano de Segóbriga entre las estructuras arqueológicas',
        caption: 'Teatro romano de Segóbriga.',
        author: 'VIATOR IMPERI from HISPANIA',
        fileUrl: 'https://commons.wikimedia.org/wiki/File:Seg%C3%B3briga_(36923392175).jpg',
        license: 'CC BY-SA 2.0',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
      },
      {
        src: segobrigaAnfi,
        alt: 'Vista general del anfiteatro romano de Segóbriga',
        caption: 'Anfiteatro de Segóbriga.',
        author: 'Malopez 21',
        fileUrl:
          'https://commons.wikimedia.org/wiki/File:Seg%C3%B3briga,_anfiteatro,_vista_general.jpg',
        license: 'CC BY-SA 4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      },
    ],
    beforeYouGo:
      'Horarios, tarifas, acceso a los espacios y servicios pueden variar. Revisa la información oficial antes de desplazarte; la guía no gestiona entradas ni reservas.',
    visitUrl:
      'https://www.turismocastillalamancha.es/es/cultura-y-patrimonio/arqueologia/parque-arqueologico-de-segobriga',
    visitLabel: 'Información oficial del Parque Arqueológico de Segóbriga',
    sources: [
      {
        label: 'Parque Arqueológico de Segóbriga',
        href: 'https://www.turismocastillalamancha.es/es/cultura-y-patrimonio/arqueologia/parque-arqueologico-de-segobriga',
      },
      {
        label: 'Qué ver en Saelices',
        href: 'https://www.turismocastillalamancha.es/es/destinos/encanto-rural/cuenca/saelices',
      },
      {
        label: 'Centro de Interpretación de Segóbriga',
        href: 'https://www.turismocastillalamancha.es/es/cultura-y-patrimonio/museos/cuenca/centro-de-interpretacion-del-yacimiento-de-segobriga',
      },
    ],
  },
  {
    slug: 'mina-mora-encantada',
    title: 'La Mora Encantada y el lapis specularis',
    description:
      'Una guía para entender la antigua mina de yeso especular de Torrejoncillo del Rey y preparar la visita con reserva previa.',
    eyebrow: 'Arqueología minera · Torrejoncillo del Rey',
    introduction:
      'La Mora Encantada permite acercarse a la minería romana del lapis specularis, un yeso translúcido extraído en esta comarca. Su interés está tanto bajo tierra como en la historia que comparte con otros enclaves mineros y con Segóbriga.',
    sections: [
      {
        heading: 'Qué es el lapis specularis',
        paragraphs: [
          'El nombre se aplica al yeso cristalino y translúcido que podía cortarse en láminas. En época romana se utilizó como material de cerramiento y dejó una huella minera singular en el entorno de Cuenca.',
          'La Mora Encantada conserva más de un kilómetro de galerías, excavadas a más de 40 metros de profundidad, con pozos y zonas de extracción diferenciadas. La ficha oficial señala que el sector más profundo se inunda con frecuencia; confirma qué recorrido está habilitado antes de ir.',
          'La leyenda de un tesoro custodiado por una princesa mora dio nombre al cerro. Según la ficha oficial, esa historia impulsó el redescubrimiento de la mina en 1953.',
          'La mina de Torrejoncillo del Rey es una visita diferente a las Cuevas de Sanabrio y al parque de Segóbriga. Aunque forman parte de un mismo paisaje histórico, cada lugar tiene su propio acceso y condiciones.',
        ],
      },
      {
        heading: 'La visita empieza antes de salir',
        paragraphs: [
          'La ficha turística oficial indica que es imprescindible llamar para reservar y estima unos 45 minutos de visita. Confirma disponibilidad, punto de encuentro y condiciones directamente con la organización antes de emprender el viaje; no basta con llegar a la localidad.',
          'La fotografía muestra una galería de la propia Mina de la Mora Encantada. Respeta las indicaciones del personal y no abandones el recorrido habilitado: una mina histórica no es un espacio para explorar por libre.',
        ],
      },
    ],
    images: [
      {
        src: minaMoraEncantada,
        alt: 'Interior de una galería de la Mina de la Mora Encantada, en Torrejoncillo del Rey',
        caption: 'Galería de la Mina de la Mora Encantada.',
        author: '19Tarrestnom65',
        fileUrl:
          'https://commons.wikimedia.org/wiki/File:Minas_de_la_Mora_Encantada,_Torrejoncillo_del_Rey_05.jpg',
        license: 'CC BY-SA 4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      },
    ],
    beforeYouGo:
      'La ficha oficial indica que es imprescindible reservar por teléfono. Comprueba el horario de temporada, la disponibilidad y las condiciones vigentes antes de desplazarte.',
    visitUrl:
      'https://www.turismocastillalamancha.es/es/cultura-y-patrimonio/arqueologia/mina-de-la-mora-encantada---lapis-specularis',
    visitLabel: 'Ficha oficial de la Mina de la Mora Encantada',
    sources: [
      {
        label: 'Mina de la Mora Encantada · lapis specularis',
        href: 'https://www.turismocastillalamancha.es/es/cultura-y-patrimonio/arqueologia/mina-de-la-mora-encantada---lapis-specularis',
      },
      {
        label: 'Cuevas de Sanabrio',
        href: 'https://www.turismocastillalamancha.es/es/cultura-y-patrimonio/arqueologia/minas-de-las-cuevas-de-sanabrio-de-saceda-del-rio-%28lapis-specularis%29',
      },
    ],
  },
  {
    slug: 'villa-romana-noheda',
    title: 'Noheda: mosaicos y vida en una villa romana',
    description:
      'Guía de la Villa Romana de Noheda, conocida por su mosaico figurativo, con recomendaciones para reservar la visita guiada.',
    eyebrow: 'Villa romana · Villar de Domingo García',
    introduction:
      'Noheda ofrece una mirada distinta a la arqueología romana: no una ciudad, sino una villa cuyo gran mosaico figurativo conserva escenas de gran complejidad. El yacimiento y su centro de interpretación forman parte de una visita que hay que planificar.',
    sections: [
      {
        heading: 'El mosaico como relato',
        paragraphs: [
          'El mosaico figurativo es el elemento más conocido de la villa. Sus escenas mitológicas y teatrales invitan a detenerse en los personajes y la composición, no solo a contemplar el tamaño de la pieza.',
          'Las imágenes de esta página muestran el mosaico de Noheda; no sustituyen la visita ni garantizan que todas las áreas estén abiertas en cada fecha.',
        ],
      },
      {
        heading: 'Cómo organizar la visita',
        paragraphs: [
          'La web oficial indica que todas las visitas son guiadas, que no existe acceso libre y que las entradas se adquieren online. Revisa las fechas y las plazas disponibles en el canal de reservas antes de viajar.',
          'Se accede desde la N-320; tras pasar la pedanía de Noheda, el desvío al yacimiento está a unos 2 km. El recorrido al aire libre puede cambiar con la meteorología. El Centro de Interpretación es un espacio distinto y tiene servicios adaptados; esa condición no se debe extrapolar al yacimiento.',
          'La ficha de esta guía estima 61,1 km y unos 50 minutos en coche desde Palomares hasta la villa. La cifra es orientativa: confirma la ruta y deja margen para llegar con antelación.',
        ],
      },
    ],
    images: [
      {
        src: nohedaMosaico,
        alt: 'Detalle del mosaico romano de la Villa de Noheda, con figuras y decoración geométrica',
        caption: 'Detalle del mosaico de la villa.',
        author: 'Ernestobanpiroa',
        fileUrl: 'https://commons.wikimedia.org/wiki/File:Nohedako_mosaikoa.jpg',
        license: 'CC BY-SA 4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      },
      {
        src: nohedaEscenas,
        alt: 'Escena del mosaico de Noheda con una troupe de mimos y pantomimos',
        caption: 'Escena de mimos y pantomimos en el mosaico.',
        author: 'Fotografía de Rodelar, retocada por Égoïté',
        fileUrl: 'https://commons.wikimedia.org/wiki/File:Villa_romana_de_Noheda_09-revised.jpg',
        license: 'CC BY 4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      },
    ],
    beforeYouGo:
      'La visita es guiada y requiere entrada reservada online; no se venden entradas en el yacimiento. La organización recomienda llegar al menos 15 minutos antes. Confirma horario, disponibilidad y condiciones en la web oficial.',
    visitUrl: 'https://www.villanoheda.org/entradas/',
    visitLabel: 'Reservas oficiales de Noheda',
    sources: [
      {
        label: 'Villa Romana de Noheda · Turismo de Castilla-La Mancha',
        href: 'https://www.turismocastillalamancha.es/es/cultura-y-patrimonio/arqueologia/villa-romana-de-noheda',
      },
      {
        label: 'Centro de Interpretación de la Villa Romana de Noheda',
        href: 'https://www.turismocastillalamancha.es/es/cultura-y-patrimonio/arqueologia/centro-de-interpretacion-de-la-villa-romana-de-noheda',
      },
      {
        label: 'Entradas y condiciones de visita · Villa Romana de Noheda',
        href: 'https://www.villanoheda.org/entradas/',
      },
    ],
  },
];
