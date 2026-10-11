import { describe, expect, it } from 'vitest';
import {
  createBandoMarkdown,
  generateFilename,
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
