import { agendaBandosItems } from './agenda-bandos.generated';
import { manualAgendaItems } from './agenda-manual';
import { mergeAgendaItems } from './agenda-utils';

export type AgendaItemKind = 'event' | 'service' | 'deadline';
export type AgendaItemStatus = 'cancelled';
export type AgendaAudience = 'residents' | 'businesses';

export interface CurrentAffairsSource {
  label: string;
  href: string;
  publishedAt: string;
}

export interface AgendaItem {
  id: string;
  kind: AgendaItemKind;
  title: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  deadlineTime?: string;
  category: string;
  location?: string;
  summary?: string;
  audience?: AgendaAudience;
  source: CurrentAffairsSource;
  status?: AgendaItemStatus;
}

export const agendaItems: AgendaItem[] = mergeAgendaItems(manualAgendaItems, agendaBandosItems);
