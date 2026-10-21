import { describe, expect, it } from 'vitest';
import {
  buildAgendaProjection,
  deriveAgendaItemsFromBando,
  parseBandoMarkdown,
} from '../../scripts/agenda-from-bandos.ts';
import { mergeAgendaItems } from '../../src/data/agenda-utils.ts';

const dniBando = {
  title: 'DNI electrónico',
  category: 'Info General',
  publishedAt: '2026-02-10T10:37:00.000Z',
  sourceName: 'Palomares del Campo Informa',
  sourceUrl: 'https://www.bandomovil.com/palomaresdelcampo/1501417/0',
  sourceId: '1501417',
  body: 'El próximo jueves, 12 de febrero a las 12:00 de la mañana habrá una presentación del uso del DNI electrónico. Lugar: Salón de Actos del Ayuntamiento.',
};

describe('agenda extraction from municipal notices', () => {
  it('extracts a dated public service and preserves its source', () => {
    expect(deriveAgendaItemsFromBando(dniBando)).toMatchObject([
      {
        kind: 'service',
        title: 'DNI electrónico',
        startDate: '2026-02-12',
        startTime: '12:00',
        category: 'Servicio público',
        location: 'Salón de Actos del Ayuntamiento',
        source: {
          label: 'Palomares del Campo Informa',
          href: 'https://www.bandomovil.com/palomaresdelcampo/1501417/0',
          publishedAt: '2026-02-10T10:37:00.000Z',
        },
      },
    ]);
  });

  it('classifies a dated municipal talk from its official notice', () => {
    expect(
      deriveAgendaItemsFromBando({
        title: 'CHARLA JORNADAS',
        category: 'Cultura',
        publishedAt: '2026-08-18T12:22:00.000Z',
        sourceName: 'Palomares del Campo Informa',
        sourceUrl: 'https://www.bandomovil.com/palomaresdelcampo/1624901/0',
        sourceId: '1624901',
        body: 'EL PRÓXIMO VIERNES, 21 DE AGOSTO, A LAS 19:30 HORAS.',
      }),
    ).toMatchObject([
      { kind: 'event', startDate: '2026-08-21', startTime: '19:30', title: 'Charla jornadas' },
    ]);
  });

  it('uses the quoted programme title from a generic jornadas notice', () => {
    expect(
      deriveAgendaItemsFromBando({
        title: 'JORNADAS',
        category: 'Info General',
        publishedAt: '2025-10-17T09:43:00.000Z',
        sourceName: 'Palomares del Campo Informa',
        sourceUrl: 'https://www.bandomovil.com/palomaresdelcampo/1432518/0',
        sourceId: '1432518',
        body: 'JORNADAS "NUESTROS MAYORES, NUESTRA MEMORIA VIVA" EL PRÓXIMO 24 DE OCTUBRE DE 2025 EN EL POLIDEPORTIVO MUNICIPAL.',
      }),
    ).toMatchObject([
      {
        kind: 'event',
        title: 'Nuestros mayores, nuestra memoria viva',
        startDate: '2025-10-24',
        location: 'POLIDEPORTIVO MUNICIPAL',
      },
    ]);
  });

  it('extracts a public application deadline from the notice publication year', () => {
    expect(
      deriveAgendaItemsFromBando({
        title: 'ESCUELA DE VERANO 2025',
        category: 'Info General',
        publishedAt: '2025-06-26T13:30:00.000Z',
        sourceName: 'Palomares del Campo Informa',
        sourceUrl: 'https://www.bandomovil.com/palomaresdelcampo/1358089/0',
        sourceId: '1358089',
        body: 'Los niños deberán rellenar el formulario de inscripción hasta el 13 de julio.',
      }),
    ).toMatchObject([
      {
        kind: 'deadline',
        title: 'Escuela de verano 2025',
        startDate: '2025-07-13',
        category: 'Trámite público',
      },
    ]);
  });

  it('resolves yearless January and February dates and ranges into the next year from autumn', () => {
    const singleDate = deriveAgendaItemsFromBando({
      title: 'Concierto de invierno',
      category: 'Cultura',
      publishedAt: '2025-12-01T09:00:00.000Z',
      sourceName: 'Palomares del Campo Informa',
      sourceUrl: 'https://www.bandomovil.com/palomaresdelcampo/1001/0',
      sourceId: '1001',
      body: 'El concierto tendrá lugar el 20 de enero.',
    });
    expect(singleDate).toMatchObject([{ kind: 'event', startDate: '2026-01-20' }]);

    expect(
      deriveAgendaItemsFromBando({
        title: 'Concierto de invierno',
        category: 'Cultura',
        publishedAt: '2025-12-01T09:00:00.000Z',
        sourceName: 'Palomares del Campo Informa',
        sourceUrl: 'https://www.bandomovil.com/palomaresdelcampo/1001/0',
        sourceId: '1001',
        body: 'Concierto de invierno del 20 al 31 de enero.',
      }),
    ).toMatchObject([{ kind: 'event', startDate: '2026-01-20', endDate: '2026-01-31' }]);

    expect(
      deriveAgendaItemsFromBando({
        title: 'Curso de invierno',
        category: 'Cultura',
        publishedAt: '2025-10-01T09:00:00.000Z',
        sourceName: 'Palomares del Campo Informa',
        sourceUrl: 'https://www.bandomovil.com/palomaresdelcampo/1005/0',
        sourceId: '1005',
        body: 'Jornadas del 20 al 28 de febrero.',
      }),
    ).toMatchObject([{ kind: 'event', startDate: '2026-02-20', endDate: '2026-02-28' }]);
  });

  it('normalizes the apostrophe clock notation used in municipal notices', () => {
    expect(
      deriveAgendaItemsFromBando({
        title: 'Taller de lectura',
        category: 'Cultura',
        publishedAt: '2025-10-30T09:00:00.000Z',
        sourceName: 'Palomares del Campo Informa',
        sourceUrl: 'https://www.bandomovil.com/palomaresdelcampo/1002/0',
        sourceId: '1002',
        body: "Taller de lectura el 10 de noviembre a las 11'00 h.",
      }),
    ).toMatchObject([{ kind: 'event', startDate: '2025-11-10', startTime: '11:00' }]);
  });

  it('normalizes curly-apostrophe clock notation', () => {
    expect(
      deriveAgendaItemsFromBando({
        title: 'Taller de lectura',
        category: 'Cultura',
        publishedAt: '2025-10-30T09:00:00.000Z',
        sourceName: 'Palomares del Campo Informa',
        sourceUrl: 'https://www.bandomovil.com/palomaresdelcampo/1004/0',
        sourceId: '1004',
        body: 'Taller de lectura el 10 de noviembre a las 12’30 h.',
      }),
    ).toMatchObject([{ kind: 'event', startDate: '2025-11-10', startTime: '12:30' }]);
  });

  it('marks a clipped summary with an ellipsis at a word boundary', () => {
    const [item] = deriveAgendaItemsFromBando({
      title: 'Taller de lectura',
      category: 'Cultura',
      publishedAt: '2025-10-30T09:00:00.000Z',
      sourceName: 'Palomares del Campo Informa',
      sourceUrl: 'https://www.bandomovil.com/palomaresdelcampo/1003/0',
      sourceId: '1003',
      body: `Taller de lectura el 10 de noviembre. ${'contenido '.repeat(50)}`,
    });

    expect(item?.summary).toMatch(/contenido…$/);
    expect(item?.summary?.length).toBeLessThanOrEqual(280);
  });

  it('omits an automatic start time when the notice lists multiple possible times', () => {
    const [item] = deriveAgendaItemsFromBando({
      title: 'Eclipse',
      category: 'Info General',
      publishedAt: '2026-08-11T12:06:00.000Z',
      sourceName: 'Palomares del Campo Informa',
      sourceUrl: 'https://www.bandomovil.com/palomaresdelcampo/1618661/0',
      sourceId: '1618661',
      body: "Atención: mañana sobre las 19'00 y 19'30 estaremos en el Mirador de la Fuente, para observar el eclipse solar.",
    });

    expect(item).toMatchObject({ kind: 'event', startDate: '2026-08-12' });
    expect(item?.startTime).toBeUndefined();
    expect(item?.location).toBe('Mirador de la Fuente');
  });

  it('removes the feed truncation marker from the visible summary', () => {
    const [item] = deriveAgendaItemsFromBando({
      title: 'Escuela de verano 2025',
      category: 'Info General',
      publishedAt: '2025-06-26T13:30:00.000Z',
      sourceName: 'Palomares del Campo Informa',
      sourceUrl: 'https://www.bandomovil.com/palomaresdelcampo/1358089/0',
      sourceId: '1358089',
      body: 'Inscripción hasta el 13 de julio. ...Haga click para ver completo.',
    });

    expect(item?.summary).not.toMatch(/haga click para ver completo/i);
  });

  it('ignores permanent transport schedules rather than treating them as agenda dates', () => {
    expect(
      deriveAgendaItemsFromBando({
        title: 'HORARIOS AUTOBÚS DE LÍNEA',
        category: 'Info General',
        publishedAt: '2026-10-09T11:00:00.000Z',
        sourceName: 'Palomares del Campo Informa',
        sourceUrl: 'https://www.bandomovil.com/palomaresdelcampo/1658990/0',
        sourceId: '1658990',
        body: 'Horarios de autobús de lunes a viernes. Salida a las 8:00.',
      }),
    ).toEqual([]);
  });

  it('keeps the start and end of a published event range', () => {
    expect(
      deriveAgendaItemsFromBando({
        title: 'LIBRO FIESTAS SEPTIEMBRE 2025',
        category: 'Info General',
        publishedAt: '2025-09-15T10:12:00.000Z',
        sourceName: 'Palomares del Campo Informa',
        sourceUrl: 'https://www.bandomovil.com/palomaresdelcampo/1412981/0',
        sourceId: '1412981',
        body: 'Fiestas patronales (Del 25 al 28 de septiembre de 2025).',
      }),
    ).toMatchObject([
      {
        kind: 'event',
        startDate: '2025-09-25',
        endDate: '2025-09-28',
      },
    ]);
  });

  it('creates one agenda entry for each explicitly listed session date', () => {
    expect(
      deriveAgendaItemsFromBando({
        title: 'Curso de formación gratuito',
        category: 'Info General',
        publishedAt: '2025-11-03T10:41:00.000Z',
        sourceName: 'Palomares del Campo Informa',
        sourceUrl: 'https://www.bandomovil.com/palomaresdelcampo/1442560/0',
        sourceId: '1442560',
        body: 'Curso de relación telemática con la Administración Pública (Días 3 y 5 de noviembre a partir de las 16:00h).',
      }),
    ).toMatchObject([
      { kind: 'event', startDate: '2025-11-03', startTime: '16:00' },
      { kind: 'event', startDate: '2025-11-05', startTime: '16:00' },
    ]);
  });

  it('resolves day-only event dates only when their stated weekdays match', () => {
    expect(
      deriveAgendaItemsFromBando({
        title: 'AVISO CAMPEONATO DE PÁDEL',
        category: 'Deportes',
        publishedAt: '2026-08-18T13:05:00.000Z',
        sourceName: 'Palomares del Campo Informa',
        sourceUrl: 'https://www.bandomovil.com/palomaresdelcampo/1624971/0',
        sourceId: '1624971',
        body: 'Tendrá lugar el viernes 28 y el sábado 29 a las 18:00 horas.',
      }),
    ).toMatchObject([
      { kind: 'event', startDate: '2026-08-28', startTime: '18:00' },
      { kind: 'event', startDate: '2026-08-29', startTime: '18:00' },
    ]);
  });

  it('keeps both days when a championship notice names weekdays and a shared month', () => {
    expect(
      deriveAgendaItemsFromBando({
        title: 'CAMPEONATO DE PÁDEL',
        category: 'Deportes',
        publishedAt: '2025-07-22T12:21:00.000Z',
        sourceName: 'Palomares del Campo Informa',
        sourceUrl: 'https://www.bandomovil.com/palomaresdelcampo/1374945/0',
        sourceId: '1374945',
        body: 'El Campeonato de Pádel será el viernes 25 y el sábado 26 de julio a partir de las 19:00 horas.',
      }),
    ).toMatchObject([
      { kind: 'event', title: 'Campeonato de pádel', startDate: '2025-07-25', startTime: '19:00' },
      { kind: 'event', title: 'Campeonato de pádel', startDate: '2025-07-26', startTime: '19:00' },
    ]);
  });

  it('leaves postponed notices out of automatic Agenda until the replacement date is verified', () => {
    expect(
      deriveAgendaItemsFromBando({
        title: 'Se pospone el Teatro...',
        category: 'Cultura',
        publishedAt: '2026-08-15T20:31:00.000Z',
        sourceName: 'Palomares del Campo Informa',
        sourceUrl: 'https://www.bandomovil.com/palomaresdelcampo/1623193/0',
        sourceId: '1623193',
        body: '«Novios de Internet», «Secretico de confesión» y «Ganas de reñir», representadas por el grupo de teatro de nuestro pueblo, al próximo sábado.',
      }),
    ).toEqual([]);
  });

  it('does not turn an extended registration period into the event deadline', () => {
    expect(
      deriveAgendaItemsFromBando({
        title: 'Salida a Madrid',
        category: 'Cultura',
        publishedAt: '2026-03-30T13:42:00.000Z',
        sourceName: 'Palomares del Campo Informa',
        sourceUrl: 'https://www.bandomovil.com/palomaresdelcampo/1529093/0',
        sourceId: '1529093',
        body: 'Debido a los días de Semana Santa se amplía el plazo para apuntarse a la salida del 17 de mayo a Madrid.',
      }),
    ).toMatchObject([{ kind: 'event', startDate: '2026-05-17' }]);
  });

  it('anchors a same-day reminder to the bando publication date', () => {
    expect(
      deriveAgendaItemsFromBando({
        title: 'Recordatorio',
        category: 'Info General',
        publishedAt: '2026-08-07T18:56:00.000Z',
        sourceName: 'Palomares del Campo Informa',
        sourceUrl: 'https://www.bandomovil.com/palomaresdelcampo/1616104/0',
        sourceId: '1616104',
        body: 'Recordar que hoy a las 22:00 es el concierto de acordeones en la Plaza del Coso.',
      }),
    ).toMatchObject([{ kind: 'event', startDate: '2026-08-07', startTime: '22:00' }]);
  });

  it('anchors an announcement for this afternoon to its publication date', () => {
    expect(
      deriveAgendaItemsFromBando({
        title: 'Curso de formación gratuito',
        category: 'Info General',
        publishedAt: '2025-10-06T11:18:00.000Z',
        sourceName: 'Palomares del Campo Informa',
        sourceUrl: 'https://www.bandomovil.com/palomaresdelcampo/1425590/0',
        sourceId: '1425590',
        body: 'El curso se impartirá esta tarde a partir de las 16:00 horas en la Asociación de Mujeres.',
      }),
    ).toMatchObject([{ kind: 'event', startDate: '2025-10-06', startTime: '16:00' }]);
  });

  it('retains a clearly named venue when it is stated in the notice body', () => {
    expect(
      deriveAgendaItemsFromBando({
        title: 'CONCIERTO DE ACORDEONES',
        category: 'Cultura',
        publishedAt: '2026-08-04T18:30:00.000Z',
        sourceName: 'Palomares del Campo Informa',
        sourceUrl: 'https://www.bandomovil.com/palomaresdelcampo/1612792/0',
        sourceId: '1612792',
        body: 'El próximo viernes a las 22:00 horas en la Plaza del Coso.',
      }),
    ).toMatchObject([
      { kind: 'event', startDate: '2026-08-07', startTime: '22:00', location: 'Plaza del Coso' },
    ]);
  });

  it('rejects sources outside the official Bandomovil municipality feed', () => {
    expect(
      deriveAgendaItemsFromBando({
        title: 'Concierto',
        category: 'Cultura',
        publishedAt: '2026-08-04T18:30:00.000Z',
        sourceName: 'Palomares del Campo Informa',
        sourceUrl: 'https://example.com/notice',
        sourceId: '999',
        body: 'El próximo viernes a las 22:00 horas en la Plaza del Coso.',
      }),
    ).toEqual([]);
  });

  it('reads the canonical source fields and full body from Bando Markdown', () => {
    const markdown = `---
title: 'DNI electrónico'
description: 'Presentación pública'
date: 2026-02-10T10:37:00.000Z
category: 'Info General'
sourceName: 'Palomares del Campo Informa'
sourceUrl: 'https://www.bandomovil.com/palomaresdelcampo/1501417/0'
sourceId: '1501417'
attachments: []
---

El próximo jueves, 12 de febrero a las 12:00.\nLugar: Salón de Actos del Ayuntamiento.
`;

    expect(parseBandoMarkdown(markdown)).toEqual({
      title: 'DNI electrónico',
      category: 'Info General',
      publishedAt: '2026-02-10T10:37:00.000Z',
      sourceName: 'Palomares del Campo Informa',
      sourceUrl: 'https://www.bandomovil.com/palomaresdelcampo/1501417/0',
      sourceId: '1501417',
      body: 'El próximo jueves, 12 de febrero a las 12:00.\nLugar: Salón de Actos del Ayuntamiento.',
    });
  });

  it('splits both explicitly dated days in a notice and gives the series one clear title', () => {
    expect(
      deriveAgendaItemsFromBando({
        title: 'Campeonatos Juegos Asociación de Mayores',
        category: 'Info General',
        publishedAt: '2026-08-07T19:57:00.000Z',
        sourceName: 'Palomares del Campo Informa',
        sourceUrl: 'https://www.bandomovil.com/palomaresdelcampo/1616140/0',
        sourceId: '1616140',
        body: 'Campeonatos de Brisca, Tute y Parchís el 13 y 14 de agosto.',
      }),
    ).toMatchObject([
      { kind: 'event', title: 'Campeonatos de Brisca, Tute y Parchís', startDate: '2026-08-13' },
      { kind: 'event', title: 'Campeonatos de Brisca, Tute y Parchís', startDate: '2026-08-14' },
    ]);
  });

  it('classifies practical civic activities from dated official bandos', () => {
    expect(
      deriveAgendaItemsFromBando({
        title: 'Clase Práctica',
        category: 'Info General',
        publishedAt: '2026-09-24T09:25:59.000Z',
        sourceName: 'Palomares del Campo Informa',
        sourceUrl:
          'https://www.bandomovil.com/vercomunicado.php?cod_municipio=palomaresdelcampo&id=1648341',
        sourceId: '1648341',
        body: 'Domingo 27 a las 17:00 horas en la plaza de toros.',
      }),
    ).toMatchObject([{ kind: 'event', startDate: '2026-09-27', startTime: '17:00' }]);
    expect(
      deriveAgendaItemsFromBando({
        title: 'Ajuste de Toros',
        category: 'Info General',
        publishedAt: '2026-05-27T11:42:00.000Z',
        sourceName: 'Palomares del Campo Informa',
        sourceUrl: 'https://www.bandomovil.com/palomaresdelcampo/1561947/0',
        sourceId: '1561947',
        body: 'El sábado 20 de junio a las 8:00 de la mañana está prevista la salida al ajuste de toros.',
      }),
    ).toMatchObject([{ kind: 'event', startDate: '2026-06-20', startTime: '08:00' }]);
  });

  it('does not mistake a registration office for the venue of a later meeting', () => {
    expect(
      deriveAgendaItemsFromBando({
        title: 'Adhesión constitución cooperativa para comunidad energética',
        category: 'Info General',
        publishedAt: '2025-03-04T11:19:00.000Z',
        sourceName: 'Palomares del Campo Informa',
        sourceUrl: 'https://www.bandomovil.com/palomaresdelcampo/1289163/0',
        sourceId: '1289163',
        body: 'Quienes quieran acogerse pueden venir al Ayuntamiento para firmar la solicitud. La reunión informativa será el 4 de abril a las 18:30 en el Salón Cultural de El Hito.',
      }),
    ).toMatchObject([
      {
        kind: 'event',
        startDate: '2025-04-04',
        startTime: '18:30',
        location: 'Salón Cultural de El Hito',
      },
    ]);
  });

  it('uses the named event in a generic reminder so duplicate notices can be merged', () => {
    const original = deriveAgendaItemsFromBando({
      title: 'CONCIERTO DE ACORDEONES',
      category: 'Cultura',
      publishedAt: '2026-08-04T10:00:00.000Z',
      sourceName: 'Palomares del Campo Informa',
      sourceUrl: 'https://www.bandomovil.com/palomaresdelcampo/1/0',
      sourceId: '1',
      body: 'El próximo viernes a las 22:00 en la Plaza del Coso.',
    });
    const reminder = deriveAgendaItemsFromBando({
      title: 'RECORDATORIO',
      category: 'Info General',
      publishedAt: '2026-08-07T10:00:00.000Z',
      sourceName: 'Palomares del Campo Informa',
      sourceUrl: 'https://www.bandomovil.com/palomaresdelcampo/2/0',
      sourceId: '2',
      body: 'Recordar que hoy a las 22:00 se celebrará el concierto de acordeones a cargo de la orquesta en la Plaza del Coso.',
    });

    expect(original[0]?.title).toBe('Concierto de acordeones');
    expect(reminder[0]?.title).toBe(original[0]?.title);
    expect(mergeAgendaItems(original, reminder)).toHaveLength(1);
  });

  it('enriches a sparse bando date with verified program time and location', () => {
    const officialBando = {
      id: 'bando:1618661:2026-08-12:eclipse',
      kind: 'event' as const,
      title: 'Eclipse',
      startDate: '2026-08-12',
      category: 'Info General',
      summary: 'Quedada en el Mirador de la Fuente para observar el eclipse.',
      source: {
        label: 'Palomares del Campo Informa',
        href: 'https://www.bandomovil.com/palomaresdelcampo/1618661/0',
        publishedAt: '2026-08-11T12:06:00.000Z',
      },
    };
    const programme = {
      ...officialBando,
      id: 'manual:summer-2026-eclipse',
      startTime: '19:30',
      location: 'Mirador de la Fuente',
      summary: 'Quedada en el Mirador de la Fuente para observar el eclipse solar, a las 19:30.',
      source: {
        ...officialBando.source,
        href: 'https://www.bandomovil.com/palomaresdelcampo/1608976/0',
        publishedAt: '2026-07-31T09:00:00.000Z',
      },
    };

    expect(mergeAgendaItems([officialBando], [programme])).toMatchObject([
      {
        id: officialBando.id,
        startTime: '19:30',
        location: 'Mirador de la Fuente',
        source: { href: officialBando.source.href },
      },
    ]);
  });

  it('preserves old source-backed entries while deduplicating later notices for the same date', () => {
    const older = {
      id: 'bando:1:2026-08-07:concierto-de-acordeones',
      kind: 'event' as const,
      title: 'Concierto de acordeones',
      startDate: '2026-08-07',
      startTime: '22:00',
      category: 'Cultura',
      location: 'Plaza del Coso',
      source: {
        label: 'Palomares del Campo Informa',
        href: 'https://www.bandomovil.com/palomaresdelcampo/1/0',
        publishedAt: '2026-08-04T18:30:00.000Z',
      },
    };
    const reminder = {
      ...older,
      id: 'bando:2:2026-08-07:concierto-de-acordeones',
      source: {
        ...older.source,
        href: 'https://www.bandomovil.com/palomaresdelcampo/2/0',
        publishedAt: '2026-08-07T18:56:00.000Z',
      },
    };
    const deadline = {
      id: 'manual:tender-114-2026',
      kind: 'deadline' as const,
      title: 'Límite de ofertas — expediente 114/2026',
      startDate: '2026-10-26',
      deadlineTime: '14:00',
      category: 'Trámite público',
      audience: 'businesses' as const,
      source: older.source,
    };

    expect(mergeAgendaItems([older], [reminder, deadline])).toEqual([reminder, deadline]);
  });

  it('rebuilds stale generated fields when the source Bando is still available', () => {
    const notice = `---
title: 'DNI electrónico'
description: 'Presentación pública'
date: 2026-02-10T09:37:00.000Z
category: 'Info General'
sourceName: 'Palomares del Campo Informa'
sourceUrl: 'https://www.bandomovil.com/palomaresdelcampo/1501417/0'
sourceId: '1501417'
attachments: []
---

El próximo jueves, 12 de febrero a las 12:00. Lugar: Salón de Actos del Ayuntamiento.
`;
    const current = buildAgendaProjection([notice]);
    const [currentItem] = current;
    if (!currentItem) throw new Error('The notice should produce one Agenda item.');
    const staleItem = {
      ...currentItem,
      category: 'Actividad pública',
      startTime: '13:00',
      source: {
        ...currentItem.source,
        publishedAt: '2026-02-10T10:37:00.000Z',
      },
    };

    expect(buildAgendaProjection([notice], [staleItem])).toEqual(current);
  });

  it('builds an additive agenda projection and ignores undated operational notices', () => {
    const datedNotice = `---
title: 'DNI electrónico'
description: 'Presentación pública'
date: 2026-02-10T10:37:00.000Z
category: 'Info General'
sourceName: 'Palomares del Campo Informa'
sourceUrl: 'https://www.bandomovil.com/palomaresdelcampo/1501417/0'
sourceId: '1501417'
attachments: []
---

El próximo jueves, 12 de febrero a las 12:00. Lugar: Salón de Actos del Ayuntamiento.
`;
    const transportNotice = `---
title: 'HORARIOS AUTOBÚS DE LÍNEA'
description: 'Horarios de autobús.'
date: 2026-10-09T11:00:00.000Z
category: 'Info General'
sourceName: 'Palomares del Campo Informa'
sourceUrl: 'https://www.bandomovil.com/palomaresdelcampo/1658990/0'
sourceId: '1658990'
attachments: []
---

Horarios de autobús de lunes a viernes. Salida a las 8:00.
`;
    const existing = {
      id: 'manual:historic',
      kind: 'event' as const,
      title: 'Evento histórico',
      startDate: '2025-08-01',
      category: 'Cultura',
      source: {
        label: 'Palomares del Campo Informa',
        href: 'https://www.bandomovil.com/palomaresdelcampo/100/0',
        publishedAt: '2025-07-30T10:00:00.000Z',
      },
    };

    expect(
      buildAgendaProjection([datedNotice, transportNotice], [existing]).map((item) => item.id),
    ).toEqual([existing.id, 'bando:1501417:1']);
  });

  it('canonicalizes duplicate theatre reminders and drops their conflicting venue', () => {
    const announced = deriveAgendaItemsFromBando({
      title: 'TEATRO AMBIENTAL 2026',
      category: 'Info General',
      publishedAt: '2026-07-27T18:57:00.000Z',
      sourceName: 'Palomares del Campo Informa',
      sourceUrl: 'https://www.bandomovil.com/palomaresdelcampo/1601021/0',
      sourceId: '1601021',
      body: 'El teatro ambiental tendrá lugar el próximo lunes, 3 de agosto, a las 11:00 de la mañana en el Polideportivo de la Plaza de toros de Palomares del Campo.',
    });
    const reminder = deriveAgendaItemsFromBando({
      title: 'RECORDATORIO',
      category: 'Info General',
      publishedAt: '2026-08-03T10:35:00.000Z',
      sourceName: 'Palomares del Campo Informa',
      sourceUrl: 'https://www.bandomovil.com/palomaresdelcampo/1611017/0',
      sourceId: '1611017',
      body: "Recordaros a todos que hoy día 3 de agosto a las 11'00, hay una representación de Teatro Ambiental, para todos los públicos en el Polideportivo de la Piscina.",
    });

    expect(announced[0]?.title).toBe('Teatro ambiental');
    expect(reminder[0]?.title).toBe('Teatro ambiental');
    const merged = mergeAgendaItems(announced, reminder);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.location).toBeUndefined();
    expect(merged[0]?.source.href).toBe(reminder[0]?.source.href);
    expect(merged[0]?.startTime).toBe('11:00');
  });

  it('does not misread de la mañana as a relative tomorrow date', () => {
    expect(
      deriveAgendaItemsFromBando({
        title: 'VACUNACIÓN',
        category: 'Info General',
        publishedAt: '2026-10-07T08:29:32.000Z',
        sourceName: 'Palomares del Campo Informa',
        sourceUrl:
          'https://www.bandomovil.com/vercomunicado.php?cod_municipio=palomaresdelcampo&id=1656772',
        sourceId: '1656772',
        body: 'Se empezará a vacunar de la gripe y del Covid a partir del martes 13 a las 11:00 de la mañana. Los interesados que acudan al Centro Médico.',
      }),
    ).toMatchObject([{ kind: 'service', startDate: '2026-10-13', startTime: '11:00' }]);
  });
});
