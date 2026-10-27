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

export interface PatronalFestivalPhoto {
  title: string;
  alt: string;
  caption: string;
  author: string;
  fileUrl: string;
  license: string;
  licenseUrl: string;
  changeNote: string;
}

export interface HeritageFeature {
  eyebrow: string;
  title: string;
  description: string;
  body: string;
  source: AboutSource;
  detailHref?: string;
}

export const aboutPalomares = {
  pageTitle: 'Sobre Palomares del Campo',
  pageDescription:
    'Historia, patrimonio, paisaje y fiestas de Palomares del Campo, en la provincia de Cuenca.',
  landingEyebrow: 'Palomares del Campo · Cuenca',
  landingTitle: 'Historia, patrimonio y vida en Palomares del Campo',
  landingIntro:
    'Palomares del Campo conserva restos de época romana, edificios religiosos y tradiciones ligadas a la vida del municipio.',
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
      detailHref: '/sobre-el-pueblo/iglesia/',
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
    title: 'Dos fiestas patronales, una misma memoria',
    description:
      'Las fiestas de abril y septiembre se celebran en honor a las dos patronas de Palomares del Campo.',
    items: [
      {
        title: 'Virgen de la Cabeza',
        period: 'Último domingo de abril',
        text: 'El portal municipal recoge que ya en 1614 se celebraba en honor a la Virgen el «postrer domingo de abril». La fiesta tiene su epicentro en la ermita y se extiende alrededor de ese domingo.',
        detail:
          'Dulzainas y castañuelas anuncian la llegada de la fiesta; tunos, danzantes y gitanillas interpretan sus danzas, entre ellas el paloteo llamado «espá». La crónica de 2021 y el programa municipal de 2026 describen varios días de actos: hoguera, traslado y procesión, ofrecimiento de los niños y bendición de las casas.',
      },
      {
        title: 'Santo Cristo de la Paz',
        period: 'Último fin de semana de septiembre',
        text: 'Las fiestas reúnen a las peñas y a vecinos de distintas generaciones. El portal municipal también destaca los festejos taurinos del fin de semana.',
        detail:
          'El programa municipal de 2026, del 24 al 27 de septiembre, combinó ofrenda floral y procesión con actividades de las peñas, música y festejos taurinos. Es una muestra de una edición concreta, no un calendario permanente: los actos y horarios cambian cada año.',
      },
    ],
    photos: [
      {
        title: 'Imágenes de Palomares del Campo 09.jpg',
        alt: 'Vista general de la antigua ermita de la Virgen de la Cabeza en Palomares del Campo',
        caption: 'Vista general de la ermita, lugar central de las celebraciones de abril.',
        author: '19Tarrestnom65',
        fileUrl:
          'https://commons.wikimedia.org/wiki/File:Im%C3%A1genes_de_Palomares_del_Campo_09.jpg',
        license: 'CC BY-SA 4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
        changeNote: 'Fotografía orientada, redimensionada y convertida a WebP.',
      },
      {
        title: 'Imágenes de Palomares del Campo 10.jpg',
        alt: 'Espadaña de la antigua ermita de la Virgen de la Cabeza en Palomares del Campo',
        caption: 'Detalle de la espadaña de la ermita.',
        author: '19Tarrestnom65',
        fileUrl:
          'https://commons.wikimedia.org/wiki/File:Im%C3%A1genes_de_Palomares_del_Campo_10.jpg',
        license: 'CC BY-SA 4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
        changeNote: 'Fotografía orientada, redimensionada y convertida a WebP.',
      },
    ] satisfies [PatronalFestivalPhoto, PatronalFestivalPhoto],
    sources: [
      {
        label: 'Fiestas y patrimonio · portal municipal',
        href: 'https://palomaresdelcampo.dipucuenca.es/index.php/layout/layout-three',
      },
      {
        label: 'Programa Virgen de la Cabeza 2026 · Ayuntamiento',
        href: 'https://www.bandomovil.com/palomaresdelcampo/1538742/0',
      },
      {
        label: 'Programa Santo Cristo de la Paz 2026 · Ayuntamiento',
        href: 'https://www.bandomovil.com/vercomunicado.php?cod_municipio=palomaresdelcampo&id=1646002',
      },
      {
        label: 'Crónica de CMM sobre la procesión del ofrecimiento · 2026',
        href: 'https://www.cmmedia.es/noticias/castilla-la-mancha/cuenca/palomares-campo-cierra-fiestas-bendicion-patrona.html',
      },
      {
        label: 'La Virgen de la Cabeza en Palomares · Mirando al Santuario, 2021',
        href: 'https://www.virgendelacabeza.net/palomares-del-campo/',
      },
    ],
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
