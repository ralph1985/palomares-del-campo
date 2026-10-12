import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

export const RSS_URL = 'https://www.bandomovil.com/rss.php?codigo=palomaresdelcampo';
export const ARCHIVE_URL = 'https://www.bandomovil.com/web.php?municipio=palomaresdelcampo&pag=';
export const ARCHIVE_ORIGIN = 'https://www.bandomovil.com';
export const SOURCE_NAME = 'Palomares del Campo Informa';
export const TARGET_YEARS = new Set([2025, 2026]);
const REQUEST_TIMEOUT_MS = 30_000;
const DETAIL_CONCURRENCY = 6;

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

const MONTHS = new Map([
  ['enero', 0],
  ['febrero', 1],
  ['marzo', 2],
  ['abril', 3],
  ['mayo', 4],
  ['junio', 5],
  ['julio', 6],
  ['agosto', 7],
  ['septiembre', 8],
  ['octubre', 9],
  ['noviembre', 10],
  ['diciembre', 11],
]);

export function parseBandomovilDate(value) {
  const match = value.trim().match(/^(\d{1,2})-([A-Za-zÁÉÍÓÚáéíóú]+)-(\d{4})\s+(\d{1,2}):(\d{2})$/);
  const month = match ? MONTHS.get(match[2].toLocaleLowerCase('es-ES')) : undefined;

  if (!match || month === undefined) {
    throw new Error(`Invalid Bandomovil date: ${value}`);
  }

  return new Date(
    Date.UTC(Number(match[3]), month, Number(match[1]), Number(match[4]), Number(match[5])),
  );
}

export function parseArchiveItems(html) {
  const itemPattern =
    /<li\b[\s\S]*?href="\/palomaresdelcampo\/(\d+)\/\d+"[\s\S]*?<h3[^>]*>([\s\S]*?)<\/h3>[\s\S]*?<div class="post-publication"[^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>[\s\S]*?<span class="badge"[^>]*>([\s\S]*?)<\/span>[\s\S]*?<div class="comunicadobody"[^>]*>([\s\S]*?)<\/div>/gi;

  return [...html.matchAll(itemPattern)].map((match) => ({
    title: htmlToMarkdown(match[2]),
    link: `${ARCHIVE_ORIGIN}/palomaresdelcampo/${match[1]}/0`,
    description: match[5].trim(),
    category: htmlToMarkdown(match[4]) || 'Info General',
    pubDate: parseBandomovilDate(htmlToMarkdown(match[3])).toISOString(),
    guid: `${ARCHIVE_ORIGIN}/palomaresdelcampo/${match[1]}/0`,
    sourceId: match[1],
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
  const id = guid.match(/[?&]id=(\d+)/i)?.[1] ?? guid.match(/\/palomaresdelcampo\/(\d+)\//i)?.[1];
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
  const sourceId =
    item.sourceId ??
    item.guid.match(/[?&]id=(\d+)/i)?.[1] ??
    item.guid.match(/\/palomaresdelcampo\/(\d+)\//i)?.[1] ??
    '';

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

async function fetchText(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`Bandomovil request failed with HTTP ${response.status}: ${url}`);
  }
  return response.text();
}

function parseArchivePageCount(html) {
  const pages = [
    ...html.matchAll(/web\.php\?municipio=palomaresdelcampo(?:&amp;|&)pag=(\d+)/gi),
  ].map(([, page]) => Number(page));
  return Math.max(0, ...pages) + 1;
}

function deduplicateItems(items) {
  return [...new Map(items.map((item) => [item.sourceId, item])).values()];
}

async function mapWithConcurrency(items, limit, callback) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await callback(items[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

async function fetchArchiveItems() {
  const firstPage = await fetchText(`${ARCHIVE_URL}0`);
  const pageCount = parseArchivePageCount(firstPage);
  const pages = await Promise.all([
    firstPage,
    ...Array.from({ length: pageCount - 1 }, (_, index) => fetchText(`${ARCHIVE_URL}${index + 1}`)),
  ]);
  const items = deduplicateItems(pages.flatMap((page) => parseArchiveItems(page)));

  if (items.length === 0) {
    throw new Error('The Bandomovil archive did not contain any bandos');
  }

  return { items, pageCount };
}

async function fetchArchiveDetail(item) {
  const detailPage = await fetchText(item.link);
  const detail = parseArchiveItems(detailPage).find(
    (candidate) => candidate.sourceId === item.sourceId,
  );
  return detail ?? item;
}

export async function fetchBandos() {
  const { items: archiveItems, pageCount } = await fetchArchiveItems();
  const inScope = archiveItems.filter((item) =>
    TARGET_YEARS.has(new Date(item.pubDate).getUTCFullYear()),
  );
  const items = await mapWithConcurrency(inScope, DETAIL_CONCURRENCY, fetchArchiveDetail);

  await fs.mkdir(contentDirectory, { recursive: true });
  let created = 0;
  let updated = 0;
  let removed = 0;
  const expectedFiles = new Set(
    items.map((item) => `${generateFilename(item.title, item.guid)}.md`),
  );

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

  for (const entry of await fs.readdir(contentDirectory, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.md') || expectedFiles.has(entry.name)) continue;
    await fs.unlink(path.join(contentDirectory, entry.name));
    removed += 1;
  }

  if (created || updated || removed) {
    await execFileAsync('pnpm', ['exec', 'prettier', '--write', 'src/content/bandos'], {
      cwd: projectRoot,
    });
  }

  return { created, updated, removed, total: items.length, pageCount };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await fetchBandos();
    console.log(
      `Bandos importados: ${result.created} nuevos, ${result.updated} actualizados, ${result.removed} eliminados, ${result.total} dentro de 2025–2026 en ${result.pageCount} páginas.`,
    );
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
