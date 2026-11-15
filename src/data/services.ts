export type ServiceStatus =
  | 'activo'
  | 'documentado-provisional'
  | 'catalogo-municipal-sin-verificacion'
  | 'documentado-sin-estado-operativo';
export type ServiceCategory =
  'hosteleria' | 'comercio' | 'salud' | 'cultura' | 'deporte' | 'espacio-publico' | 'conectividad';

export const serviceCategoryLabels: Record<ServiceCategory, string> = {
  hosteleria: 'Hostelería',
  comercio: 'Comercio',
  salud: 'Salud',
  cultura: 'Cultura',
  deporte: 'Deporte',
  'espacio-publico': 'Espacios públicos',
  conectividad: 'Conectividad',
};

export interface ServiceRecord {
  id: string;
  name: string;
  category: ServiceCategory;
  status: ServiceStatus;
  summary: string;
  source: { label: string; url: string; sourceDate?: string };
  address?: string;
  phone?: string;
  hours?: string;
}

export const servicesReviewedAt = '2026-11-15';

export const services: ServiceRecord[] = [
  // TODO(AYTO)[SVC-01]: Contrastar con ambos propietarios las direcciones, teléfonos y horarios antes de mostrarlos.
  {
    id: 'bar-los-arcos',
    name: 'Bar Los Arcos',
    category: 'hosteleria',
    status: 'activo',
    summary: 'Bar de hostelería en Palomares del Campo.',
    source: {
      label: 'Ficha de TodoBares',
      url: 'https://www.todobares.com/bar/bar-los-arcos-palomares-del-campo/',
    },
  },
  {
    id: 'pub-colins',
    name: 'Pub Colin’s',
    category: 'hosteleria',
    status: 'activo',
    summary: 'Pub en Palomares del Campo.',
    source: {
      label: 'Ficha de Restaurant Guru',
      url: 'https://es.restaurantguru.com/Pub-Colins-Palomares-del-Campo',
    },
  },
  // TODO(AYTO)[SVC-04]: Resolver si el local Udaco anunciado en 2024 continúa abierto.
  {
    id: 'udaco-alimentacion',
    name: 'Udaco Alimentación',
    category: 'comercio',
    status: 'documentado-provisional',
    summary:
      'UNIDE anunció en 2024 la apertura de un Udaco en Palomares; el anuncio no confirma que siga abierto.',
    source: {
      label: 'Anuncio de apertura de UNIDE',
      url: 'https://tu.unidesupermercados.es/nueva-apertura-en-palomares-del-campo/',
      sourceDate: '2024-06-28',
    },
  },
  // TODO(AYTO)[SVC-08]: Verificar la actividad actual con el titular y separar razón social y nombre comercial.
  {
    id: 'artesanias-molero-del-rio',
    name: 'Artesanías Molero del Río',
    category: 'comercio',
    status: 'documentado-provisional',
    summary:
      'Un reportaje de 2023 la describió como panadería y venta ambulante; no confirma actividad ni nombre comercial actuales.',
    source: {
      label: 'Reportaje de Las Noticias de Cuenca (referencia periodística)',
      url: 'https://www.lasnoticiasdecuenca.es/provincia/tradicion-digitalizacion-venta-ambulante-cuenca-70756',
      sourceDate: '2023-11-14',
    },
  },
  // TODO(AYTO)[SVC-09]: Confirmar la actividad actual de Carnicería Dionisio antes de presentarla como negocio abierto.
  {
    id: 'carniceria-dionisio',
    name: 'Carnicería Dionisio',
    category: 'comercio',
    status: 'documentado-sin-estado-operativo',
    summary:
      'Un directorio la menciona en Palomares; su actividad y ubicación actuales no están verificadas.',
    source: {
      label: 'Carnicerías Ibéricas (directorio)',
      url: 'https://carniceriasibericas.com/castilla-la-mancha/cuenca/palomares-del-campo/carniceria-dionisio/',
    },
  },
  // TODO(AYTO)[SVC-07]: Aclarar si Frutas Millán C. B. es un comercio actual o una ficha histórica; confirmar denominación y actividad.
  {
    id: 'frutas-millan',
    name: 'Frutas Millán C. B.',
    category: 'comercio',
    status: 'documentado-sin-estado-operativo',
    summary: 'Aparece en un directorio comercial; no se confirma su actividad actual.',
    source: {
      label: 'Páginas Amarillas (directorio)',
      url: 'https://www.paginasamarillas.es/f/palomares-del-campo/frutas-millan-c-b-_224351429_000000001.html',
    },
  },
  // TODO(AYTO)[SVC-05]: Confirmar si la referencia a Justo Ruiz Gómez corresponde a una carnicería vigente y cuál es su denominación; no publicarla como activa sin confirmación.
  {
    id: 'carniceria-justo-ruiz-gomez-candidata',
    name: 'Carnicería · candidato: Justo Ruiz Gómez',
    category: 'comercio',
    status: 'documentado-sin-estado-operativo',
    summary:
      'Una ficha de Páginas Amarillas lo relaciona con una carnicería en Palomares; no confirma actividad actual.',
    source: {
      label: 'Páginas Amarillas (directorio)',
      url: 'https://www.paginasamarillas.es/a/carne-establecimiento/cuenca/palomares-del-campo/',
    },
  },
  // TODO(AYTO)[SVC-06]: Verificar si Mercedes del Río Fraile es titular de esta expendeduría; el registro oficial consultado no identifica titulares.
  {
    id: 'expendeduria-tabaco-candidata',
    name: 'Estanco · candidato; titular por confirmar',
    category: 'comercio',
    status: 'documentado-sin-estado-operativo',
    summary:
      'El registro oficial recoge una expendeduría en Palomares; no indica titular ni nombre comercial.',
    source: {
      label: 'Registro oficial de expendedurías activas',
      url: 'https://serviciostelematicosext.hacienda.gob.es/CMT/Visor/csvExpendedurias.aspx',
      sourceDate: '2026-11-15',
    },
  },
  // TODO(AYTO)[SVC-02]: Confirmar qué Centro Médico, biblioteca, Centro de Internet, Wi-Fi de Casa de Cultura y piscina siguen operativos, indicar otros espacios públicos o culturales abiertos y facilitar ubicación y horario de cada servicio vigente.
  {
    id: 'consultorio-local',
    name: 'Centro Médico',
    category: 'salud',
    status: 'catalogo-municipal-sin-verificacion',
    summary: 'Catálogo municipal; atención, ubicación y horario actuales sin verificar.',
    source: {
      label: 'Catálogo de Servicios del Ayuntamiento',
      url: 'https://palomaresdelcampo.dipucuenca.es/index.php/shortcodes/catalogo-de-servicios',
    },
  },
  {
    id: 'biblioteca-municipal',
    name: 'Biblioteca',
    category: 'cultura',
    status: 'catalogo-municipal-sin-verificacion',
    summary: 'Incluida en el catálogo municipal; apertura y horario por confirmar.',
    source: {
      label: 'Catálogo de Servicios del Ayuntamiento',
      url: 'https://palomaresdelcampo.dipucuenca.es/index.php/shortcodes/catalogo-de-servicios',
    },
  },
  {
    id: 'centro-internet',
    name: 'Centro de Internet',
    category: 'conectividad',
    status: 'catalogo-municipal-sin-verificacion',
    summary: 'Incluido en el catálogo municipal; disponibilidad actual sin verificar.',
    source: {
      label: 'Catálogo de Servicios del Ayuntamiento',
      url: 'https://palomaresdelcampo.dipucuenca.es/index.php/shortcodes/catalogo-de-servicios',
    },
  },
  {
    id: 'wifi-casa-cultura',
    name: 'Wi-Fi en Casa de Cultura',
    category: 'conectividad',
    status: 'catalogo-municipal-sin-verificacion',
    summary: 'Mención del catálogo municipal; cobertura actual por confirmar.',
    source: {
      label: 'Catálogo de Servicios del Ayuntamiento',
      url: 'https://palomaresdelcampo.dipucuenca.es/index.php/shortcodes/catalogo-de-servicios',
    },
  },
  // TODO(AYTO)[SVC-03]: Aclarar si hay instalaciones deportivas municipales operativas o un proyecto vigente, con anuncio o expediente.
  {
    id: 'piscina-municipal',
    name: 'Piscina municipal',
    category: 'deporte',
    status: 'catalogo-municipal-sin-verificacion',
    summary: 'Figura en el catálogo municipal; apertura y temporada por confirmar.',
    source: {
      label: 'Catálogo de Servicios del Ayuntamiento',
      url: 'https://palomaresdelcampo.dipucuenca.es/index.php/shortcodes/catalogo-de-servicios',
    },
  },
  {
    id: 'actividades-deportivas-verano',
    name: 'Actividades físico-deportivas de verano para niños',
    category: 'deporte',
    status: 'catalogo-municipal-sin-verificacion',
    summary: 'Mención del catálogo municipal; fechas y continuidad por confirmar.',
    source: {
      label: 'Catálogo de Servicios del Ayuntamiento',
      url: 'https://palomaresdelcampo.dipucuenca.es/index.php/shortcodes/catalogo-de-servicios',
    },
  },
];

export const serviceStatusLabels: Record<ServiceStatus, string> = {
  activo: 'Abierto',
  'documentado-provisional': 'Pendiente de confirmar',
  'catalogo-municipal-sin-verificacion': 'Vigencia sin verificar',
  'documentado-sin-estado-operativo': 'Actividad sin verificar',
};
