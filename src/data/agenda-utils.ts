import type { AgendaItem } from './current-affairs';

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeLocation(value: string): string {
  return slugify(value).replace(/-de-palomares-del-campo$/, '');
}

function areSameAgendaItem(left: AgendaItem, right: AgendaItem): boolean {
  if (
    left.kind !== right.kind ||
    left.startDate !== right.startDate ||
    (left.endDate && right.endDate && left.endDate !== right.endDate) ||
    slugify(left.title) !== slugify(right.title)
  ) {
    return false;
  }

  const leftTime = left.startTime ?? left.deadlineTime;
  const rightTime = right.startTime ?? right.deadlineTime;
  return !leftTime || !rightTime || leftTime === rightTime;
}

function mergeDuplicateAgendaItems(left: AgendaItem, right: AgendaItem): AgendaItem {
  const rightIsNewer = Date.parse(right.source.publishedAt) >= Date.parse(left.source.publishedAt);
  const preferred = rightIsNewer ? right : left;
  const fallback = rightIsNewer ? left : right;
  const locationConflict =
    Boolean(left.location && right.location) &&
    normalizeLocation(left.location ?? '') !== normalizeLocation(right.location ?? '');
  const samePublicationTime =
    Date.parse(left.source.publishedAt) === Date.parse(right.source.publishedAt);
  const summary = samePublicationTime
    ? [preferred.summary, fallback.summary]
        .filter((value): value is string => Boolean(value))
        .sort((a, b) => b.length - a.length)[0]
    : (preferred.summary ?? fallback.summary);

  const merged: AgendaItem = {
    ...fallback,
    ...preferred,
    category: preferred.category === 'Actividad pública' ? fallback.category : preferred.category,
    ...(preferred.endDate || fallback.endDate
      ? { endDate: preferred.endDate ?? fallback.endDate }
      : {}),
    ...(preferred.startTime || fallback.startTime
      ? { startTime: preferred.startTime ?? fallback.startTime }
      : {}),
    ...(preferred.deadlineTime || fallback.deadlineTime
      ? { deadlineTime: preferred.deadlineTime ?? fallback.deadlineTime }
      : {}),
    ...(locationConflict
      ? {}
      : preferred.location || fallback.location
        ? { location: preferred.location ?? fallback.location }
        : {}),
    ...(summary ? { summary } : {}),
    ...(preferred.audience || fallback.audience
      ? { audience: preferred.audience ?? fallback.audience }
      : {}),
    ...(preferred.status || fallback.status ? { status: preferred.status ?? fallback.status } : {}),
  };
  if (locationConflict) delete merged.location;
  return merged;
}

export function mergeAgendaItems(
  existingItems: readonly AgendaItem[],
  discoveredItems: readonly AgendaItem[],
): AgendaItem[] {
  const merged: AgendaItem[] = [];
  for (const item of [...existingItems, ...discoveredItems]) {
    const sameSourceIndex = merged.findIndex((previous) => previous.id === item.id);
    if (sameSourceIndex >= 0) {
      const previous = merged[sameSourceIndex];
      if (
        previous &&
        Date.parse(item.source.publishedAt) >= Date.parse(previous.source.publishedAt)
      ) {
        merged[sameSourceIndex] = item;
      }
      continue;
    }

    const duplicateIndex = merged.findIndex((previous) => areSameAgendaItem(previous, item));
    if (duplicateIndex < 0) {
      merged.push(item);
    } else {
      const duplicate = merged[duplicateIndex];
      if (duplicate) merged[duplicateIndex] = mergeDuplicateAgendaItems(duplicate, item);
      else merged.push(item);
    }
  }

  return merged.sort((left, right) => {
    const dateOrder = left.startDate.localeCompare(right.startDate);
    if (dateOrder !== 0) return dateOrder;
    const leftTime = left.startTime ?? left.deadlineTime ?? '';
    const rightTime = right.startTime ?? right.deadlineTime ?? '';
    const timeOrder = leftTime.localeCompare(rightTime);
    return timeOrder !== 0 ? timeOrder : left.title.localeCompare(right.title, 'es');
  });
}

export interface AgendaItemSections {
  upcoming: AgendaItem[];
  past: AgendaItem[];
  cancelled: AgendaItem[];
}

export function splitAgendaItems(items: readonly AgendaItem[], today: string): AgendaItemSections {
  const sections: AgendaItemSections = { upcoming: [], past: [], cancelled: [] };
  for (const item of mergeAgendaItems([], items)) {
    if (item.status === 'cancelled') {
      sections.cancelled.push(item);
    } else if ((item.endDate ?? item.startDate) < today) {
      sections.past.push(item);
    } else {
      sections.upcoming.push(item);
    }
  }
  return sections;
}

export function getDateInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value;
  const year = part('year');
  const month = part('month');
  const day = part('day');
  if (!year || !month || !day) throw new Error(`Cannot compute date for timezone ${timeZone}.`);
  return `${year}-${month}-${day}`;
}
