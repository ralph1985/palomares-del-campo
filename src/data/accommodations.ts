export interface AccommodationSource {
  label: string;
  href: string;
}

export interface RuralAccommodation {
  name: string;
  location: string;
  area: 'Palomares del Campo' | 'Alrededores';
  category: string;
  capacity: string;
  rooms?: string;
  bathrooms?: string;
  summary: string;
  source: AccommodationSource;
  officialSource?: AccommodationSource;
}

export const accommodationReviewedAt = '2026-10-12';

export const ruralAccommodations: RuralAccommodation[] = [
  {
    name: 'Casa Rural San Cristóbal',
    location: 'Palomares del Campo',
    area: 'Palomares del Campo',
    category: 'Casa rural completa',
    capacity: 'Hasta 12 plazas',
    rooms: '5 dormitorios',
    bathrooms: '5 baños',
    summary: 'La opción localizada dentro del municipio para alojarse en una casa rural completa.',
    source: {
      label: 'Ficha consultada en TusCasasRurales.com',
      href: 'https://www.tuscasasrurales.com/casa-rural-san-cristobal-f20825.htm',
    },
    officialSource: {
      label: 'Sitio propio de Casa Rural San Cristóbal',
      href: 'https://www.casaruralsancristobalcuenca.es/',
    },
  },
  {
    name: 'El Capricho de Horcajada',
    location: 'Horcajada de la Torre',
    area: 'Alrededores',
    category: 'Casa rural completa',
    capacity: '14–15 plazas',
    rooms: '7 dormitorios',
    bathrooms: '7 baños',
    summary: 'Alojamiento íntegro orientado a grupos grandes, según la ficha consultada.',
    source: {
      label: 'Ficha consultada en TusCasasRurales.com',
      href: 'https://www.tuscasasrurales.com/el-capricho-de-horcajada-f17117.htm',
    },
  },
  {
    name: 'Casa Rural Las Cuevas',
    location: 'Huerta de la Obispalía',
    area: 'Alrededores',
    category: 'Casa rural completa',
    capacity: '10–12 plazas',
    rooms: '5 dormitorios',
    bathrooms: '3 baños',
    summary: 'Casa completa identificada en la localidad de Huerta de la Obispalía.',
    source: {
      label: 'Ficha consultada en TusCasasRurales.com',
      href: 'https://www.tuscasasrurales.com/casa-rural-las-cuevas-f20998.htm',
    },
  },
  {
    name: 'Casa Rural Tía Josefa',
    location: 'Villares del Saz',
    area: 'Alrededores',
    category: 'Casa rural completa o por habitaciones',
    capacity: '2–11 plazas',
    rooms: '4 dormitorios',
    bathrooms: '4 baños',
    summary: 'Permite consultar opciones de alquiler completo o por habitaciones.',
    source: {
      label: 'Ficha consultada en TusCasasRurales.com',
      href: 'https://www.tuscasasrurales.com/casa-rural-tia-josefa-f20966.htm',
    },
  },
  {
    name: 'Las Grullas',
    location: 'El Hito',
    area: 'Alrededores',
    category: 'Casa rural completa',
    capacity: '5–19 plazas',
    rooms: '10 dormitorios',
    bathrooms: '9 baños',
    summary: 'Antigua casa de labranza restaurada, con espacios para grupos y entorno rural.',
    source: {
      label: 'Ficha consultada en TusCasasRurales.com',
      href: 'https://www.tuscasasrurales.com/las-grullas-f3285.htm',
    },
  },
  {
    name: 'Casa Rural El Jardín de San Bartolomé',
    location: 'Carrascosa del Campo',
    area: 'Alrededores',
    category: 'Casa rural completa',
    capacity: 'Hasta 24 plazas',
    rooms: '11 dormitorios',
    bathrooms: '8 baños',
    summary: 'Casona tradicional de gran tamaño con jardín, según la ficha publicada.',
    source: {
      label: 'Ficha consultada en TusCasasRurales.com',
      href: 'https://www.tuscasasrurales.com/casa-rural-el-jardin-de-san-bartolome-f15160.htm',
    },
  },
  {
    name: 'Casa Rural El Chalán',
    location: 'Carrascosa del Campo',
    area: 'Alrededores',
    category: 'Casa rural completa o por habitaciones',
    capacity: '10–12 plazas',
    rooms: '5 dormitorios',
    bathrooms: '5 baños',
    summary: 'Alojamiento en el casco urbano, con alquiler completo o por habitaciones.',
    source: {
      label: 'Ficha consultada en TusCasasRurales.com',
      href: 'https://www.tuscasasrurales.com/casa-rural-el-chalan-f20927.htm',
    },
  },
  {
    name: 'Villa Segóbriga',
    location: 'Saelices',
    area: 'Alrededores',
    category: 'Casa rural completa',
    capacity: '6–8 plazas',
    rooms: '3 dormitorios',
    bathrooms: '2 baños',
    summary: 'Casa rural próxima al Parque Arqueológico de Segóbriga, según la ficha consultada.',
    source: {
      label: 'Ficha consultada en TusCasasRurales.com',
      href: 'https://www.tuscasasrurales.com/villa-segobriga-f12601.htm',
    },
  },
  {
    name: 'Apartamentos Rurales Puerta del Agua',
    location: 'Uclés',
    area: 'Alrededores',
    category: 'Apartamentos rurales',
    capacity: '4–20 plazas',
    rooms: '10 dormitorios',
    bathrooms: '8 baños',
    summary: 'Alojamiento rural en el casco urbano de Uclés, con información y contacto propios.',
    source: {
      label: 'Ficha consultada en TusCasasRurales.com',
      href: 'https://www.tuscasasrurales.com/apartamentos-rurales-puerta-del-agua-f507.htm',
    },
    officialSource: {
      label: 'Sitio propio de Puerta del Agua',
      href: 'https://puertadelagua.com/en/la-casa',
    },
  },
  {
    name: 'Casa Rural Ciudad de Luna',
    location: 'Huete',
    area: 'Alrededores',
    category: 'Casa rural completa',
    capacity: 'Hasta 10 plazas',
    rooms: '4 dormitorios',
    bathrooms: '5 baños',
    summary: 'Casa rehabilitada en un edificio del siglo XVIII en el casco urbano de Huete.',
    source: {
      label: 'Ficha consultada en TusCasasRurales.com',
      href: 'https://www.tuscasasrurales.com/casa-rural-ciudad-de-luna-f21143.htm',
    },
  },
];
