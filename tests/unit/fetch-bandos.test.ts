import { describe, expect, it } from 'vitest';
import {
  createBandoMarkdown,
  generateFilename,
  parseArchiveItems,
  parseBandomovilDate,
  parseRSSItems,
} from '../../scripts/fetch-bandos.js';

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
      <div class="comunicadobody"><div>Aviso corte de agua.<br><a href="https://www.bandomovil.com/userFiles/5r/aviso.pdf">aviso.pdf</a></div></div>
    </a>
  </li>
`;

describe('fetch bandos', () => {
  it('parses RSS items and decodes their source fields', () => {
    const [item] = parseRSSItems(rss);

    expect(item).toMatchObject({
      title: 'Aviso de agua',
      category: 'Avisos',
      link: 'https://www.bandomovil.com/vercomunicado.php?cod_municipio=palomaresdelcampo&id=123',
      guid: 'https://www.bandomovil.com/vercomunicado.php?cod_municipio=palomaresdelcampo&id=123',
    });
    expect(item.description).toContain('<br>');
  });

  it('parses archive entries and their Spanish publication dates', () => {
    const [item] = parseArchiveItems(archivePage);

    expect(item).toMatchObject({
      title: 'Aviso de agua',
      category: 'Info General',
      sourceId: '1641085',
      link: 'https://www.bandomovil.com/palomaresdelcampo/1641085/0',
    });
    expect(item.description).toContain('aviso.pdf');
    expect(parseBandomovilDate('11-Septiembre-2026 11:28').toISOString()).toBe(
      '2026-09-11T11:28:00.000Z',
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

  it('sanitizes imported HTML while keeping readable Markdown', () => {
    const markdown = createBandoMarkdown({
      title: 'Aviso de agua',
      link: 'https://www.bandomovil.com/vercomunicado.php?cod_municipio=palomaresdelcampo&id=123',
      description:
        '<p>Habrá un corte.</p><script>alert(1)</script><br><strong>De 9:00 a 12:00</strong>',
      category: 'Avisos',
      pubDate: 'Sun, 11 Oct 2026 10:00:00 +0200',
      guid: 'https://www.bandomovil.com/vercomunicado.php?cod_municipio=palomaresdelcampo&id=123',
    });

    expect(markdown).toContain("title: 'Aviso de agua'");
    expect(markdown).toContain('sourceName:');
    expect(markdown).toContain('Habrá un corte.');
    expect(markdown).toContain('**De 9:00 a 12:00**');
    expect(markdown).not.toContain('<script>');
  });
});
