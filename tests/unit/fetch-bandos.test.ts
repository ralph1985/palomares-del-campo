import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createBandoMarkdown,
  fetchBandomovilText,
  generateFilename,
  getBandomovilPublicationYear,
  getImportMode,
  htmlToMarkdown,
  mergeRSSDetailAttachments,
  mergeExistingAttachments,
  parseArchiveItems,
  parseBandomovilDate,
  parseRSSItems,
} from '../../scripts/fetch-bandos.ts';

const rss = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Aviso de agua</title>
      <link>https://www.bandomovil.com/vercomunicado.php?cod_municipio=palomaresdelcampo&amp;id=123</link>
      <description><![CDATA[Habrá un corte de agua.<br><strong>De 9:00 a 12:00</strong>]]></description>
      <category>Avisos</category>
      <pubDate>Sun, 11 Oct 2026 10:00:00 +0200</pubDate>
      <guid>https://www.bandomovil.com/vercomunicado.php?cod_municipio=palomaresdelcampo&amp;id=123</guid>
    </item>
  </channel>
</rss>`;

const archivePage = `
  <li>
    <a href="/palomaresdelcampo/1641085/0" class="external">
      <div class="post-category"><h3>Aviso de agua</h3></div>
      <div class="post-publication"><p>11-Septiembre-2026 11:28</p></div>
      <span class="badge">Info General</span>
      <div class="comunicadobody"><div>Aviso corte de agua.<br><img src="https://www.bandomovil.com/userFiles/5r/aviso.jpg" alt="Cartel del aviso"><br><a href="https://www.bandomovil.com/userFiles/5r/aviso.pdf">aviso.pdf</a></div></div>
    </a>
  </li>
`;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('import mode', () => {
  it('uses incremental RSS by default and allows explicit archive backfill', () => {
    expect(getImportMode(undefined)).toBe('rss');
    expect(getImportMode('rss')).toBe('rss');
    expect(getImportMode('archive')).toBe('archive');
    expect(getImportMode('unexpected')).toBe('rss');
  });
});

describe('fetch bandos', () => {
  it('parses RSS items and decodes their source fields', () => {
    const [item] = parseRSSItems(rss);
    if (!item) throw new Error('RSS fixture should contain an item.');

    expect(item).toMatchObject({
      title: 'Aviso de agua',
      category: 'Avisos',
      link: 'https://www.bandomovil.com/vercomunicado.php?cod_municipio=palomaresdelcampo&id=123',
      guid: 'https://www.bandomovil.com/vercomunicado.php?cod_municipio=palomaresdelcampo&id=123',
    });
    expect(item.description).toContain('<br>');
  });

  it('rejects a cross-host redirect after revalidating each redirect hop', async () => {
    let requests = 0;
    vi.stubGlobal('fetch', async (_input: RequestInfo | URL, init?: RequestInit) => {
      requests += 1;
      expect(init?.redirect).toBe('manual');
      return new Response(null, {
        status: 302,
        headers: {
          location:
            requests === 1 ? '/palomaresdelcampo/123/canonical' : 'http://127.0.0.1:8080/metadata',
        },
      });
    });

    await expect(
      fetchBandomovilText('https://www.bandomovil.com/palomaresdelcampo/123/0'),
    ).rejects.toThrow(/redirect.*host/i);
    expect(requests).toBe(2);
  });

  it('follows a same-host HTTPS redirect manually', async () => {
    let requests = 0;
    vi.stubGlobal('fetch', async (_input: RequestInfo | URL, init?: RequestInit) => {
      requests += 1;
      expect(init?.redirect).toBe('manual');
      return requests === 1
        ? new Response(null, {
            status: 302,
            headers: { location: '/palomaresdelcampo/123/canonical' },
          })
        : new Response('official page', { status: 200 });
    });

    await expect(
      fetchBandomovilText('https://www.bandomovil.com/palomaresdelcampo/123/0'),
    ).resolves.toBe('official page');
    expect(requests).toBe(2);
  });

  it('recovers document attachments from the official RSS detail page', () => {
    const [item] = parseRSSItems(rss);
    if (!item) throw new Error('RSS fixture should contain an item.');

    expect(
      mergeRSSDetailAttachments(
        item,
        '<a href="https://www.bandomovil.com/userFiles/qC/cartel.pdf">cartel.pdf</a>',
      ),
    ).toMatchObject({
      description: item.description,
      attachments: [
        {
          type: 'document',
          url: 'https://www.bandomovil.com/userFiles/qC/cartel.pdf',
          label: 'cartel.pdf',
        },
      ],
    });
  });

  it('parses archive entries and their Spanish publication dates', () => {
    const [item] = parseArchiveItems(archivePage);
    if (!item) throw new Error('Archive fixture should contain an item.');

    expect(item).toMatchObject({
      title: 'Aviso de agua',
      category: 'Info General',
      sourceId: '1641085',
      link: 'https://www.bandomovil.com/palomaresdelcampo/1641085/0',
    });
    expect(item.description).toContain('aviso.pdf');
    expect(item.pubDate).toBe('2026-09-11T09:28:00.000Z');
    expect(item.attachments).toEqual([
      {
        type: 'image',
        url: 'https://www.bandomovil.com/userFiles/5r/aviso.jpg',
        label: 'Cartel del aviso',
        alt: 'Cartel del aviso',
      },
      {
        type: 'document',
        url: 'https://www.bandomovil.com/userFiles/5r/aviso.pdf',
        label: 'aviso.pdf',
      },
    ]);
    expect(parseBandomovilDate('11-Septiembre-2026 11:28').toISOString()).toBe(
      '2026-09-11T09:28:00.000Z',
    );
    expect(parseBandomovilDate('11-Enero-2026 11:28').toISOString()).toBe(
      '2026-01-11T10:28:00.000Z',
    );
  });

  it('fails the archive import closed when a publication time is ambiguous', () => {
    const ambiguousPage = archivePage.replace('11-Septiembre-2026 11:28', '25-Octubre-2026 02:30');

    expect(() => parseArchiveItems(ambiguousPage)).toThrow(/is ambiguous in Europe\/Madrid/);
  });

  it('uses the Madrid publication year when the UTC instant falls in the previous year', () => {
    expect(getBandomovilPublicationYear('2025-12-31T23:30:00.000Z')).toBe(2026);
  });

  it('rejects nonexistent and ambiguous local publication times', () => {
    expect(() => parseBandomovilDate('29-Marzo-2026 02:30')).toThrow(
      /does not exist in Europe\/Madrid/,
    );
    expect(() => parseBandomovilDate('25-Octubre-2026 02:30')).toThrow(
      /is ambiguous in Europe\/Madrid/,
    );
  });

  it('creates a stable id-based filename', () => {
    expect(generateFilename('Aviso de agua', '')).toBe('aviso-de-agua');
    expect(
      generateFilename(
        'Aviso de agua',
        'https://www.bandomovil.com/vercomunicado.php?cod_municipio=palomaresdelcampo&id=123',
      ),
    ).toBe('123-aviso-de-agua');
  });

  it('preserves attachments already imported when RSS omits them', () => {
    const previousMarkdown = createBandoMarkdown({
      title: 'Aviso de agua',
      link: 'https://www.bandomovil.com/palomaresdelcampo/123/0',
      description: 'Aviso completo',
      category: 'Avisos',
      pubDate: 'Sun, 11 Oct 2026 10:00:00 +0200',
      guid: 'https://www.bandomovil.com/palomaresdelcampo/123/0',
      attachments: [
        {
          type: 'document',
          url: 'https://www.bandomovil.com/userFiles/5r/aviso.pdf',
          label: 'aviso.pdf',
        },
      ],
    });

    const merged = mergeExistingAttachments(
      {
        title: 'Aviso de agua',
        description: 'Resumen RSS',
        attachments: [],
      },
      previousMarkdown,
    );

    expect(merged.attachments).toEqual([
      {
        type: 'document',
        url: 'https://www.bandomovil.com/userFiles/5r/aviso.pdf',
        label: 'aviso.pdf',
      },
    ]);
  });

  it('sanitizes imported HTML while keeping readable Markdown', () => {
    const markdown = createBandoMarkdown({
      title: 'Aviso de agua',
      link: 'https://www.bandomovil.com/vercomunicado.php?cod_municipio=palomaresdelcampo&id=123',
      description:
        '<p>Habrá un corte.</p><script>alert(1)</script><br><strong>De 9:00 a 12:00</strong>',
      category: 'Avisos',
      pubDate: 'Sun, 11 Oct 2026 10:00:00 +0200',
      guid: 'https://www.bandomovil.com/vercomunicado.php?cod_municipio=palomaresdelcampo&id=123',
      attachments: [
        {
          type: 'document',
          url: 'https://www.bandomovil.com/userFiles/5r/aviso.pdf',
          label: 'aviso.pdf',
        },
      ],
    });

    expect(markdown).toContain("title: 'Aviso de agua'");
    expect(markdown).toContain('sourceName:');
    expect(markdown).toContain("  - type: 'document'");
    expect(markdown).toContain("    url: 'https://www.bandomovil.com/userFiles/5r/aviso.pdf'");
    expect(markdown).toContain('Habrá un corte.');
    expect(markdown).toContain('**De 9:00 a 12:00**');
    expect(markdown).not.toContain('<script>');
  });

  it('drops the contents of an unclosed dangerous HTML element', () => {
    expect(htmlToMarkdown('<script>alert(2)')).not.toContain('alert(2)');
    expect(htmlToMarkdown('<unclosed')).not.toContain('<');
  });
});
