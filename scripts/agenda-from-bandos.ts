import type { AgendaItem, AgendaItemKind } from '../src/data/current-affairs.ts';
import { getDateInTimeZone, mergeAgendaItems } from '../src/data/agenda-utils.ts';

export interface BandoAgendaSource {
  title: string;
  category: string;
  publishedAt: string;
  sourceName: string;
  sourceUrl: string;
  sourceId: string;
  body: string;
}

export type AgendaFallbackClassifier = (
  sources: readonly BandoAgendaSource[],
) => Promise<ReadonlyMap<string, AgendaItemKind | null>>;

const months: Record<string, number> = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
};

const weekdays: Record<string, number> = {
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  domingo: 0,
};

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-ES');
}

function getMadridDate(value: string): { year: number; month: number; day: number } | null {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.valueOf())) return null;

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(timestamp);
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const day = Number(parts.find((part) => part.type === 'day')?.value);
  if (![year, month, day].every(Number.isInteger)) return null;
  return { year, month, day };
}

function isoDate(year: number, month: number, day: number): string | null {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

function getDateFromBody(body: string, publishedAt: string): string | null {
  const publishedDate = getMadridDate(publishedAt);
  if (!publishedDate) return null;

  const text = normalize(body);
  const dateMatch = text.match(
    /\b(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)(?:\s+(?:de|del)\s+(\d{4}))?\b/,
  );
  if (dateMatch) {
    const day = Number(dateMatch[1]);
    const monthName = dateMatch[2];
    const month = monthName ? months[monthName] : undefined;
    const explicitYear = dateMatch[3] ? Number(dateMatch[3]) : publishedDate.year;
    if (month === undefined) return null;

    let year = explicitYear;
    let result = isoDate(year, month, day);
    if (!result) return null;

    const publishedIso = isoDate(publishedDate.year, publishedDate.month, publishedDate.day);
    if (
      !dateMatch[3] &&
      publishedIso &&
      result < publishedIso &&
      publishedDate.month >= 10 &&
      month <= 2
    ) {
      year += 1;
      result = isoDate(year, month, day);
    }
    if (!result) return null;

    const weekdayMatch = text
      .slice(Math.max(0, (dateMatch.index ?? 0) - 32), dateMatch.index ?? 0)
      .match(/\b(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b[^.\n]{0,24}$/);
    if (weekdayMatch) {
      const expectedWeekday = weekdays[weekdayMatch[1] ?? ''];
      const [resultYear, resultMonth, resultDay] = result.split('-').map(Number);
      const actualWeekday = new Date(
        Date.UTC(resultYear ?? 0, (resultMonth ?? 1) - 1, resultDay ?? 1),
      ).getUTCDay();
      if (expectedWeekday !== actualWeekday) return null;
    }

    return result;
  }

  if (/\b(hoy|esta manana|esta tarde|esta noche)\b/.test(text)) {
    return isoDate(publishedDate.year, publishedDate.month, publishedDate.day);
  }

  if (
    /\bmanana\b/.test(text) ||
    /\bproximo\s+(?:lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b/.test(text)
  ) {
    const publishedIso = isoDate(publishedDate.year, publishedDate.month, publishedDate.day);
    if (!publishedIso) return null;
    const relativeText = text.replaceAll(/\bde la manana\b/g, ' ');
    if (/\bmanana\b/.test(relativeText)) {
      const tomorrow = new Date(
        Date.UTC(publishedDate.year, publishedDate.month - 1, publishedDate.day + 1),
      );
      return isoDate(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth() + 1, tomorrow.getUTCDate());
    }

    const weekday = text.match(
      /\bproximo\s+(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b/,
    )?.[1];
    const target = weekday === undefined ? undefined : weekdays[weekday];
    if (target === undefined) return null;
    const publishedWeekday = new Date(
      Date.UTC(publishedDate.year, publishedDate.month - 1, publishedDate.day),
    ).getUTCDay();
    const delta = (target - publishedWeekday + 7) % 7 || 7;
    const next = new Date(
      Date.UTC(publishedDate.year, publishedDate.month - 1, publishedDate.day + delta),
    );
    return isoDate(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate());
  }

  return null;
}

interface AgendaDateRange {
  startDate: string;
  endDate?: string;
}

function getDateRangeFromBody(body: string, publishedAt: string): AgendaDateRange | null {
  const text = normalize(body);
  const match = text.match(
    /del\s+(\d{1,2})\s+al\s+(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)(?:\s+(?:de|del)\s+(\d{4}))?/,
  );
  const publishedDate = getMadridDate(publishedAt);
  const startDay = Number(match?.[1]);
  const endDay = Number(match?.[2]);
  const monthName = match?.[3];
  const month = monthName ? months[monthName] : undefined;
  if (!match || !publishedDate || month === undefined) return null;

  const year = match[4] ? Number(match[4]) : resolveRangeYear(month, publishedDate);
  const startDate = isoDate(year, month, startDay);
  const endDate = isoDate(year, month, endDay);
  if (!startDate || !endDate || startDate > endDate) return null;
  return { startDate, endDate };
}

function getWeekdayMultiDatesFromBody(body: string, publishedAt: string): AgendaDateRange[] {
  const text = normalize(body);
  const match = text.match(
    /\b(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\s+(\d{1,2})\s+y\s+(?:(?:el\s+)?(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\s+)?(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)(?:\s+(?:de|del)\s+(\d{4}))?/,
  );
  const publishedDate = getMadridDate(publishedAt);
  const monthName = match?.[5];
  const month = monthName ? months[monthName] : undefined;
  if (!match || !publishedDate || month === undefined) return [];

  const firstDay = Number(match[2]);
  const secondDay = Number(match[4]);
  const explicitYear = match[6] ? Number(match[6]) : undefined;
  const year = explicitYear ?? resolveRangeYear(month, publishedDate);
  const firstDate = isoDate(year, month, firstDay);
  const secondDate = isoDate(year, month, secondDay);
  if (!firstDate || !secondDate || firstDate > secondDate) return [];

  const expectedWeekdays = [weekdays[match[1] ?? ''], match[3] ? weekdays[match[3]] : undefined];
  const actualWeekdays = [firstDate, secondDate].map((date) => {
    const [dateYear, dateMonth, dateDay] = date.split('-').map(Number);
    return new Date(Date.UTC(dateYear ?? 0, (dateMonth ?? 1) - 1, dateDay ?? 1)).getUTCDay();
  });
  if (
    expectedWeekdays.some(
      (weekday, index) => weekday !== undefined && weekday !== actualWeekdays[index],
    )
  ) {
    return [];
  }
  return [{ startDate: firstDate }, { startDate: secondDate }];
}

function resolveRangeYear(
  month: number,
  publishedDate: { year: number; month: number; day: number },
): number {
  if (publishedDate.month >= 10 && month < publishedDate.month && month <= 2)
    return publishedDate.year + 1;
  return publishedDate.year;
}

function getDayOnlyDatesFromBody(body: string, publishedAt: string): AgendaDateRange[] {
  const publishedDate = getMadridDate(publishedAt);
  if (!publishedDate) return [];
  const publishedIso = isoDate(publishedDate.year, publishedDate.month, publishedDate.day);
  if (!publishedIso) return [];

  const text = normalize(body);
  const output: AgendaDateRange[] = [];
  const pattern =
    /\b(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\s+(?:dia\s*)?(\d{1,2})\b/g;
  for (const match of text.matchAll(pattern)) {
    if (match.index === undefined) continue;
    const weekday = weekdays[match[1] ?? ''];
    const day = Number(match[2]);
    if (weekday === undefined) continue;

    const candidates = [0, 1].flatMap((monthOffset) => {
      const monthDate = new Date(
        Date.UTC(publishedDate.year, publishedDate.month - 1 + monthOffset, 1),
      );
      const candidate = isoDate(monthDate.getUTCFullYear(), monthDate.getUTCMonth() + 1, day);
      if (!candidate || candidate < publishedIso) return [];
      const [year, month, calendarDay] = candidate.split('-').map(Number);
      const actualWeekday = new Date(
        Date.UTC(year ?? 0, (month ?? 1) - 1, calendarDay ?? 1),
      ).getUTCDay();
      return actualWeekday === weekday ? [candidate] : [];
    });
    const startDate = candidates[0];
    if (!startDate) continue;

    const monthNameAfter = text.slice(
      match.index + match[0].length,
      match.index + match[0].length + 18,
    );
    if (
      /^\s*de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\b/.test(
        monthNameAfter,
      )
    ) {
      continue;
    }
    output.push({ startDate });
  }
  return [...new Map(output.map((date) => [date.startDate, date])).values()];
}

function getAgendaDatesFromBando(source: BandoAgendaSource): AgendaDateRange[] {
  const text = normalize(source.body);
  const dateRange = getDateRangeFromBody(source.body, source.publishedAt);
  if (dateRange) return [dateRange];

  const weekdayDates = getWeekdayMultiDatesFromBody(source.body, source.publishedAt);
  if (weekdayDates.length > 0) return weekdayDates;

  const sessionMatch = text.match(
    /\b(?:dias?\s+|el\s+)?(\d{1,2})\s+y\s+(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)(?:\s+(?:de|del)\s+(\d{4}))?/,
  );
  const publishedDate = getMadridDate(source.publishedAt);
  if (sessionMatch && publishedDate) {
    const monthName = sessionMatch[3];
    const month = monthName ? months[monthName] : undefined;
    if (month !== undefined) {
      const firstDay = Number(sessionMatch[1]);
      const secondDay = Number(sessionMatch[2]);
      const explicitYear = sessionMatch[4] ? Number(sessionMatch[4]) : undefined;
      const year = resolveRangeYear(month, publishedDate);
      const resolvedYear = explicitYear ?? year;
      const dates = [
        isoDate(resolvedYear, month, firstDay),
        isoDate(resolvedYear, month, secondDay),
      ];
      if (dates.every((date): date is string => date !== null)) {
        return [...new Set(dates)].map((startDate) => ({ startDate }));
      }
    }
  }

  const startDate = getDateFromBody(source.body, source.publishedAt);
  if (startDate) return [{ startDate }];
  return getDayOnlyDatesFromBody(source.body, source.publishedAt);
}

function getKind(source: BandoAgendaSource): AgendaItemKind | null {
  const text = normalize(`${source.title} ${source.body}`);
  if (isExplicitlyExcluded(source)) return null;
  const explicitDeadline =
    /\b(fecha limite|hasta el|fecha de cierre|fecha fin|presentar ofertas|presentacion de ofertas|licitacion)\b/.test(
      text,
    ) || /\bplazo\b[^.\n]{0,80}\b(?:es|vence|termina|finaliza|acaba|hasta)\b/.test(text);
  if (explicitDeadline) return 'deadline';
  if (/\b(dni electronico|vacunacion|dentista|servicio|cita|consulta)\b/.test(text))
    return 'service';
  if (
    /\b(concierto|teatro|curso|taller(?:es)?|charlas?|jornadas?|festival|fiestas?|campeonatos?|clase|ajuste|actividad(?:es)?|visita|eclipse|reunion|salida|montaje|retirada|exposicion|actuacion|ludoteca|escuela|concentracion|belen)\b/.test(
      text,
    )
  ) {
    return 'event';
  }
  return null;
}

function isExplicitlyExcluded(source: BandoAgendaSource): boolean {
  const text = normalize(`${source.title} ${source.body}`);
  return (
    /\b(cancelad[oa]|se cancela|pospon\w*|aplaz\w*)\b/.test(text) ||
    /\b(horarios? de autobus|suministro de agua|corte de agua|residuos)\b/.test(text)
  );
}

function getCategory(kind: AgendaItemKind, sourceCategory: string): string {
  if (kind === 'deadline') return 'Trámite público';
  if (kind === 'service') return 'Servicio público';
  return sourceCategory && sourceCategory !== 'Info General' ? sourceCategory : 'Actividad pública';
}

function getTime(body: string): string | undefined {
  const matches = normalize(body).matchAll(
    /(?:a las|a partir de las|sobre las)?\s*(\d{1,2})(?::|['’])(\d{2})\s*(?:horas?)?/g,
  );
  const times = new Set<string>();
  for (const match of matches) {
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour <= 23 && minute <= 59) {
      times.add(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }
  if (times.size !== 1) return undefined;
  return [...times][0];
}

function extractNamedVenue(text: string): string | undefined {
  const venue = text.match(
    /\b(?:en|al)\s+(?:(?:el|la|los|las)\s+)?((?:Plaza|Sal[oó]n|Salon|Polideportivo|Pista|Hogar|Asociaci[oó]n|Asociacion|Centro M[eé]dico|Centro Medico|Mirador|Iglesia|Puerta del Ayuntamiento|Ayuntamiento|Casa de Cultura|Auditorio)[^,.;\n()]{0,70})/i,
  )?.[1];
  return venue?.trim().replace(/[.)]+$/, '') || undefined;
}

function isRegistrationLocation(body: string): boolean {
  return /\b(?:apuntarse|inscribirse|solicitar cita|firmar la solicitud)\b[^.;\n]{0,100}\b(?:al|en el|en la)\s+(?:ayuntamiento|centro m[eé]dico|asociaci[oó]n)\b/i.test(
    body,
  );
}

function getLocation(body: string): string | undefined {
  const labelled = body.match(/\bLugar:\s*([^.;\n]+)/i)?.[1];
  if (labelled) return labelled.trim().replace(/[.)]+$/, '');

  const time = body.match(
    /(?:a las|a partir de las|sobre las)?\s*\d{1,2}(?::|['’])\d{2}\s*(?:horas?|h)?/i,
  );
  if (time?.index !== undefined) {
    const afterTime = extractNamedVenue(body.slice(time.index + time[0].length));
    if (afterTime) {
      if (
        isRegistrationLocation(body) &&
        /ayuntamiento|centro m[eé]dico|asociaci[oó]n/i.test(afterTime)
      ) {
        return undefined;
      }
      return afterTime;
    }
  }

  if (isRegistrationLocation(body)) return undefined;
  return extractNamedVenue(body);
}

function getSummary(body: string): string | undefined {
  const summary = body
    .replaceAll(/\s*\.{3}\s*haga click para ver completo\.?/gi, '')
    .replaceAll(/\s*haga click para ver completo\.?/gi, '')
    .replaceAll(/Archivo(?:s)? adjunto(?:s)?:[\s\S]*$/gi, '')
    .replaceAll(/https?:\/\/\S+/gi, '')
    .replaceAll(/\b(?:\+?\d[\d\s().-]{7,}\d)\b/g, '')
    .replaceAll(/[*_`]/g, '')
    .replaceAll(/\s+/g, ' ')
    .trim();
  if (!summary) return undefined;
  const maxLength = 280;
  if (summary.length <= maxLength) return summary;
  const maxContentLength = maxLength - 1;
  const lastWordBoundary = summary.lastIndexOf(' ', maxContentLength);
  const excerpt = summary
    .slice(0, lastWordBoundary > 0 ? lastWordBoundary : maxContentLength)
    .trimEnd();
  return `${excerpt}…`;
}

function readYamlString(frontmatter: string, key: string): string | null {
  const match = frontmatter.match(new RegExp(`^${key}: '((?:''|[^'])*)'$`, 'm'));
  const value = match?.[1];
  return value === undefined ? null : value.replaceAll("''", "'");
}

export function parseBandoMarkdown(markdown: string): BandoAgendaSource | null {
  const frontmatterMatch = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  const frontmatter = frontmatterMatch?.[1];
  const body = frontmatterMatch?.[2];
  if (frontmatter === undefined || body === undefined) return null;

  const title = readYamlString(frontmatter, 'title');
  const category = readYamlString(frontmatter, 'category');
  const sourceName = readYamlString(frontmatter, 'sourceName');
  const sourceUrl = readYamlString(frontmatter, 'sourceUrl');
  const sourceId = readYamlString(frontmatter, 'sourceId');
  const dateValue = frontmatter.match(/^date:\s*(\S+)\s*$/m)?.[1];
  if (!title || !sourceName || !sourceUrl || !sourceId || !dateValue) return null;

  const date = new Date(dateValue);
  if (Number.isNaN(date.valueOf())) return null;

  return {
    title,
    category: category || 'Info General',
    publishedAt: date.toISOString(),
    sourceName,
    sourceUrl,
    sourceId,
    body: body.trim(),
  };
}

function isVerifiedBandoSource(source: BandoAgendaSource): boolean {
  if (!/^\d+$/.test(source.sourceId)) return false;
  try {
    const url = new URL(source.sourceUrl);
    if (url.protocol !== 'https:' || url.hostname !== 'www.bandomovil.com') return false;
    if (url.pathname === '/vercomunicado.php') {
      return (
        url.searchParams.get('cod_municipio') === 'palomaresdelcampo' &&
        url.searchParams.get('id') === source.sourceId
      );
    }
    return new RegExp(`^/palomaresdelcampo/${source.sourceId}/\\d+$`).test(url.pathname);
  } catch {
    return false;
  }
}

function sentenceCaseTitle(value: string): string {
  const cleaned = value.replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  const lowerOrOriginal =
    cleaned === cleaned.toLocaleUpperCase('es') ? cleaned.toLocaleLowerCase('es') : cleaned;
  const cased = lowerOrOriginal.replace(/^./u, (first) => first.toLocaleUpperCase('es'));
  return cased
    .replace(/\bdni\b/gi, 'DNI')
    .replace(/\bimserso\b/gi, 'IMSERSO')
    .replace(/\bjccm\b/gi, 'JCCM');
}

function getAgendaTitle(source: BandoAgendaSource): string {
  const normalizedNotice = normalize(`${source.title} ${source.body}`);
  if (/teatro ambiental/.test(normalizedNotice)) return 'Teatro ambiental';
  if (/campeonatos? juegos asociacion de mayores|campeonatos? de brisca/.test(normalizedNotice)) {
    return 'Campeonatos de Brisca, Tute y Parchís';
  }
  const quotedProgrammeTitle = source.body.match(
    /\b(?:jornadas?|charlas?)\s+[“«"]([^”»"]{3,100})[”»"]?/i,
  )?.[1];
  if (quotedProgrammeTitle) return sentenceCaseTitle(quotedProgrammeTitle);

  const withoutPrefix = source.title
    .replace(/^(?:(?:recordatorio|aviso|bando municipal|informar)\s*(?:del|de|:|-)?\s*)+/i, '')
    .trim();
  const generic = new Set(['recordatorio', 'aviso', 'bando municipal', 'informar']);
  if (withoutPrefix && !generic.has(normalize(withoutPrefix))) {
    return sentenceCaseTitle(withoutPrefix);
  }

  const phrase = source.body.match(
    /\b(?:concierto(?:\s+de\s+acordeones)?|teatro\s+ambiental|clase\s+pr[aá]ctica|ajuste\s+de\s+toros|dni\s+electr[oó]nico)\b[^,.;\n]{0,70}/i,
  )?.[0];
  if (phrase) {
    const concisePhrase = phrase
      .replace(/\s+(?:a cargo de|en la|en el|para)\b[\s\S]*$/i, '')
      .trim();
    return sentenceCaseTitle(concisePhrase);
  }
  return sentenceCaseTitle(withoutPrefix || source.title);
}

export function deriveAgendaItemsFromBando(source: BandoAgendaSource): AgendaItem[] {
  return deriveAgendaItemsWithKind(source, getKind(source));
}

function deriveAgendaItemsWithKind(
  source: BandoAgendaSource,
  kind: AgendaItemKind | null,
): AgendaItem[] {
  if (!kind || !isVerifiedBandoSource(source)) return [];
  const dates = getAgendaDatesFromBando(source);
  if (dates.length === 0) return [];

  const time = getTime(source.body);
  const title = getAgendaTitle(source);
  if (!title) return [];
  const location = getLocation(source.body);
  const summary = getSummary(source.body);

  return dates.map(({ startDate, endDate }, occurrence) => ({
    id: `bando:${source.sourceId}:${occurrence + 1}`,
    kind,
    title,
    startDate,
    ...(endDate ? { endDate } : {}),
    ...(time ? (kind === 'deadline' ? { deadlineTime: time } : { startTime: time }) : {}),
    category: getCategory(kind, source.category),
    ...(location ? { location } : {}),
    ...(summary ? { summary } : {}),
    source: {
      label: source.sourceName,
      href: source.sourceUrl,
      publishedAt: source.publishedAt,
    },
  }));
}

export function buildAgendaProjection(
  bandoMarkdown: readonly string[],
  existingItems: readonly AgendaItem[] = [],
): AgendaItem[] {
  const sources = bandoMarkdown.flatMap((markdown) => {
    const source = parseBandoMarkdown(markdown);
    return source ? [source] : [];
  });
  const sourceIds = new Set(sources.map((source) => source.sourceId));
  const discovered = sources.flatMap(deriveAgendaItemsFromBando);
  const preservedExisting = existingItems.filter((item) => {
    const sourceId = item.id.match(/^bando:(\d+):\d+$/)?.[1];
    return !sourceId || !sourceIds.has(sourceId);
  });

  return mergeAgendaItems(preservedExisting, discovered);
}

export async function buildAgendaProjectionWithFallback(
  bandoMarkdown: readonly string[],
  existingItems: readonly AgendaItem[],
  classify: AgendaFallbackClassifier,
  today = getDateInTimeZone(new Date(), 'Europe/Madrid'),
): Promise<AgendaItem[]> {
  const sources = bandoMarkdown.flatMap((markdown) => {
    const source = parseBandoMarkdown(markdown);
    return source ? [source] : [];
  });
  const fallbackCandidates = sources.filter(
    (source) =>
      getKind(source) === null &&
      !isExplicitlyExcluded(source) &&
      isVerifiedBandoSource(source) &&
      getAgendaDatesFromBando(source).some(
        ({ startDate, endDate }) => (endDate ?? startDate) >= today,
      ),
  );
  const classifications =
    fallbackCandidates.length > 0
      ? await classify(fallbackCandidates)
      : new Map<string, AgendaItemKind | null>();
  const sourceIds = new Set(sources.map((source) => source.sourceId));
  const discovered = sources.flatMap((source) => {
    const deterministicKind = getKind(source);
    const kind = deterministicKind ?? classifications.get(source.sourceId) ?? null;
    return deriveAgendaItemsWithKind(source, kind);
  });
  const preservedExisting = existingItems.filter((item) => {
    const sourceId = item.id.match(/^bando:(\d+):\d+$/)?.[1];
    return !sourceId || !sourceIds.has(sourceId);
  });

  return mergeAgendaItems(preservedExisting, discovered);
}
