export type ServiceStatus =
  | 'confirmado-por-propietario'
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
    status: 'confirmado-por-propietario',
    summary:
      'El propietario confirma que está abierto. Una ficha pública secundaria publica dirección y horario, pero esos datos no se han contrastado con el establecimiento.',
    source: {
      label: 'Ficha de TodoBares (referencia secundaria; detalles por verificar)',
      url: 'https://www.todobares.com/bar/bar-los-arcos-palomares-del-campo/',
    },
  },
  {
    id: 'pub-colins',
    name: 'Pub Colin’s',
    category: 'hosteleria',
    status: 'confirmado-por-propietario',
    summary:
      'El propietario confirma que está abierto. Una ficha pública secundaria lo identifica en Palomares, pero dirección, teléfono y horario actuales no se han contrastado.',
    source: {
      label: 'Ficha de Restaurant Guru (referencia secundaria; detalles por verificar)',
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
      'UNIDE anunció en 2024 la apertura de un supermercado Udaco en Palomares del Campo. Ese anuncio no acredita que continúe abierto actualmente.',
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
      'Un reportaje local la describió como panadería de Palomares y documentó elaboración y venta ambulante en la fecha del artículo. No confirma actividad actual ni que la razón social citada sea una enseña comercial vigente.',
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
      'Un directorio externo menciona una carnicería con este nombre en Palomares. La ficha no permite confirmar si sigue abierta, su ubicación actual ni sus datos de contacto.',
    source: {
      label: 'Ficha de Carnicerías Ibéricas (directorio; actividad sin confirmar)',
      url: 'https://carniceriasibericas.com/castilla-la-mancha/cuenca/palomares-del-campo/carniceria-dionisio/',
    },
  },
  // TODO(AYTO)[SVC-07]: Aclarar si Frutas Millán C. B. es un comercio actual o una ficha histórica; confirmar denominación y actividad.
  {
    id: 'frutas-millan',
    name: 'Frutas Millán C. B.',
    category: 'comercio',
    status: 'documentado-sin-estado-operativo',
    summary:
      'Figura en un directorio comercial como Frutas Millán C. B. La ficha no confirma actividad actual; no se muestran dirección ni teléfono sin contraste.',
    source: {
      label: 'Ficha de Páginas Amarillas (directorio; actividad sin confirmar)',
      url: 'https://www.paginasamarillas.es/f/palomares-del-campo/frutas-millan-c-b-_224351429_000000001.html',
    },
  },
  // TODO(AYTO)[SVC-02]: Confirmar qué Centro Médico, biblioteca, Centro de Internet, Wi-Fi de Casa de Cultura y piscina siguen operativos, indicar otros espacios públicos o culturales abiertos y facilitar ubicación y horario de cada servicio vigente.
  {
    id: 'consultorio-local',
    name: 'Centro Médico',
    category: 'salud',
    status: 'catalogo-municipal-sin-verificacion',
    summary:
      'Incluido en el catálogo municipal como Centro Médico; no se ha podido verificar el tipo de atención, ubicación, funcionamiento u horario actual.',
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
    summary:
      'Incluida en el catálogo municipal de servicios; apertura, ubicación y horario actuales no verificados.',
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
    summary:
      'Incluido en el catálogo municipal; disponibilidad, ubicación y condiciones actuales no verificadas.',
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
    summary:
      'El catálogo municipal menciona el servicio; cobertura y disponibilidad actuales no verificadas.',
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
    summary:
      'Figura en el catálogo municipal; no se ha localizado una fuente pública actual que confirme apertura o temporada vigente.',
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
    summary:
      'Mención del catálogo municipal, no anuncio de una edición vigente. Fechas, oferta y continuidad pendientes de confirmación.',
    source: {
      label: 'Catálogo de Servicios del Ayuntamiento',
      url: 'https://palomaresdelcampo.dipucuenca.es/index.php/shortcodes/catalogo-de-servicios',
    },
  },
];

// Candidatos de directorio que no se presentan como negocios hasta resolver su denominación y vigencia:
// TODO(AYTO)[SVC-05]: Investigar Justo Ruiz Gómez como posible titular/persona, sin inferir enseña comercial ni actividad actual.
// TODO(AYTO)[SVC-06]: Verificar si Mercedes del Río Fraile identifica un estanco vigente o solo una ficha antigua/titular.

export const serviceStatusLabels: Record<ServiceStatus, string> = {
  'confirmado-por-propietario':
    'Actividad confirmada por su propietario; datos de contacto pendientes',
  'documentado-provisional': 'Existencia documentada; actividad actual pendiente de confirmar',
  'catalogo-municipal-sin-verificacion':
    'Mencionado en catálogo municipal; estado actual sin verificar',
  'documentado-sin-estado-operativo': 'Aparece en fuente pública; estado operativo sin verificar',
};
