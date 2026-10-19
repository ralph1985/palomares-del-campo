export interface NearbyPlaceSource {
  label: string;
  href: string;
}

export interface NearbyPlaceRouteEstimate {
  distanceKm: number;
  durationMinutes: number;
  destinationLabel: string;
}

export interface NearbyPlace {
  slug: string;
  name: string;
  municipality: string;
  category: string;
  group: 'nearby' | 'day-trip';
  summary: string;
  visitNote?: string;
  routeEstimate?: NearbyPlaceRouteEstimate;
  sources: NearbyPlaceSource[];
}

export const nearbyPlacesReviewedAt = '2026-10-19';

export const nearbyPlaceGroups = [
  {
    id: 'nearby',
    title: 'Cerca de Palomares',
    intro:
      'Patrimonio y paisaje para descubrir en el entorno inmediato. Algunas fichas no incluyen una distancia: preferimos eso a dar una ruta hasta un punto equivocado.',
  },
  {
    id: 'day-trip',
    title: 'Escapadas para dedicarles más tiempo',
    intro:
      'Lugares conocidos de la provincia que pueden completar una visita de medio día o una jornada.',
  },
] as const;

export const nearbyPlaces: NearbyPlace[] = [
  {
    slug: 'mina-mora-encantada',
    name: 'Mina de la Mora Encantada',
    municipality: 'Torrejoncillo del Rey',
    category: 'Arqueología · lapis specularis',
    group: 'nearby',
    summary:
      'Una mina romana de lapis specularis, el yeso translúcido que se extraía en esta zona y que estuvo ligado al desarrollo de Segóbriga.',
    visitNote:
      'La visita requiere reserva o confirmación previa. Comprueba las condiciones en la ficha oficial antes de desplazarte.',
    sources: [
      {
        label: 'Ficha oficial de la mina',
        href: 'https://www.turismocastillalamancha.es/es/cultura-y-patrimonio/arqueologia/mina-de-la-mora-encantada---lapis-specularis',
      },
    ],
  },
  {
    slug: 'laguna-el-hito',
    name: 'Laguna de El Hito',
    municipality: 'El Hito y Montalbo',
    category: 'Naturaleza · humedal estacional',
    group: 'nearby',
    summary:
      'Una reserva natural y zona de paso de grullas. El paisaje cambia mucho según la estación y el nivel de agua.',
    visitNote:
      'Sigue los caminos señalizados y comprueba los itinerarios autorizados antes de ir; el acceso y la observación varían según la estación.',
    sources: [
      {
        label: 'Información oficial de El Hito',
        href: 'https://www.turismocastillalamancha.es/es/naturaleza/lagunas/laguna-de-el-hito',
      },
    ],
  },
  {
    slug: 'segobriga-saelices',
    name: 'Segóbriga y Saelices',
    municipality: 'Saelices',
    category: 'Arqueología romana',
    group: 'nearby',
    summary:
      'El parque arqueológico conserva espacios públicos de una ciudad romana, como el teatro, el anfiteatro y el foro. Saelices permite completar la visita con el contexto de la localidad.',
    routeEstimate: {
      distanceKm: 28.1,
      durationMinutes: 38,
      destinationLabel: 'Parque Arqueológico de Segóbriga',
    },
    sources: [
      {
        label: 'Parque Arqueológico de Segóbriga',
        href: 'https://www.turismocastillalamancha.es/es/cultura-y-patrimonio/arqueologia/parque-arqueologico-de-segobriga',
      },
      {
        label: 'Qué ver en Saelices',
        href: 'https://www.turismocastillalamancha.es/es/destinos/encanto-rural/cuenca/saelices',
      },
    ],
  },
  {
    slug: 'huete-lapis-specularis',
    name: 'Huete y las minas de lapis specularis',
    municipality: 'Huete y Saceda del Río',
    category: 'Patrimonio · historia minera',
    group: 'nearby',
    summary:
      'Huete reúne patrimonio histórico y museos; en su entorno se encuentran las Cuevas de Sanabrio, una visita vinculada a la minería romana del lapis specularis.',
    visitNote:
      'Las cuevas son un recurso distinto del casco urbano. Confirma su acceso y condiciones directamente antes de organizar la visita.',
    routeEstimate: {
      distanceKm: 36.4,
      durationMinutes: 38,
      destinationLabel: 'Casco urbano de Huete',
    },
    sources: [
      {
        label: 'Qué ver en Huete',
        href: 'https://www.turismocastillalamancha.es/es/destinos/encanto-rural/cuenca/huete',
      },
      {
        label: 'Cuevas de Sanabrio',
        href: 'https://www.turismocastillalamancha.es/es/cultura-y-patrimonio/arqueologia/minas-de-las-cuevas-de-sanabrio-de-saceda-del-rio-%28lapis-specularis%29',
      },
    ],
  },
  {
    slug: 'ucles',
    name: 'Monasterio de Uclés',
    municipality: 'Uclés',
    category: 'Patrimonio · Orden de Santiago',
    group: 'nearby',
    summary:
      'El monasterio domina la localidad desde el cerro del castillo y forma parte de un conjunto histórico ligado a la Orden de Santiago.',
    routeEstimate: {
      distanceKm: 41.7,
      durationMinutes: 40,
      destinationLabel: 'Monasterio de Uclés',
    },
    sources: [
      {
        label: 'Qué ver en Uclés',
        href: 'https://www.turismocastillalamancha.es/es/destinos/encanto-rural/cuenca/ucles',
      },
    ],
  },
  {
    slug: 'belmonte',
    name: 'Castillo y villa de Belmonte',
    municipality: 'Belmonte',
    category: 'Patrimonio · castillo y casco histórico',
    group: 'day-trip',
    summary:
      'Una escapada para conocer el castillo y el conjunto histórico de Belmonte, más allá de la visita a la fortaleza.',
    routeEstimate: {
      distanceKm: 54.7,
      durationMinutes: 62,
      destinationLabel: 'Castillo de Belmonte',
    },
    sources: [
      {
        label: 'Qué ver en Belmonte',
        href: 'https://www.turismocastillalamancha.es/es/destinos/encanto-rural/cuenca/belmonte',
      },
    ],
  },
  {
    slug: 'cuenca',
    name: 'Casas Colgadas y casco histórico de Cuenca',
    municipality: 'Cuenca',
    category: 'Patrimonio · ciudad histórica',
    group: 'day-trip',
    summary:
      'La ciudad histórica, declarada Patrimonio Mundial, permite combinar arquitectura, museos y un recorrido a pie por el casco antiguo.',
    routeEstimate: {
      distanceKm: 55,
      durationMinutes: 46,
      destinationLabel: 'Casas Colgadas de Cuenca',
    },
    sources: [
      {
        label: 'Información turística de Cuenca',
        href: 'https://www.turismocastillalamancha.es/es/destinos/encanto-rural/cuenca/cuenca',
      },
    ],
  },
  {
    slug: 'ciudad-encantada',
    name: 'Ciudad Encantada',
    municipality: 'Valdecabras · Cuenca',
    category: 'Naturaleza · monumento natural',
    group: 'day-trip',
    summary:
      'Un recorrido señalizado entre formaciones calizas modeladas por la erosión, en plena Serranía de Cuenca.',
    visitNote:
      'El circuito ronda los 3 km y no está adaptado para personas con movilidad reducida ni cochecitos. El cierre varía con la época y la meteorología; revisa la información oficial antes de salir.',
    routeEstimate: {
      distanceKm: 78.9,
      durationMinutes: 73,
      destinationLabel: 'Acceso a la Ciudad Encantada',
    },
    sources: [
      {
        label: 'Ficha oficial de visita',
        href: 'https://www.turismocastillalamancha.es/es/naturaleza/monumentos-naturales/ciudad-encantada-de-cuenca',
      },
    ],
  },
  {
    slug: 'villa-romana-noheda',
    name: 'Villa Romana de Noheda',
    municipality: 'Villar de Domingo García',
    category: 'Arqueología romana · mosaico',
    group: 'day-trip',
    summary:
      'Un yacimiento romano conocido por su mosaico figurativo y una visita distinta a la de la ciudad de Segóbriga.',
    visitNote:
      'El yacimiento se visita con guía y reserva previa. El centro de interpretación tiene información de acceso propia.',
    routeEstimate: {
      distanceKm: 61.1,
      durationMinutes: 50,
      destinationLabel: 'Villa Romana de Noheda',
    },
    sources: [
      {
        label: 'Ficha oficial de la Villa Romana de Noheda',
        href: 'https://www.turismocastillalamancha.es/es/cultura-y-patrimonio/arqueologia/villa-romana-de-noheda',
      },
    ],
  },
  {
    slug: 'mota-del-cuervo',
    name: 'Molinos de Mota del Cuervo',
    municipality: 'Mota del Cuervo',
    category: 'Patrimonio · molinos y paisaje',
    group: 'day-trip',
    summary:
      'Los molinos son la imagen más reconocible de Mota del Cuervo; la visita puede ampliarse con la alfarería y el entorno lagunar.',
    routeEstimate: {
      distanceKm: 69.9,
      durationMinutes: 73,
      destinationLabel: 'Molinos de Mota del Cuervo',
    },
    sources: [
      {
        label: 'Qué ver en Mota del Cuervo',
        href: 'https://www.turismocastillalamancha.es/es/destinos/encanto-rural/cuenca/mota-del-cuervo',
      },
      {
        label: 'Molinos de Mota del Cuervo',
        href: 'https://www.turismocastillalamancha.es/es/cultura-y-patrimonio/molinos/cuenca/molinos-de-viento-de-mota-del-cuervo',
      },
    ],
  },
];
