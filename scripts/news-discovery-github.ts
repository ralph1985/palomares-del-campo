export interface OpenNewsPullRequest {
  number: number;
  url: string;
  headRefName: string;
}

export function buildOpenNewsPullRequestArgs(): string[] {
  return [
    'api',
    '--paginate',
    '--slurp',
    'repos/ralph1985/palomares-del-campo/pulls?state=open&base=main&per_page=100',
  ];
}

export interface NewsPullRequestBodyItem {
  title: string;
  date: string;
  sourceUrl: string;
}

const escapeMarkdown = (value: string): string => {
  const specialCharacters = new Set([
    '\\',
    '`',
    '*',
    '_',
    '{',
    '}',
    '[',
    ']',
    '(',
    ')',
    '#',
    '+',
    '.',
    '!',
    '|',
    '>',
  ]);
  return [...value]
    .map((character) => (specialCharacters.has(character) ? `\\${character}` : character))
    .join('')
    .replace(/[\r\n]+/g, ' ');
};

const encodeMarkdownUrlDelimiters = (value: string): string => {
  const delimiters = new Set(['(', ')', '[', ']', '<', '>', '\\', '`']);
  return [...value]
    .map((character) =>
      delimiters.has(character)
        ? `%${character.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase()}`
        : character,
    )
    .join('');
};

const safeMarkdownUrl = (value: string): string => {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.port) {
    throw new Error('La fuente de una noticia no es una URL HTTPS válida.');
  }
  url.hash = '';
  return encodeMarkdownUrlDelimiters(url.href);
};

export function buildNewsPullRequestBody(candidates: readonly NewsPullRequestBodyItem[]): string {
  return [
    '## Propuestas automáticas de noticias para Palomares del Campo',
    '',
    'Estas noticias se han redactado a partir de fuentes locales/regionales permitidas y se dejan para revisión editorial. No se publican automáticamente.',
    '',
    ...candidates.map(
      (candidate) =>
        `- **${escapeMarkdown(candidate.title)}** — [fuente](<${safeMarkdownUrl(candidate.sourceUrl)}>) — ${escapeMarkdown(candidate.date)}`,
    ),
    '',
    'Antes de fusionar, comprueba cada dato y la fuente original. La automatización excluye bandos y no destaca artículos automáticamente.',
  ].join('\n');
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isUnknownArray = (value: unknown): value is unknown[] => Array.isArray(value);

export function parseOpenNewsPullRequests(value: unknown): OpenNewsPullRequest[] {
  if (!isUnknownArray(value)) {
    throw new Error('GitHub devolvió una lista de PR no válida.');
  }

  const pullRequests: OpenNewsPullRequest[] = [];
  for (const page of value) {
    if (!isUnknownArray(page)) throw new Error('GitHub devolvió una página de PR no válida.');
    for (const item of page) {
      if (!isRecord(item)) throw new Error('GitHub devolvió una entrada de PR no válida.');
      const number = item.number;
      const urlValue = item.html_url;
      const head = item.head;
      const base = item.base;
      if (
        typeof number !== 'number' ||
        !Number.isSafeInteger(number) ||
        number < 1 ||
        typeof urlValue !== 'string' ||
        !isRecord(head) ||
        !isRecord(base) ||
        typeof head.ref !== 'string' ||
        head.ref.length === 0 ||
        base.ref !== 'main'
      ) {
        throw new Error('GitHub devolvió una entrada de PR no válida.');
      }

      let url: URL;
      try {
        url = new URL(urlValue);
      } catch {
        throw new Error('GitHub devolvió una entrada de PR no válida.');
      }
      if (
        url.protocol !== 'https:' ||
        url.hostname !== 'github.com' ||
        url.pathname !== `/ralph1985/palomares-del-campo/pull/${number}` ||
        url.username ||
        url.password ||
        url.search ||
        url.hash
      ) {
        throw new Error('GitHub devolvió una entrada de PR no válida.');
      }
      pullRequests.push({ number, url: url.toString(), headRefName: head.ref });
    }
  }
  return pullRequests;
}
