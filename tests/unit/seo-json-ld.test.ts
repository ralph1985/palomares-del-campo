import { describe, expect, it } from 'vitest';
import { validateJsonLdContent } from '../../scripts/seo-json-ld.ts';

describe('validateJsonLdContent', () => {
  it('accepts a valid Article with a Person author', () => {
    expect(
      validateJsonLdContent(
        JSON.stringify({
          '@type': 'Article',
          author: { '@type': 'Person', name: 'Ana López' },
        }),
      ),
    ).toEqual([]);
  });

  it('accepts an Article inside a JSON-LD array with an Organization author', () => {
    expect(
      validateJsonLdContent(
        JSON.stringify([
          { '@type': 'WebPage' },
          { '@type': 'Article', author: { '@type': 'Organization', name: 'Redacción' } },
        ]),
      ),
    ).toEqual([]);
  });

  it('accepts an Article whose @type is an array', () => {
    expect(
      validateJsonLdContent(
        JSON.stringify({
          '@type': ['WebPage', 'Article'],
          author: { '@type': 'Person', name: 'Ana López' },
        }),
      ),
    ).toEqual([]);
  });

  it('rejects invalid JSON and non-object entries', () => {
    expect(validateJsonLdContent('{')).toContain('invalid JSON-LD');
    expect(validateJsonLdContent('null')).toContain('invalid JSON-LD');
    expect(validateJsonLdContent('"Article"')).toContain('invalid JSON-LD');
    expect(validateJsonLdContent('[{"@type":"WebPage"}, null]')).toContain('invalid JSON-LD');
  });

  it('rejects a malformed @type before it can bypass Article checks', () => {
    expect(validateJsonLdContent('{"@type":42}')).toContain('invalid JSON-LD');
    expect(validateJsonLdContent('{"@type":["Article",42]}')).toContain('invalid JSON-LD');
  });

  it('rejects malformed Article authors and non-string names', () => {
    expect(validateJsonLdContent('{"@type":"Article","author":null}')).toContain(
      'Article author must be a Person or Organization node',
    );
    expect(
      validateJsonLdContent(
        JSON.stringify({ '@type': 'Article', author: { '@type': 'Person', name: 42 } }),
      ),
    ).toContain('Article author node has no name');
  });

  it('does not apply Article author checks to other valid JSON-LD objects', () => {
    expect(validateJsonLdContent('{"@type":"WebPage"}')).toEqual([]);
  });
});
