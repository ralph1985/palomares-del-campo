import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

export const RSS_URL = 'https://www.bandomovil.com/rss.php?codigo=palomaresdelcampo';
export const SOURCE_NAME = 'Palomares del Campo Informa';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const contentDirectory = path.join(projectRoot, 'src', 'content', 'bandos');
const execFileAsync = promisify(execFile);

export function parseRSSItems(xmlText) {
  return [...xmlText.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].map(([, itemXml]) => ({
    title: extractXMLContent(itemXml, 'title'),
    link: extractXMLContent(itemXml, 'link'),
    description: extractXMLContent(itemXml, 'description'),
    category: extractXMLContent(itemXml, 'category') || 'Info General',
    pubDate: extractXMLContent(itemXml, 'pubDate'),
    guid: extractXMLContent(itemXml, 'guid'),
  }));
}

export function extractXMLContent(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  if (!match) return '';

  let content = match[1].trim();
  if (content.startsWith('<![CDATA[') && content.endsWith(']]>')) {
    content = content.slice(9, -3);
  }

  return decodeXmlEntities(content);
}

export function generateFilename(title, guid) {
  const id = guid.match(/[?&]id=(\d+)/i)?.[1];
  const slug = slugify(title);
  return id ? `${id}-${slug}` : slug;
}

export function createBandoMarkdown(item) {
  const date = new Date(item.pubDate);
  if (Number.isNaN(date.valueOf())) {
    throw new Error(`Invalid publication date for bando: ${item.title}`);
  }

  const sourceUrl = sanitizeHttpsUrl(item.link);
  if (!sourceUrl) {
    throw new Error(`Invalid source URL for bando: ${item.title}`);
  }

  const description = cleanHTML(item.description);
  const sourceId = item.guid.match(/[?&]id=(\d+)/i)?.[1] ?? '';

  return `---
title: '${escapeYaml(item.title)}'
description: '${escapeYaml(description)}'
author: 'Ayuntamiento de Palomares del Campo'
date: ${date.toISOString()}
category: '${escapeYaml(item.category || 'Info General')}'
sourceName: '${SOURCE_NAME}'
sourceUrl: '${escapeYaml(sourceUrl)}'
sourceId: '${escapeYaml(sourceId)}'
---

${htmlToMarkdown(item.description)}
`;
}

export function cleanHTML(html) {
  const text = htmlToMarkdown(html).replaceAll(/\s+/g, ' ').trim();
  return text.length > 180 ? `${text.slice(0, 180).trimEnd()}…` : text;
}

export function htmlToMarkdown(html) {
  let content = decodeXmlEntities(html ?? '');
  content = stripDangerousBlocks(content)
    .replaceAll(/<br\s*\/?>(?=\s*)/gi, '\n')
    .replaceAll(/<\/?p[^>]*>/gi, '\n\n')
    .replaceAll(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replaceAll(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
    .replaceAll(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
    .replaceAll(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*')
    .replaceAll(/<[^>]+>/g, '')
    .replaceAll(/\r/g, '')
    .replaceAll(/[ \t]+/g, ' ')
    .replaceAll(/\n[ \t]+/g, '\n')
    .replaceAll(/\n{3,}/g, '\n\n')
    .trim();

  return content;
}

export function generateFrontmatter(item) {
  return createBandoMarkdown(item).split('---\n').slice(1, 2)[0];
}

export function slugify(value) {
  return value
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-|-$/g, '')
    .slice(0, 70)
    .replace(/-$/, '');
}

export function decodeXmlEntities(value) {
  const namedEntities = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    nbsp: ' ',
    quot: '"',
  };

  return value.replaceAll(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
    if (entity.startsWith('#x')) {
      return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
    }
    if (entity.startsWith('#')) {
      return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
    }
    return namedEntities[entity.toLowerCase()] ?? match;
  });
}

export function stripDangerousBlocks(value) {
  return value.replaceAll(/<(script|style|iframe|object|embed|svg)[^>]*>[\s\S]*?<\/\1>/gi, '');
}

export function sanitizeHttpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

export function escapeYaml(value) {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll("'", "''")
    .replaceAll('\n', '\\n')
    .replaceAll('\r', '\\r');
}

export async function fetchBandos() {
  const response = await fetch(RSS_URL, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) {
    throw new Error(`RSS request failed with HTTP ${response.status}`);
  }

  const items = parseRSSItems(await response.text());
  if (items.length === 0) {
    throw new Error('The RSS feed did not contain any bandos');
  }

  await fs.mkdir(contentDirectory, { recursive: true });
  let created = 0;
  let updated = 0;

  for (const item of items) {
    const filePath = path.join(contentDirectory, `${generateFilename(item.title, item.guid)}.md`);
    const markdown = createBandoMarkdown(item);
    let previous = '';
    try {
      previous = await fs.readFile(filePath, 'utf8');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    if (previous === markdown) continue;
    await fs.writeFile(filePath, markdown, 'utf8');
    if (previous) updated += 1;
    else created += 1;
  }

  if (created || updated) {
    await execFileAsync('pnpm', ['exec', 'prettier', '--write', 'src/content/bandos'], {
      cwd: projectRoot,
    });
  }

  return { created, updated, total: items.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await fetchBandos();
    console.log(
      `Bandos importados: ${result.created} nuevos, ${result.updated} actualizados, ${result.total} recibidos.`,
    );
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
