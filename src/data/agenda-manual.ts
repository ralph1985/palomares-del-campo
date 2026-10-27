import type { AgendaItem } from './current-affairs';

const summerProgrammeSource = {
  label: 'Palomares del Campo Informa',
  href: 'https://www.bandomovil.com/palomaresdelcampo/1608976/0',
  publishedAt: '2026-07-31T07:00:00.000Z',
};

const jccmThermalismSource = {
  label: 'Palomares del Campo Informa',
  href: 'https://www.bandomovil.com/palomaresdelcampo/1508150/0',
  publishedAt: '2026-02-20T10:14:00.000Z',
};

const imsersoThermalismSource = {
  label: 'Palomares del Campo Informa',
  href: 'https://www.bandomovil.com/palomaresdelcampo/1452409/0',
  publishedAt: '2025-11-18T12:09:00.000Z',
};

const augustTheatreSource = {
  label: 'Palomares del Campo Informa',
  href: 'https://www.bandomovil.com/palomaresdelcampo/1624850/0',
  publishedAt: '2026-08-18T09:57:00.000Z',
};

const postponedTheatreSource = {
  label: 'Palomares del Campo Informa',
  href: 'https://www.bandomovil.com/palomaresdelcampo/1623193/0',
  publishedAt: '2026-08-15T18:31:00.000Z',
};

const historicalTalkSource = {
  label: 'Palomares del Campo Informa',
  href: 'https://www.bandomovil.com/palomaresdelcampo/1624901/0',
  publishedAt: '2026-08-18T10:22:00.000Z',
};

const healthWorkshopsSource = {
  label: 'Palomares del Campo Informa',
  href: 'https://www.bandomovil.com/vercomunicado.php?cod_municipio=palomaresdelcampo&id=1668814',
  publishedAt: '2026-10-27T10:17:26.000Z',
};

const elderJornadasSource = {
  label: 'Palomares del Campo Informa',
  href: 'https://www.bandomovil.com/palomaresdelcampo/1432518/0',
  publishedAt: '2025-10-17T07:43:00.000Z',
};

/*
 * El programa general situaba el pádel el 21–22 de agosto; el bando específico posterior 1624971
 * anunció el campeonato el 28–29. Se conserva la fecha de esa convocatoria específica.
 */
/* El aviso específico del eclipse cita 19:00 y 19:30; se conserva sin hora única. */
export const manualAgendaItems: AgendaItem[] = [
  {
    id: 'municipal:health-workshops-2026',
    kind: 'event',
    title: 'Talleres de Salud y Actividades Comunitarias',
    startDate: '2026-11-03',
    startTime: '10:00',
    category: 'Actividad pública',
    location: 'Biblioteca de Palomares',
    summary: 'Talleres sobre actividad física, alimentación saludable y bienestar emocional.',
    source: healthWorkshopsSource,
  },
  {
    id: 'municipal:summer-2026-flamenco',
    kind: 'event',
    title: 'Baile flamenco y discoteca móvil',
    startDate: '2026-08-01',
    startTime: '20:00',
    category: 'Cultura y ocio',
    location: 'Polideportivo municipal',
    summary:
      'Espectáculo de baile flamenco «Beatriz y Elena» y discoteca móvil, a cargo de la Afición Taurina Palomareña.',
    source: summerProgrammeSource,
  },
  {
    id: 'municipal:summer-2026-collections',
    kind: 'event',
    title: 'Exposición de colecciones',
    startDate: '2026-08-04',
    endDate: '2026-08-31',
    category: 'Exposición',
    location: 'Asociación de Mujeres',
    summary:
      'Colecciones de Margarita Millán Cañas, Juli Fernández Gila y María Luisa Rodrigo, expuestas durante todo agosto.',
    source: summerProgrammeSource,
  },
  {
    id: 'municipal:summer-2026-billa-bolos',
    kind: 'event',
    title: 'Campeonato de billa y bolos finlandeses',
    startDate: '2026-08-06',
    startTime: '19:30',
    category: 'Deportes',
    location: 'Polideportivo de la Plaza de Toros',
    summary: 'Actividad para jóvenes y adultos.',
    source: summerProgrammeSource,
  },
  {
    id: 'municipal:summer-2026-games-semi',
    kind: 'event',
    title: 'Campeonatos de Brisca, Tute y Parchís',
    startDate: '2026-08-13',
    startTime: '17:30',
    category: 'Actividades para mayores',
    location: 'Hogar del pensionista',
    summary: 'Semifinal para público adulto, a cargo de la Asociación de Mayores.',
    source: summerProgrammeSource,
  },
  {
    id: 'municipal:summer-2026-women-activity',
    kind: 'event',
    title: 'Actividad cultural de la Asociación de Mujeres',
    startDate: '2026-08-13',
    startTime: '22:00',
    category: 'Cultura y ocio',
    location: 'Plaza del Coso',
    summary: 'Actividad incluida en la programación Talía.',
    source: summerProgrammeSource,
  },
  {
    id: 'municipal:summer-2026-games-final',
    kind: 'event',
    title: 'Campeonatos de Brisca, Tute y Parchís',
    startDate: '2026-08-14',
    startTime: '17:30',
    category: 'Actividades para mayores',
    location: 'Hogar del pensionista',
    summary: 'Final para público adulto, a cargo de la Asociación de Mayores.',
    source: summerProgrammeSource,
  },
  {
    id: 'municipal:theatre-2026-aug-20',
    kind: 'event',
    title: 'Teatro',
    startDate: '2026-08-20',
    startTime: '22:00',
    category: 'Cultura',
    location: 'Salón de Actos de la Casa de Cultura Palomares de Campo',
    summary:
      'Noche de Teatro: «Novios de Internet» (José Cedena), «Secretico de Confesión» y «Ganas de Reñir» (Hermanos Álvarez Quintero).',
    source: augustTheatreSource,
  },
  {
    id: 'municipal:elder-jornadas-2025',
    kind: 'event',
    title: 'Nuestros mayores, nuestra memoria viva',
    startDate: '2025-10-24',
    startTime: '10:00',
    category: 'Actividades para mayores',
    location: 'POLIDEPORTIVO MUNICIPAL',
    summary:
      'Jornadas de 10:00 a 13:00 con exposición fotográfica, mesa redonda sobre envejecer en el medio rural, poesía, concurso de refranes, taller intergeneracional y lectura del manifiesto por los derechos de las personas mayores.',
    source: elderJornadasSource,
  },
  {
    id: 'municipal:historical-talk-2026',
    kind: 'event',
    title: 'Charla jornadas',
    startDate: '2026-08-21',
    startTime: '19:30',
    category: 'Historia y cultura',
    location: 'Iglesia',
    summary:
      'Jornadas históricas sobre la Cofradía del Santísimo: charla «La Fuente el Pez y el culto a San Miguel en Palomares del Campo». Organiza la Cofradía del Santísimo.',
    source: historicalTalkSource,
  },
  /* El cartel adjunto del aviso 1623193 fija el sábado 29; el texto breve usa una fecha relativa distinta. */
  {
    id: 'municipal:theatre-2026-postponed',
    kind: 'event',
    title: 'Obras del grupo de teatro local',
    startDate: '2026-08-29',
    category: 'Cultura',
    summary:
      'El cartel aplaza al sábado 29 las obras «Novios de Internet», «Secretico de confesión» y «Ganas de reñir», inicialmente programadas para el 16 y 17 de agosto por la situación local.',
    source: postponedTheatreSource,
  },
  {
    id: 'municipal:tender-114-2026',
    kind: 'deadline',
    title: 'Fin del plazo de ofertas · edificio de usos múltiples',
    startDate: '2026-10-26',
    deadlineTime: '14:00',
    category: 'Licitación pública',
    audience: 'businesses',
    summary:
      'Presentación electrónica de ofertas para las obras del edificio de usos múltiples de Plaza del Coso, 13 (expediente 114/2026). Dirigido a empresas.',
    source: {
      label: 'Plataforma de Contratación del Sector Público',
      href: 'https://contrataciondelestado.es/wps/poc?uri=deeplink:detalle_licitacion&idEvl=7K4zNBUeDP6KeVWTb9Scog%3D%3D',
      publishedAt: '2026-10-06',
    },
  },
  {
    id: 'municipal:imserso-thermalism-2026-turn-1',
    kind: 'deadline',
    title: 'Solicitud del Termalismo IMSERSO 2026 · primer turno',
    startDate: '2025-12-04',
    category: 'Trámite público',
    audience: 'residents',
    summary: 'Plazo final para el primer turno de estancias, de febrero a agosto de 2026.',
    source: imsersoThermalismSource,
  },
  {
    id: 'municipal:imserso-thermalism-2026-turn-2',
    kind: 'deadline',
    title: 'Solicitud del Termalismo IMSERSO 2026 · segundo turno',
    startDate: '2026-05-15',
    category: 'Trámite público',
    audience: 'residents',
    summary: 'Plazo final para el segundo turno de estancias, de septiembre a diciembre de 2026.',
    source: imsersoThermalismSource,
  },
  {
    id: 'municipal:jccm-thermalism-2026',
    kind: 'deadline',
    title: 'Solicitudes del Termalismo JCCM 2026',
    startDate: '2026-02-21',
    endDate: '2026-12-15',
    category: 'Trámite público',
    audience: 'residents',
    summary:
      'Plazo del único turno de solicitudes, del 21 de febrero al 15 de diciembre de 2026. Consulta el bando para los canales de información y presentación.',
    source: jccmThermalismSource,
  },
];
