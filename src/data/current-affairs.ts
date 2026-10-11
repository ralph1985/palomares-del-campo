export interface CurrentAffairsSource {
  label: string;
  href: string;
}

export interface AgendaItem {
  title: string;
  startDate: string;
  endDate?: string;
  category: string;
  location: string;
  summary: string;
  source: CurrentAffairsSource;
  status: 'upcoming' | 'past' | 'cancelled';
}

export const agendaItems: AgendaItem[] = [];
