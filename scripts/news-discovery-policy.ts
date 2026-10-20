export const DEFAULT_ALLOWED_NEWS_DOMAINS = [
  'cuencanews.es',
  'eldigitaldecuenca.com',
  'eldecuenca.es',
  'eldiario.es',
  'eldiarioclm.es',
  'eldiadigital.es',
  'encastillalamancha.es',
  'enciendecuenca.com',
  'europapress.es',
  'lacerca.com',
  'lasnoticiasdecuenca.es',
  'latribunadecuenca.es',
  'clm24.es',
  'cmmedia.es',
  'castillalamancha.es',
  'vocesdecuenca.com',
] as const;

export const DEFAULT_NEWS_CATEGORIES = [
  'Cultura y tradiciones',
  'Economía y comercio',
  'Educación y comunidad',
  'Infraestructuras',
  'Medio ambiente e infraestructuras',
  'Movilidad e infraestructuras',
  'Municipio y servicios',
  'Patrimonio y cultura',
  'Sucesos y emergencias',
] as const;

export interface ExistingNewsReference {
  title: string;
  sourceUrl: string;
}

export interface NewsCandidate extends ExistingNewsReference {
  title: string;
  description: string;
  date: string;
  sourceName: string;
  category?: string;
  localRelevance: string;
  bodyMarkdown: string;
}

export interface RejectedNewsCandidate {
  index: number;
  reason: string;
}

export interface NewsCandidateValidation {
  accepted: NewsCandidate[];
  rejected: RejectedNewsCandidate[];
}

export interface ValidateNewsOptions {
  allowedDomains?: readonly string[];
  existingNews?: readonly ExistingNewsReference[];
  lookbackDays?: number;
  maxArticles?: number;
  today?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readString = (
  record: Record<string, unknown>,
  key: string,
  maxLength: number,
  minLength = 1,
): string | undefined => {
  const value = record[key];
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  if (normalized.length < minLength || normalized.length > maxLength || /[\r\n]/.test(normalized)) {
    return undefined;
  }
  return normalized;
};

const normalizeDomain = (domain: string): string =>
  domain
    .trim()
    .toLowerCase()
    .replace(/^www\./, '');

const isIsoDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
};

export function isAllowedNewsSource(
  value: string,
  allowedDomains: readonly string[] = DEFAULT_ALLOWED_NEWS_DOMAINS,
): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) {
      return false;
    }

    const hostname = normalizeDomain(url.hostname);
    return allowedDomains.some((domain) => {
      const normalizedDomain = normalizeDomain(domain);
      return (
        normalizedDomain.length > 0 &&
        (hostname === normalizedDomain || hostname.endsWith(`.${normalizedDomain}`))
      );
    });
  } catch {
    return false;
  }
}

export function normalizeNewsUrl(value: string): string {
  try {
    const url = new URL(value);
    url.hash = '';
    url.hostname = normalizeDomain(url.hostname);
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_.+|fbclid|gclid|mc_[ce]id|ref|source)$/i.test(key)) {
        url.searchParams.delete(key);
      }
    }
    url.searchParams.sort();
    const pathname = url.pathname.length > 1 ? url.pathname.replace(/\/$/, '') : url.pathname;
    const query = url.searchParams.toString();
    return `${url.origin.toLowerCase()}${pathname}${query ? `?${query}` : ''}`;
  } catch {
    return '';
  }
}

export function normalizeNewsTitle(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const normalizeEditorialText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const normalizeUrlPathSegment = (segment: string): string => {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
};

const isExcludedNotice = ({
  title,
  description,
  sourceName,
  sourceUrl,
  bodyMarkdown,
}: Pick<
  NewsCandidate,
  'title' | 'description' | 'sourceName' | 'sourceUrl' | 'bodyMarkdown'
>): boolean => {
  const normalizedTitle = normalizeEditorialText(title).trim();
  const text = normalizeEditorialText(`${title}\n${description}\n${sourceName}\n${bodyMarkdown}`);
  const noticeTitle =
    /^(?:aviso(?:s)?|anuncio(?:s)?|convocatoria(?:s)?|recordatorio(?:s)?)(?:\b|[:\s-])/.test(
      normalizedTitle,
    );
  const bandoContent = /\bbandomovil\b|\bbando(?:s)?(?:\s+municipal(?:es)?)?\b/.test(text);
  let noticePath = false;
  try {
    const url = new URL(sourceUrl);
    const hostname = normalizeDomain(url.hostname);
    noticePath =
      hostname === 'bandomovil.com' ||
      hostname.endsWith('.bandomovil.com') ||
      url.pathname
        .split('/')
        .filter(Boolean)
        .some((segment) =>
          /^(?:bando(?:s)?|aviso(?:s)?|anuncio(?:s)?|convocatoria(?:s)?|recordatorio(?:s)?)$/.test(
            normalizeEditorialText(normalizeUrlPathSegment(segment)),
          ),
        );
  } catch {
    // Invalid URLs are rejected by the source policy; no path inference is needed here.
  }
  return noticeTitle || bandoContent || noticePath;
};

const isExcludedNonNews = ({
  title,
  description,
  sourceName,
  sourceUrl,
}: Pick<NewsCandidate, 'title' | 'description' | 'sourceName' | 'sourceUrl'>): boolean => {
  const normalizedTitle = normalizeEditorialText(title).trim();
  const normalizedText = normalizeEditorialText(`${title}\n${description}`);
  const normalizedSourceName = normalizeEditorialText(sourceName);
  const agendaSource = /\b(?:agenda|calendario)\b/.test(normalizedSourceName);
  const employmentSource =
    /\b(?:portal de empleo|ofertas? de (?:empleo|trabajo)|ofertas? laboral(?:es)?|bolsa de (?:empleo|trabajo)|vacantes?)\b/.test(
      normalizedSourceName,
    );
  const agendaContent =
    /^(?:agenda|calendario de (?:actividades|eventos))\b/.test(normalizedTitle) ||
    /\bagenda\s+(?:cultural|semanal|de actividades|de eventos)\b/.test(normalizedText) ||
    agendaSource;
  const employmentContent =
    /\b(?:ofertas? de (?:empleo|trabajo)|ofertas? laboral(?:es)?|bolsa de (?:empleo|trabajo)|puestos? de (?:empleo|trabajo)|vacantes?)\b/.test(
      normalizedText,
    ) ||
    /^(?:se busca|se buscan|se necesita|se necesitan)\b/.test(normalizedTitle) ||
    employmentSource;
  const opinionContent =
    /^(?:opinion|editorial|columna|tribuna)\b/.test(normalizedTitle) ||
    /\b(?:opinion|editorial|columna|tribuna)\b/.test(normalizedSourceName);

  let excludedPath = false;
  try {
    const pathSegments = new URL(sourceUrl).pathname
      .split('/')
      .filter(Boolean)
      .map((segment) =>
        normalizeEditorialText(normalizeUrlPathSegment(segment))
          .replace(/[^a-z0-9]+/g, ' ')
          .trim(),
      );
    excludedPath = pathSegments.some(
      (segment) =>
        /^(?:agenda|agendas|calendario)$/.test(segment) ||
        /^(?:empleo|empleos|trabajo|jobs|vacantes|ofertas de empleo)$/.test(segment) ||
        /^(?:opinion|opiniones|editorial|columna|columnas|tribuna)$/.test(segment),
    );
  } catch {
    // Invalid URLs are rejected by the source policy; no path inference is needed here.
  }
  return agendaContent || employmentContent || opinionContent || excludedPath;
};

const getCandidateRejection = (
  value: unknown,
  options: Required<Pick<ValidateNewsOptions, 'allowedDomains' | 'lookbackDays' | 'today'>>,
  seenUrls: Set<string>,
  seenTitles: Set<string>,
): { candidate?: NewsCandidate; reason?: string } => {
  if (!isRecord(value)) return { reason: 'invalid-candidate' };
  if (value.type !== 'news') return { reason: 'not-news' };

  const title = readString(value, 'title', 160, 8);
  const description = readString(value, 'description', 320, 20);
  const date = readString(value, 'date', 10);
  const sourceName = readString(value, 'sourceName', 100, 2);
  const sourceUrlValue = readString(value, 'sourceUrl', 2048, 8);
  const localRelevance = readString(value, 'localRelevance', 500, 20);
  const bodyMarkdown = typeof value.bodyMarkdown === 'string' ? value.bodyMarkdown.trim() : '';

  if (
    !title ||
    !description ||
    !date ||
    !sourceName ||
    !sourceUrlValue ||
    !localRelevance ||
    bodyMarkdown.length < 80 ||
    bodyMarkdown.length > 5000
  ) {
    return { reason: 'invalid-fields' };
  }
  if (!isIsoDate(date)) return { reason: 'invalid-date' };
  if (date > options.today) return { reason: 'future-date' };

  const cutoff = new Date(`${options.today}T00:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - (options.lookbackDays - 1));
  if (date < cutoff.toISOString().slice(0, 10)) return { reason: 'outside-date-window' };

  if (!isAllowedNewsSource(sourceUrlValue, options.allowedDomains)) {
    return { reason: 'source-not-allowed' };
  }
  if (
    isExcludedNotice({ title, description, sourceName, sourceUrl: sourceUrlValue, bodyMarkdown })
  ) {
    return { reason: 'excluded-notice' };
  }
  if (isExcludedNonNews({ title, description, sourceName, sourceUrl: sourceUrlValue })) {
    return { reason: 'excluded-non-news' };
  }
  if (!localRelevance.toLowerCase().includes('palomares del campo')) {
    return { reason: 'no-direct-local-connection' };
  }
  if (
    /<\/?[a-z][^>]*>/i.test(bodyMarkdown) ||
    /!?\[[^\]]{1,200}\]\s*\([^)]*\)/.test(bodyMarkdown) ||
    /!?\[[^\]]{1,200}\]\s*\[[^\]]{0,200}\]/.test(bodyMarkdown) ||
    /^\s{0,3}\[[^\]]{1,200}\]:\s*\S+/m.test(bodyMarkdown) ||
    /\b(?:[a-z][a-z0-9+.-]{1,31}:\S+|www\.\S+)/i.test(bodyMarkdown) ||
    /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i.test(bodyMarkdown) ||
    /^\s*---\s*$/m.test(bodyMarkdown) ||
    /javascript:/i.test(bodyMarkdown)
  ) {
    return { reason: 'unsafe-markdown' };
  }

  const categoryValue = value.category;
  if (categoryValue !== undefined && categoryValue !== null && categoryValue !== '') {
    if (
      typeof categoryValue !== 'string' ||
      !DEFAULT_NEWS_CATEGORIES.some((category) => category === categoryValue)
    ) {
      return { reason: 'invalid-category' };
    }
  }

  const sourceUrl = normalizeNewsUrl(sourceUrlValue);
  if (!sourceUrl) return { reason: 'invalid-source-url' };
  if (seenUrls.has(sourceUrl)) return { reason: 'duplicate-source' };

  const normalizedTitle = normalizeNewsTitle(title);
  if (!normalizedTitle || seenTitles.has(normalizedTitle)) return { reason: 'duplicate-title' };

  seenUrls.add(sourceUrl);
  seenTitles.add(normalizedTitle);

  const candidate: NewsCandidate = {
    title,
    description,
    date,
    sourceName,
    sourceUrl,
    localRelevance,
    bodyMarkdown,
    ...(typeof categoryValue === 'string' && categoryValue ? { category: categoryValue } : {}),
  };
  return { candidate };
};

export function validateNewsCandidates(
  payload: unknown,
  options: ValidateNewsOptions = {},
): NewsCandidateValidation {
  if (!isRecord(payload) || !Array.isArray(payload.candidates)) {
    throw new Error('Codex no devolvió un objeto con la lista candidates esperada.');
  }
  if (payload.candidates.length > 20) {
    throw new Error('Codex devolvió más de 20 candidatos; se cancela la validación.');
  }

  const today = options.today ?? new Date().toISOString().slice(0, 10);
  const lookbackDays = options.lookbackDays ?? 30;
  const maxArticles = options.maxArticles ?? 3;
  if (!isIsoDate(today)) throw new Error('today debe ser una fecha ISO válida.');
  if (!Number.isInteger(lookbackDays) || lookbackDays < 1 || lookbackDays > 30) {
    throw new Error('lookbackDays debe ser un entero entre 1 y 30.');
  }
  if (!Number.isInteger(maxArticles) || maxArticles < 1 || maxArticles > 10) {
    throw new Error('maxArticles debe ser un entero entre 1 y 10.');
  }

  const existingNews = options.existingNews ?? [];
  const seenUrls = new Set(
    existingNews.map((item) => normalizeNewsUrl(item.sourceUrl)).filter(Boolean),
  );
  const seenTitles = new Set(
    existingNews.map((item) => normalizeNewsTitle(item.title)).filter(Boolean),
  );
  const accepted: NewsCandidate[] = [];
  const rejected: RejectedNewsCandidate[] = [];
  const validationOptions = {
    allowedDomains: options.allowedDomains ?? DEFAULT_ALLOWED_NEWS_DOMAINS,
    lookbackDays,
    today,
  };

  for (const [index, value] of payload.candidates.entries()) {
    if (accepted.length >= maxArticles) {
      rejected.push({ index, reason: 'max-articles-per-run' });
      continue;
    }
    const result = getCandidateRejection(value, validationOptions, seenUrls, seenTitles);
    if (result.candidate) accepted.push(result.candidate);
    else rejected.push({ index, reason: result.reason ?? 'invalid-candidate' });
  }

  return { accepted, rejected };
}

export function renderNewsMarkdown(candidate: NewsCandidate): {
  filename: string;
  content: string;
} {
  const slug = normalizeNewsTitle(candidate.title)
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
    .replace(/-+$/, '');
  if (!slug) throw new Error('La noticia no tiene un título válido para crear el archivo.');

  const frontmatter = [
    '---',
    `title: ${JSON.stringify(candidate.title)}`,
    `description: ${JSON.stringify(candidate.description)}`,
    'author: "Redacción"',
    'authorType: "Organization"',
    `date: ${candidate.date}`,
    `sourceName: ${JSON.stringify(candidate.sourceName)}`,
    `sourceUrl: ${JSON.stringify(candidate.sourceUrl)}`,
    ...(candidate.category ? [`category: ${JSON.stringify(candidate.category)}`] : []),
    'isFeatured: false',
    '---',
  ].join('\n');

  return {
    filename: `${candidate.date}-${slug}.md`,
    content: `${frontmatter}\n\n${candidate.bodyMarkdown.trim()}\n`,
  };
}
