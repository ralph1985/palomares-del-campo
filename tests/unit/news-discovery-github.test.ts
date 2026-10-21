import { describe, expect, it } from 'vitest';
import {
  buildOpenNewsPullRequestArgs,
  buildNewsPullRequestBody,
  parseOpenNewsPullRequests,
} from '../../scripts/news-discovery-github.ts';

const openPullRequest = {
  number: 42,
  html_url: 'https://github.com/ralph1985/palomares-del-campo/pull/42',
  head: { ref: 'automation/news-discovery-2026-10-20' },
  base: { ref: 'main' },
};
const unrelatedPullRequest = {
  number: 41,
  html_url: 'https://github.com/ralph1985/palomares-del-campo/pull/41',
  head: { ref: 'feature/unrelated' },
  base: { ref: 'main' },
};

describe('GitHub pending-news pull request adapter', () => {
  it('requests all pages of open pull requests based on main', () => {
    expect(buildOpenNewsPullRequestArgs()).toEqual([
      'api',
      '--paginate',
      '--slurp',
      'repos/ralph1985/palomares-del-campo/pulls?state=open&base=main&per_page=100',
    ]);
  });

  it('encodes Markdown delimiters in model-provided source URLs before linking them', () => {
    const body = buildNewsPullRequestBody([
      {
        title: 'Noticia local validada',
        date: '2026-10-18',
        sourceUrl: 'https://vocesdecuenca.com/noticias/nota)[enlace](https://attacker.example',
      },
    ]);

    expect(body).toContain(
      '[fuente](<https://vocesdecuenca.com/noticias/nota%29%5Benlace%5D%28https://attacker.example>)',
    );
    expect(body).not.toContain(')[enlace](https://attacker.example');
  });

  it('flattens paginated GitHub results and validates every entry', () => {
    expect(parseOpenNewsPullRequests([[unrelatedPullRequest], [openPullRequest]])).toEqual([
      {
        number: 41,
        url: unrelatedPullRequest.html_url,
        headRefName: 'feature/unrelated',
      },
      {
        number: 42,
        url: openPullRequest.html_url,
        headRefName: 'automation/news-discovery-2026-10-20',
      },
    ]);
  });

  it('fails closed on malformed pages, rows, URLs, or a different base branch', () => {
    expect(() => parseOpenNewsPullRequests({ pullRequests: [] })).toThrow(
      'GitHub devolvió una lista de PR no válida',
    );
    expect(() => parseOpenNewsPullRequests([null])).toThrow(
      'GitHub devolvió una página de PR no válida',
    );
    expect(() =>
      parseOpenNewsPullRequests([[{ ...openPullRequest, base: { ref: 'develop' } }]]),
    ).toThrow('GitHub devolvió una entrada de PR no válida');
    expect(() => parseOpenNewsPullRequests([[{ ...openPullRequest, head: {} }]])).toThrow(
      'GitHub devolvió una entrada de PR no válida',
    );
    expect(() =>
      parseOpenNewsPullRequests([[{ ...openPullRequest, html_url: 'not a URL' }]]),
    ).toThrow('GitHub devolvió una entrada de PR no válida');
  });
});
