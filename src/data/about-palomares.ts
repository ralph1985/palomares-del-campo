export interface AboutSource {
  label: string;
  href: string;
}

export interface AboutImage {
  src: string;
  alt: string;
  sourceLabel: string;
  sourceHref: string;
}

export interface HeritageFeature {
  eyebrow: string;
  title: string;
  description: string;
  body: string;
  source: AboutSource;
}

export const aboutPalomares = {
  pageTitle: 'Sobre Palomares del Campo',
  pageDescription:
    'Historia, patrimonio, paisaje y fiestas de Palomares del Campo, en la provincia de Cuenca.',
  landingEyebrow: 'Palomares del Campo · Cuenca',
  landingTitle: 'Un pueblo con muchas capas de historia.',
  landingIntro:
    'Palomares del Campo reúne paisaje agrícola, memoria romana, patrimonio religioso y fiestas que siguen poniendo al pueblo en movimiento.',
  heroImage: {
    src: 'https://palomaresdelcampo.dipucuenca.es/images/PALOMARES_DEL_CAMPO/NUESTRA_SE%C3%91ORA_DE_LA_ASUNCION_2.jpg',
    alt: 'Fachada de la iglesia de Nuestra Señora de la Asunción de Palomares del Campo',
    sourceLabel: 'Fotografía: portal municipal',
    sourceHref: 'https://palomaresdelcampo.dipucuenca.es/index.php/layout/layout-three',
  } satisfies AboutImage,
  history: {
    eyebrow: 'Historia y territorio',
    title: 'Una historia ligada al territorio',
    paragraphs: [
      'El término municipal conserva huellas de ocupación humana desde la Prehistoria, con hallazgos vinculados a La Laguna y la Moheda, además de presencia calcolítica y asentamientos de la Edad del Bronce.',
      'Durante la época romana, estas tierras quedaron vinculadas al territorio de Segóbriga. El entorno también conserva la memoria de la explotación del lapis specularis, el llamado cristal de Hispania.',
      'La población medieval se desarrolló como aldea vinculada a Huete. La tradición historiográfica local sitúa su creación en el contexto de la repoblación posterior a la Reconquista y, en 1553, Palomares del Campo se constituyó en villa de realengo.',
      'Ese siglo dejó parte de la identidad monumental que todavía reconocemos: la iglesia parroquial, la ermita de la Virgen de la Cabeza y la huella de la familia de Hernando de Alarcón, natural de la villa y virrey de Nápoles.',
    ],
    source: {
      label: 'Historia del portal municipal',
      href: 'https://palomaresdelcampo.dipucuenca.es/index.php/layout/layout-4',
    },
  },
  heritage: [
    {
      eyebrow: 'Patrimonio religioso',
      title: 'Iglesia de Nuestra Señora de la Asunción',
      description: 'Un templo renacentista que conserva capas artísticas de varios siglos.',
      body: 'Su construcción comenzó en 1553 y la fachada se terminó en 1638. El conjunto reúne arquitectura, capillas funerarias, retablos, pintura y escultura de los siglos XVI al XVIII.',
      source: {
        label: 'Qué ver en el portal municipal',
        href: 'https://palomaresdelcampo.dipucuenca.es/index.php/layout/layout-three',
      },
    },
    {
      eyebrow: 'Devoción y memoria',
      title: 'Ermita de la Virgen de la Cabeza',
      description: 'Un espacio ligado a la patrona, al Santo Cristo de la Paz y a la Semana Santa.',
      body: 'La ermita ya tenía licencia para celebrar misa en 1597. Su interior conserva imaginería y retablos vinculados a la tradición barroca y a las celebraciones religiosas del municipio.',
      source: {
        label: 'Qué ver en el portal municipal',
        href: 'https://palomaresdelcampo.dipucuenca.es/index.php/layout/layout-three',
      },
    },
    {
      eyebrow: 'Arqueología y paisaje',
      title: 'Fuente del Pez y Castillo de San Miguel',
      description:
        'Un enclave donde se cruzan la frontera medieval, el agua y la memoria del despoblado.',
      body: 'La zona conserva restos de una torre, de la antigua ermita y de la aldea de Fuente el Pez. El conjunto se completa con la Fuente Chica, la Fuente Grande y el paisaje de su entorno.',
      source: {
        label: 'Qué ver en el portal municipal',
        href: 'https://palomaresdelcampo.dipucuenca.es/index.php/layout/layout-three',
      },
    },
  ] satisfies HeritageFeature[],
  traditions: {
    eyebrow: 'La vida del pueblo',
    title: 'Fiestas y memoria viva',
    description:
      'Las fiestas patronales mantienen una relación directa con la música, las cuadrillas, la danza y el encuentro entre generaciones.',
    image: {
      src: 'https://palomaresdelcampo.dipucuenca.es/images/PALOMARES_DEL_CAMPO/FIESTAS_1.jpg',
      alt: 'Escena de las fiestas de Palomares del Campo',
      sourceLabel: 'Fotografía: portal municipal',
      sourceHref: 'https://palomaresdelcampo.dipucuenca.es/index.php/layout/layout-three',
    } satisfies AboutImage,
    items: [
      {
        title: 'Virgen de la Cabeza',
        text: 'Se celebra el último fin de semana de abril. Los tunos, danzantes y gitanillas forman parte de una tradición que incluye paloteos y otros bailes.',
      },
      {
        title: 'Santo Cristo de la Paz',
        text: 'Tiene lugar el último fin de semana de septiembre y reúne a peñas, vecinos y visitantes alrededor de las fiestas del patrón.',
      },
    ],
    source: {
      label: 'Fiestas y patrimonio de Palomares',
      href: 'https://palomaresdelcampo.dipucuenca.es/index.php/layout/layout-three',
    },
  },
  landscape: {
    eyebrow: 'Paisaje y situación',
    title: 'La Alcarria conquense, a escala de paseo',
    text: 'Palomares del Campo se sitúa en el norte de la provincia de Cuenca, entre lomas suaves, campos de cultivo y caminos rurales. La ficha turística regional destaca su paisaje agrícola y su cercanía a la capital conquense.',
    image: {
      src: 'https://palomaresdelcampo.dipucuenca.es/images/PALOMARES_DEL_CAMPO/FUENTE_DEL_PEZ_Y_CASTILLO_DE_SAN_MIGUEL.jpg',
      alt: 'Fuente del Pez y restos del Castillo de San Miguel en el entorno de Palomares del Campo',
      sourceLabel: 'Fotografía: portal municipal',
      sourceHref: 'https://palomaresdelcampo.dipucuenca.es/index.php/layout/layout-three',
    } satisfies AboutImage,
    source: {
      label: 'Ficha de Turismo de Castilla-La Mancha',
      href: 'https://www.turismocastillalamancha.es/es/destinos/encanto-rural/cuenca/palomares-del-campo',
    },
    directions: {
      label: 'Cómo llegar',
      href: 'https://palomaresdelcampo.dipucuenca.es/index.php/layout/layout-two',
    },
  },
  sources: [
    {
      label: 'Historia · portal municipal',
      href: 'https://palomaresdelcampo.dipucuenca.es/index.php/layout/layout-4',
    },
    {
      label: 'Qué ver · portal municipal',
      href: 'https://palomaresdelcampo.dipucuenca.es/index.php/layout/layout-three',
    },
    {
      label: 'Situación · portal municipal',
      href: 'https://palomaresdelcampo.dipucuenca.es/index.php/layout/layout-two',
    },
    {
      label: 'Turismo de Castilla-La Mancha',
      href: 'https://www.turismocastillalamancha.es/es/destinos/encanto-rural/cuenca/palomares-del-campo',
    },
  ] satisfies AboutSource[],
};
