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

export interface NoticeItem {
  title: string;
  summary: string;
  publishedAt: string;
  expiresAt?: string;
  source: CurrentAffairsSource;
  status: 'current' | 'expired';
}

export const agendaItems: AgendaItem[] = [];
export const noticeItems: NoticeItem[] = [];
