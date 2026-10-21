import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ALLOWED_NEWS_DOMAINS,
  isAllowedNewsSource,
  normalizeNewsUrl,
  renderNewsMarkdown,
  validateNewsCandidates,
} from '../../scripts/news-discovery-policy.ts';

const validCandidate = (overrides: Record<string, unknown> = {}) => ({
  type: 'news',
  title: 'Renuevan el parque municipal de Palomares',
  description: 'El Ayuntamiento ha iniciado la mejora del parque municipal de Palomares del Campo.',
  date: '2026-10-18',
  sourceName: 'Voces de Cuenca',
  sourceUrl: 'https://vocesdecuenca.com/provincia/palomares-parque/',
  category: 'Municipio y servicios',
  localRelevance:
    'La actuación anunciada afecta directamente a Palomares del Campo y a sus vecinos.',
  bodyMarkdown:
    'El Ayuntamiento ha iniciado la mejora del parque municipal de Palomares del Campo.\n\nLa actuación incluye trabajos en las zonas de estancia y accesibilidad. La información fue confirmada por la fuente local.',
  ...overrides,
});

describe('Palomares news source policy', () => {
  it('allows HTTPS articles from known Cuenca and Castilla-La Mancha outlets', () => {
    expect(isAllowedNewsSource('https://www.vocesdecuenca.com/noticias/palomares')).toBe(true);
    expect(isAllowedNewsSource('https://cultura.castillalamancha.es/noticias/palomares')).toBe(
      true,
    );
  });

  it('rejects insecure, deceptive, credentialed, and non-editorial domains', () => {
    expect(isAllowedNewsSource('http://vocesdecuenca.com/noticias/palomares')).toBe(false);
    expect(isAllowedNewsSource('https://notvocesdecuenca.com/noticias/palomares')).toBe(false);
    expect(isAllowedNewsSource('https://vocesdecuenca.com.evil.test/noticias/palomares')).toBe(
      false,
    );
    expect(isAllowedNewsSource('https://user:pass@vocesdecuenca.com/noticias/palomares')).toBe(
      false,
    );
    expect(isAllowedNewsSource('https://boe.es/diario_boe/')).toBe(false);
  });

  it('derives its defaults from established Palomares and Belmontejo outlets', () => {
    expect(DEFAULT_ALLOWED_NEWS_DOMAINS).toContain('cuencanews.es');
    expect(DEFAULT_ALLOWED_NEWS_DOMAINS).toContain('eldigitaldecuenca.com');
    expect(DEFAULT_ALLOWED_NEWS_DOMAINS).not.toContain('boe.es');
  });

  it('accepts recent Palomares news and normalizes tracking data for deduplication', () => {
    const result = validateNewsCandidates(
      { candidates: [validCandidate()] },
      { today: '2026-10-20', existingNews: [] },
    );

    expect(result.accepted).toHaveLength(1);
    expect(result.rejected).toEqual([]);
    expect(
      normalizeNewsUrl(
        'https://www.vocesdecuenca.com/provincia/palomares-parque/?utm_source=mail#article',
      ),
    ).toBe('https://vocesdecuenca.com/provincia/palomares-parque');
    expect(normalizeNewsUrl('https://vocesdecuenca.com/noticia/?ref=sidebar&id=15')).toBe(
      'https://vocesdecuenca.com/noticia?id=15',
    );
    expect(normalizeNewsUrl('not a URL')).toBe('');
  });

  it('counts today as one of the 30 inclusive calendar dates in the lookback window', () => {
    const result = validateNewsCandidates(
      {
        candidates: [
          validCandidate({
            date: '2026-09-21',
            title: 'Noticia dentro de los treinta días de Palomares',
            sourceUrl: 'https://vocesdecuenca.com/noticia-dentro-ventana',
          }),
          validCandidate({
            date: '2026-09-20',
            title: 'Noticia fuera de los treinta días de Palomares',
            sourceUrl: 'https://vocesdecuenca.com/noticia-fuera-ventana',
          }),
        ],
      },
      { today: '2026-10-20', lookbackDays: 30 },
    );

    expect(result.accepted.map(({ date }) => date)).toEqual(['2026-09-21']);
    expect(result.rejected).toEqual([{ index: 1, reason: 'outside-date-window' }]);
  });

  it('renders validated news as safe Astro frontmatter and a deterministic filename', () => {
    const result = validateNewsCandidates(
      { candidates: [validCandidate({ title: 'Renuevan el parque municipal de Palomares' })] },
      { today: '2026-10-20', existingNews: [] },
    );
    const candidate = result.accepted[0];
    if (!candidate) throw new Error('Expected one accepted fixture');

    const article = renderNewsMarkdown(candidate);

    expect(article.filename).toBe('2026-10-18-renuevan-el-parque-municipal-de-palomares.md');
    expect(article.content).toContain('title: "Renuevan el parque municipal de Palomares"');
    expect(article.content).toContain('author: "Redacción"');
    expect(article.content).toContain(
      'sourceUrl: "https://vocesdecuenca.com/provincia/palomares-parque"',
    );
    expect(article.content).toContain('isFeatured: false');
    expect(article.content).not.toContain('localRelevance:');
  });

  it('rejects already-published source URLs and normalized duplicate headlines', () => {
    const original = validCandidate();
    const result = validateNewsCandidates(
      {
        candidates: [
          original,
          validCandidate({
            sourceUrl:
              'https://www.vocesdecuenca.com/provincia/palomares-parque/?utm_campaign=weekly',
          }),
          validCandidate({
            title: 'RENUÉVAN el parque municipal de Palomares!!!',
            sourceUrl: 'https://cuencanews.es/noticia-distinta-sobre-el-mismo-parque',
          }),
        ],
      },
      {
        today: '2026-10-20',
        existingNews: [
          {
            title: 'Noticia anterior',
            sourceUrl: 'https://old.example.test/noticia',
          },
        ],
      },
    );

    expect(result.accepted).toHaveLength(1);
    expect(result.rejected.map(({ reason }) => reason)).toEqual([
      'duplicate-source',
      'duplicate-title',
    ]);
  });

  it('rejects stale, future, unrelated, non-news, and unsafe candidates', () => {
    const result = validateNewsCandidates(
      {
        candidates: [
          validCandidate({ date: '2026-08-01' }),
          validCandidate({ date: '2026-10-21' }),
          validCandidate({ sourceUrl: 'https://example.com/local-story' }),
          validCandidate({ localRelevance: 'A provincial development with no local connection.' }),
          validCandidate({ type: 'bando' }),
          validCandidate({ bodyMarkdown: `<script>${'x'.repeat(100)}</script>` }),
        ],
      },
      { today: '2026-10-20', existingNews: [], lookbackDays: 30 },
    );

    expect(result.accepted).toEqual([]);
    expect(result.rejected.map(({ reason }) => reason)).toEqual([
      'outside-date-window',
      'future-date',
      'source-not-allowed',
      'no-direct-local-connection',
      'not-news',
      'unsafe-markdown',
    ]);
  });

  it('rejects a bando or administrative notice even when the model labels it as news', () => {
    const result = validateNewsCandidates(
      {
        candidates: [
          validCandidate({ title: 'Bando municipal: corte de agua en Palomares' }),
          validCandidate({ title: 'Aviso: suspensión temporal del servicio municipal' }),
          validCandidate({ sourceUrl: 'https://vocesdecuenca.com/bandos/corte-de-agua' }),
          validCandidate({
            sourceUrl: 'https://vocesdecuenca.com/noticias/recordatorios/servicio',
          }),
        ],
      },
      { today: '2026-10-20' },
    );

    expect(result.accepted).toEqual([]);
    expect(result.rejected.map(({ reason }) => reason)).toEqual([
      'excluded-notice',
      'excluded-notice',
      'excluded-notice',
      'excluded-notice',
    ]);
  });

  it('rejects agendas, job listings, and opinion pieces even when labelled as news', () => {
    const result = validateNewsCandidates(
      {
        candidates: [
          validCandidate({ title: 'Agenda cultural de octubre en Palomares del Campo' }),
          validCandidate({ title: 'Oferta de empleo para auxiliar municipal en Palomares' }),
          validCandidate({ title: 'Opinión: el futuro de Palomares del Campo' }),
          validCandidate({
            title: 'Noticia local de Palomares sobre actividades culturales',
            sourceUrl: 'https://vocesdecuenca.com/agenda/cultural',
          }),
          validCandidate({
            title: 'Noticia local de Palomares sobre nuevos servicios',
            sourceUrl: 'https://vocesdecuenca.com/empleo/ofertas',
          }),
          validCandidate({
            title: 'Noticia local de Palomares sobre un debate',
            sourceUrl: 'https://vocesdecuenca.com/opinion/columnas',
          }),
          validCandidate({
            title: 'Información local sobre actividades en Palomares',
            sourceName: 'Agenda Cultural de Palomares',
            sourceUrl: 'https://vocesdecuenca.com/noticia-agenda-feed',
          }),
          validCandidate({
            title: 'Información local sobre servicios en Palomares',
            sourceName: 'Portal de ofertas de empleo comarcal',
            sourceUrl: 'https://vocesdecuenca.com/noticia-empleo-feed',
          }),
        ],
      },
      { today: '2026-10-20' },
    );

    expect(result.accepted).toEqual([]);
    expect(result.rejected.map(({ reason }) => reason)).toEqual([
      'excluded-non-news',
      'excluded-non-news',
      'excluded-non-news',
      'excluded-non-news',
      'excluded-non-news',
      'excluded-non-news',
      'excluded-non-news',
      'excluded-non-news',
    ]);
  });

  it('caps each discovery run at three accepted stories', () => {
    const result = validateNewsCandidates(
      {
        candidates: [1, 2, 3, 4].map((number) =>
          validCandidate({
            title: `Noticia municipal ${number} de Palomares`,
            sourceUrl: `https://vocesdecuenca.com/palomares/noticia-${number}`,
          }),
        ),
      },
      { today: '2026-10-20', existingNews: [] },
    );

    expect(result.accepted).toHaveLength(3);
    expect(result.rejected).toEqual([{ index: 3, reason: 'max-articles-per-run' }]);
  });

  it('rejects impossible calendar dates and inline links in generated copy', () => {
    const result = validateNewsCandidates(
      {
        candidates: [
          validCandidate({ date: '2026-02-31' }),
          validCandidate({
            bodyMarkdown:
              'La noticia describe un hecho confirmado en Palomares del Campo.\n\n[Más información](https://example.com/otra-fuente) y otros detalles que no deben añadir enlaces no verificados.',
          }),
          validCandidate({
            sourceUrl: 'https://vocesdecuenca.com/reference-article',
            bodyMarkdown:
              'La noticia describe un hecho confirmado en Palomares del Campo con detalles locales suficientes.\n\nLa información ampliada aparece en el resumen [fuente][referencia].\n\n[referencia]: https://vocesdecuenca.com/noticia',
          }),
          validCandidate({
            sourceUrl: 'https://vocesdecuenca.com/bare-url-article',
            bodyMarkdown:
              'La noticia describe un hecho confirmado en Palomares del Campo con detalles locales suficientes.\n\nPuedes consultar más información en https://vocesdecuenca.com/noticia antes de la revisión editorial.',
          }),
          validCandidate({
            sourceUrl: 'https://vocesdecuenca.com/autolink-article',
            bodyMarkdown:
              'La noticia describe un hecho confirmado en Palomares del Campo con detalles locales suficientes.\n\nLa fuente aparece como un enlace automático <https://vocesdecuenca.com/noticia> dentro del texto.',
          }),
          validCandidate({
            sourceUrl: 'https://vocesdecuenca.com/spaced-link-article',
            bodyMarkdown:
              'La noticia describe un hecho confirmado en Palomares del Campo con detalles locales suficientes.\n\nLa referencia aparece con espacio [fuente] (https://vocesdecuenca.com/noticia) en el texto.',
          }),
        ],
      },
      { today: '2026-10-20', existingNews: [] },
    );

    expect(result.rejected.map(({ reason }) => reason)).toEqual([
      'invalid-date',
      'unsafe-markdown',
      'unsafe-markdown',
      'unsafe-markdown',
      'unsafe-markdown',
      'unsafe-markdown',
    ]);
  });

  it('rejects malformed output and invalid validation settings', () => {
    expect(() => validateNewsCandidates(null)).toThrow('lista candidates esperada');
    expect(() =>
      validateNewsCandidates({ candidates: Array.from({ length: 21 }, () => null) }),
    ).toThrow('más de 20 candidatos');
    expect(() => validateNewsCandidates({ candidates: [] }, { today: '2026-02-31' })).toThrow(
      'today debe ser una fecha ISO válida',
    );
    expect(() => validateNewsCandidates({ candidates: [] }, { lookbackDays: 0 })).toThrow(
      'lookbackDays debe ser un entero',
    );
    expect(() => validateNewsCandidates({ candidates: [] }, { lookbackDays: 31 })).toThrow(
      'lookbackDays debe ser un entero',
    );
    expect(() => validateNewsCandidates({ candidates: [] }, { maxArticles: 11 })).toThrow(
      'maxArticles debe ser un entero',
    );
  });

  it('supports a reviewed source allowlist and handles missing or invalid article fields', () => {
    const accepted = validateNewsCandidates(
      {
        candidates: [
          validCandidate({
            category: null,
            sourceUrl: 'https://trusted.example/palomares/article',
          }),
        ],
      },
      { today: '2026-10-20', existingNews: [], allowedDomains: ['trusted.example'] },
    );
    expect(accepted.accepted).toHaveLength(1);

    const rejected = validateNewsCandidates(
      {
        candidates: [
          null,
          validCandidate({ title: 'Short' }),
          validCandidate({ title: 'Title with\nnewline' }),
          validCandidate({ category: 'Not an approved category' }),
        ],
      },
      { today: '2026-10-20', existingNews: [] },
    );
    expect(rejected.rejected.map(({ reason }) => reason)).toEqual([
      'invalid-candidate',
      'invalid-fields',
      'invalid-fields',
      'invalid-category',
    ]);
  });

  it('renders articles without an optional category', () => {
    const result = validateNewsCandidates(
      { candidates: [validCandidate({ category: null })] },
      { today: '2026-10-20', existingNews: [] },
    );
    const candidate = result.accepted[0];
    if (!candidate) throw new Error('Expected one accepted fixture');

    expect(renderNewsMarkdown(candidate).content).not.toContain('category:');
  });
});
