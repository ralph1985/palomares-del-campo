import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseBandoMarkdown } from '../../scripts/agenda-from-bandos.ts';
import {
  getDateInTimeZone,
  mergeAgendaItems,
  splitAgendaItems,
} from '../../src/data/agenda-utils.ts';
import { agendaItems } from '../../src/data/current-affairs';
import { manualAgendaItems } from '../../src/data/agenda-manual.ts';
import type { AgendaItem } from '../../src/data/current-affairs.ts';

const bandosDirectory = new URL('../../src/content/bandos/', import.meta.url);
const publishedAtByBandoId = new Map(
  readdirSync(bandosDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .flatMap((entry) => {
      const markdown = readFileSync(new URL(entry.name, bandosDirectory), 'utf8');
      const source = parseBandoMarkdown(markdown);
      return source ? [[source.sourceId, source.publishedAt] as const] : [];
    }),
);

const source = {
  label: 'Fuente municipal',
  href: 'https://www.bandomovil.com/palomaresdelcampo/1/0',
  publishedAt: '2026-08-04T10:00:00.000Z',
};

function item(overrides: Partial<AgendaItem> & Pick<AgendaItem, 'id' | 'startDate'>): AgendaItem {
  return {
    id: overrides.id,
    kind: overrides.kind ?? 'event',
    title: overrides.title ?? overrides.id,
    startDate: overrides.startDate,
    category: overrides.category ?? 'Cultura',
    source,
    ...(overrides.endDate ? { endDate: overrides.endDate } : {}),
    ...(overrides.status ? { status: overrides.status } : {}),
  };
}

describe('agenda date sections', () => {
  it('keeps manual Bando timestamps aligned with their source records', () => {
    let checked = 0;
    for (const item of manualAgendaItems) {
      const sourceId = new URL(item.source.href).pathname.match(
        /^\/palomaresdelcampo\/(\d+)\/\d+$/,
      )?.[1];
      if (!sourceId) continue;
      const publishedAt = publishedAtByBandoId.get(sourceId);
      if (!publishedAt) continue;
      checked += 1;
      expect(item.source.publishedAt).toBe(publishedAt);
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('uses the detailed theatre posters and avoids a conflicting relative reschedule date', () => {
    const augustTwentieth = agendaItems.filter(
      (agendaItem) => agendaItem.startDate === '2026-08-20' && agendaItem.title === 'Teatro',
    );
    expect(augustTwentieth).toHaveLength(1);
    expect(augustTwentieth[0]).toMatchObject({
      startTime: '22:00',
      location: 'Salón de Actos de la Casa de Cultura Palomares de Campo',
      source: { href: 'https://www.bandomovil.com/palomaresdelcampo/1624850/0' },
    });

    const rescheduled = agendaItems.find(
      (agendaItem) => agendaItem.id === 'municipal:theatre-2026-postponed',
    );
    expect(rescheduled).toMatchObject({
      startDate: '2026-08-29',
      source: { href: 'https://www.bandomovil.com/palomaresdelcampo/1623193/0' },
    });
    expect(rescheduled?.startTime).toBeUndefined();
    expect(rescheduled?.location).toBeUndefined();
    expect(
      agendaItems.some(
        (agendaItem) =>
          agendaItem.startDate === '2026-08-22' && agendaItem.title.includes('pospone'),
      ),
    ).toBe(false);
  });

  it('keeps the eclipse source but omits an ambiguous single time', () => {
    const eclipse = agendaItems.filter(
      (agendaItem) => agendaItem.title === 'Eclipse' && agendaItem.startDate === '2026-08-12',
    );

    expect(eclipse).toHaveLength(1);
    expect(eclipse[0]).toMatchObject({
      id: 'bando:1618661:1',
      location: 'Mirador de la Fuente',
      source: { href: 'https://www.bandomovil.com/palomaresdelcampo/1618661/0' },
    });
    expect(eclipse[0]?.startTime).toBeUndefined();
    expect(eclipse[0]?.summary).toContain("19'00 y 19'30");
  });

  it('enriches a dated talk from its official poster without duplicating the Bando item', () => {
    const talk = agendaItems.filter((agendaItem) => agendaItem.source.href.endsWith('/1624901/0'));

    expect(talk).toHaveLength(1);
    expect(talk[0]).toMatchObject({
      startDate: '2026-08-21',
      startTime: '19:30',
      title: 'Charla jornadas',
      location: 'Iglesia',
      source: { href: 'https://www.bandomovil.com/palomaresdelcampo/1624901/0' },
    });
    expect(talk[0]?.summary).toContain('La Fuente el Pez y el culto a San Miguel');
  });

  it('uses the full poster details for the 2025 community jornadas', () => {
    const event = agendaItems.filter((agendaItem) => agendaItem.source.href.endsWith('/1432518/0'));

    expect(event).toHaveLength(1);
    expect(event[0]).toMatchObject({
      title: 'Nuestros mayores, nuestra memoria viva',
      startDate: '2025-10-24',
      startTime: '10:00',
      category: 'Actividades para mayores',
      location: 'POLIDEPORTIVO MUNICIPAL',
      source: { href: 'https://www.bandomovil.com/palomaresdelcampo/1432518/0' },
    });
    expect(event[0]?.summary).toContain('de 10:00 a 13:00');
  });

  it('adds the verified venue from the health workshops poster without duplicating the bando', () => {
    const workshops = agendaItems.filter((agendaItem) =>
      agendaItem.source.href.endsWith('id=1668814'),
    );

    expect(workshops).toHaveLength(1);
    expect(workshops[0]).toMatchObject({
      title: 'Talleres de Salud y Actividades Comunitarias',
      startDate: '2026-11-03',
      startTime: '10:00',
      location: 'Biblioteca de Palomares',
      source: {
        href: 'https://www.bandomovil.com/vercomunicado.php?cod_municipio=palomaresdelcampo&id=1668814',
      },
    });
  });

  it('replaces a dated entry when the same Bando source is corrected', () => {
    const original: AgendaItem = {
      id: 'bando:44:1',
      kind: 'event',
      title: 'Concierto',
      startDate: '2026-08-07',
      category: 'Cultura',
      location: 'Lugar incorrecto',
      source,
    };
    const correction: AgendaItem = {
      id: original.id,
      kind: original.kind,
      title: original.title,
      startDate: '2026-08-08',
      category: original.category,
      source: { ...source, publishedAt: '2026-08-07T12:00:00.000Z' },
    };

    expect(mergeAgendaItems([original], [correction])).toEqual([correction]);
  });

  it('keeps separate same-venue sessions when their start times differ', () => {
    const earlier: AgendaItem = {
      id: 'municipal:summer-2026-eclipse',
      kind: 'event',
      title: 'Eclipse',
      startDate: '2026-08-12',
      startTime: '19:30',
      category: 'Cultura',
      location: 'Mirador de la Fuente',
      source: {
        ...source,
        href: 'https://www.bandomovil.com/palomaresdelcampo/1608976/0',
        publishedAt: '2026-07-31T09:00:00.000Z',
      },
    };
    const otherSession: AgendaItem = {
      ...earlier,
      id: 'bando:1618661:1',
      startTime: '19:00',
      source: {
        ...source,
        href: 'https://www.bandomovil.com/palomaresdelcampo/1618661/0',
        publishedAt: '2026-08-11T12:06:00.000Z',
      },
    };

    expect(mergeAgendaItems([earlier], [otherSession])).toHaveLength(2);
  });

  it('uses the newest source summary even when it is shorter', () => {
    const earlier: AgendaItem = {
      id: 'bando:older:1',
      kind: 'event',
      title: 'Concierto',
      startDate: '2026-08-09',
      startTime: '19:00',
      category: 'Cultura',
      location: 'Plaza del Coso',
      summary: 'Descripción anterior más extensa con un dato que ya no es vigente.',
      source: { ...source, publishedAt: '2026-08-04T10:00:00.000Z' },
    };
    const correction: AgendaItem = {
      ...earlier,
      id: 'bando:newer:1',
      summary: 'Horario actualizado en el último aviso.',
      source: { ...source, publishedAt: '2026-08-08T10:00:00.000Z' },
    };

    expect(mergeAgendaItems([earlier], [correction])[0]?.summary).toBe(correction.summary);
  });

  it('merges duplicate notices but omits a venue disputed by official sources', () => {
    const earlier: AgendaItem = {
      id: 'bando:1601021:1',
      kind: 'event',
      title: 'Teatro ambiental',
      startDate: '2026-08-03',
      startTime: '11:00',
      category: 'Cultura',
      location: 'Polideportivo de la Plaza de Toros',
      source: { ...source, publishedAt: '2026-07-27T18:57:00.000Z' },
    };
    const reminder: AgendaItem = {
      ...earlier,
      id: 'bando:1611017:1',
      location: 'Polideportivo de la Piscina',
      source: { ...source, publishedAt: '2026-08-03T10:35:00.000Z' },
    };

    expect(mergeAgendaItems([earlier], [reminder])).toMatchObject([
      { id: reminder.id, startDate: reminder.startDate, source: reminder.source },
    ]);
    expect(mergeAgendaItems([earlier], [reminder])[0]?.location).toBeUndefined();
  });

  it('keeps today and ongoing items active, moves ended items to the archive, and separates cancellations', () => {
    const sections = splitAgendaItems(
      [
        item({ id: 'past-older', startDate: '2026-10-19' }),
        item({ id: 'past', startDate: '2026-10-20' }),
        item({ id: 'today', startDate: '2026-10-21' }),
        item({ id: 'ongoing', startDate: '2026-10-15', endDate: '2026-10-21' }),
        item({ id: 'future', startDate: '2026-10-24' }),
        item({ id: 'cancelled-older', startDate: '2026-10-22', status: 'cancelled' }),
        item({ id: 'cancelled', startDate: '2026-10-25', status: 'cancelled' }),
      ],
      '2026-10-21',
    );

    expect(sections.upcoming.map(({ id }) => id)).toEqual(['future', 'today', 'ongoing']);
    expect(sections.past.map(({ id }) => id)).toEqual(['past', 'past-older']);
    expect(sections.cancelled.map(({ id }) => id)).toEqual(['cancelled', 'cancelled-older']);
  });

  it('calculates the civil date in the requested timezone instead of the host timezone', () => {
    expect(getDateInTimeZone(new Date('2026-10-21T22:30:00.000Z'), 'Europe/Madrid')).toBe(
      '2026-10-22',
    );
  });
});
