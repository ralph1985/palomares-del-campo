import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import sanitizeHtml from 'sanitize-html';

export const RSS_URL = 'https://www.bandomovil.com/rss.php?codigo=palomaresdelcampo';
export const ARCHIVE_URL = 'https://www.bandomovil.com/web.php?municipio=palomaresdelcampo&pag=';
export const ARCHIVE_ORIGIN = 'https://www.bandomovil.com';
export const SOURCE_NAME = 'Palomares del Campo Informa';
export const TARGET_YEARS = new Set([2025, 2026]);
const REQUEST_TIMEOUT_MS = 30_000;
const DETAIL_CONCURRENCY = 6;
const IMAGE_EXTENSIONS = /\.(?:avif|gif|jpe?g|png|webp)(?:$|[?#])/i;
const VIDEO_EXTENSIONS = /\.(?:mp4|m4v|mov|webm)(?:$|[?#])/i;
const DOCUMENT_EXTENSIONS = /\.(?:docx?|pdf|pptx?|xlsx?|zip)(?:$|[?#])/i;

type AttachmentType = 'image' | 'document' | 'video';
type BandoAttachment = {
  type: string;
  url: string;
  label: string;
  alt?: string;
};
type BandoItem = {
  title: string;
  link: string;
  description: string;
  attachments?: BandoAttachment[];
  category: string;
  pubDate: string;
  guid: string;
  sourceId?: string;
};
type ImportedBandoItem = BandoItem & { attachments: BandoAttachment[] };
type ArchiveBandoItem = ImportedBandoItem & { sourceId: string };
type ImportMode = 'rss' | 'archive';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const contentDirectory = path.join(projectRoot, 'src', 'content', 'bandos');
const execFileAsync = promisify(execFile);

export function parseRSSItems(xmlText: string): ImportedBandoItem[] {
  return [...xmlText.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].flatMap((match) => {
    const itemXml = match[1];
    if (itemXml === undefined) return [];

    const description = extractXMLContent(itemXml, 'description');
    return [
      {
        title: extractXMLContent(itemXml, 'title'),
        link: extractXMLContent(itemXml, 'link'),
        description,
        attachments: extractAttachments(description),
        category: extractXMLContent(itemXml, 'category') || 'Info General',
        pubDate: extractXMLContent(itemXml, 'pubDate'),
        guid: extractXMLContent(itemXml, 'guid'),
      },
    ];
  });
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

const MADRID_DATE_TIME_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Madrid',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function getMadridDateTimeParts(epochMilliseconds: number): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} {
  const parts = Object.fromEntries(
    MADRID_DATE_TIME_FORMATTER.formatToParts(new Date(epochMilliseconds)).map(({ type, value }) => [
      type,
      value,
    ]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

// The archive exposes Europe/Madrid wall time without an offset; reject gaps and overlaps.
function parseBandomovilWallClockDate(
  value: string,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  const wallTimeAsUtc = Date.UTC(year, month, day, hour, minute);
  const normalizedWallTime = new Date(wallTimeAsUtc);
  if (
    normalizedWallTime.getUTCFullYear() !== year ||
    normalizedWallTime.getUTCMonth() !== month ||
    normalizedWallTime.getUTCDate() !== day ||
    hour > 23 ||
    minute > 59
  ) {
    throw new Error(`Invalid Bandomovil date: ${value}`);
  }

  const possibleOffsets = new Set<number>();
  for (let hoursFromWallTime = -36; hoursFromWallTime <= 36; hoursFromWallTime += 6) {
    const sample = wallTimeAsUtc + hoursFromWallTime * 60 * 60 * 1000;
    const sampleParts = getMadridDateTimeParts(sample);
    const sampleLocalTimeAsUtc = Date.UTC(
      sampleParts.year,
      sampleParts.month - 1,
      sampleParts.day,
      sampleParts.hour,
      sampleParts.minute,
    );
    possibleOffsets.add(sampleLocalTimeAsUtc - sample);
  }

  const candidates = new Set<number>();
  for (const offset of possibleOffsets) {
    const candidate = wallTimeAsUtc - offset;
    const candidateParts = getMadridDateTimeParts(candidate);
    if (
      candidateParts.year === year &&
      candidateParts.month === month + 1 &&
      candidateParts.day === day &&
      candidateParts.hour === hour &&
      candidateParts.minute === minute
    ) {
      candidates.add(candidate);
    }
  }

  if (candidates.size === 0) {
    throw new Error(`Bandomovil date ${value} does not exist in Europe/Madrid.`);
  }
  if (candidates.size > 1) {
    throw new Error(`Bandomovil date ${value} is ambiguous in Europe/Madrid.`);
  }

  const candidate = candidates.values().next();
  if (candidate.done) throw new Error(`Could not resolve Bandomovil date ${value}.`);
  return new Date(candidate.value);
}

export function getBandomovilPublicationYear(value: string): number {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    throw new Error(`Invalid Bandomovil publication date: ${value}`);
  }
  return getMadridDateTimeParts(date.valueOf()).year;
}

export function parseBandomovilDate(value: string): Date {
  const match = value.trim().match(/^(\d{1,2})-([A-Za-zÁÉÍÓÚáéíóú]+)-(\d{4})\s+(\d{1,2}):(\d{2})$/);
  const day = match?.[1];
  const monthName = match?.[2];
  const year = match?.[3];
  const hour = match?.[4];
  const minute = match?.[5];
  const month = monthName ? MONTHS.get(monthName.toLocaleLowerCase('es-ES')) : undefined;

  if (
    day === undefined ||
    monthName === undefined ||
    year === undefined ||
    hour === undefined ||
    minute === undefined ||
    month === undefined
  ) {
    throw new Error(`Invalid Bandomovil date: ${value}`);
  }

  return parseBandomovilWallClockDate(
    value,
    Number(year),
    month,
    Number(day),
    Number(hour),
    Number(minute),
  );
}

export function extractAttachments(html: string): BandoAttachment[] {
  const attachments: BandoAttachment[] = [];
  const seenUrls = new Set();

  const addAttachment = (rawUrl: string, fallbackLabel: string, alt = ''): void => {
    const url = resolveAttachmentUrl(rawUrl);
    const type = url ? classifyAttachment(url) : undefined;
    if (!url || !type || seenUrls.has(url)) return;

    const label = attachmentLabel(url, fallbackLabel);
    attachments.push({
      type,
      url,
      label,
      ...(type === 'image' ? { alt: alt.trim() || label } : {}),
    });
    seenUrls.add(url);
  };

  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = match[0];
    if (tag === undefined) continue;
    addAttachment(
      readHTMLAttribute(tag, 'src'),
      readHTMLAttribute(tag, 'alt'),
      readHTMLAttribute(tag, 'alt'),
    );
  }

  for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const attributes = match[1] ?? '';
    const content = match[2] ?? '';
    addAttachment(readHTMLAttribute(attributes, 'href'), htmlToMarkdown(content));
  }

  return attachments;
}

function readHTMLAttribute(tag: string, attribute: string): string {
  return tag.match(new RegExp(`\\b${attribute}\\s*=\\s*["']([^"']+)["']`, 'i'))?.[1] ?? '';
}

function resolveAttachmentUrl(value: string): string {
  if (!value) return '';

  try {
    const url = new URL(value, ARCHIVE_ORIGIN);
    if (
      url.hostname !== new URL(ARCHIVE_ORIGIN).hostname ||
      !url.pathname.includes('/userFiles/')
    ) {
      return '';
    }
    return sanitizeHttpsUrl(url.href);
  } catch {
    return '';
  }
}

function classifyAttachment(url: string): AttachmentType | undefined {
  const pathname = new URL(url).pathname;
  if (IMAGE_EXTENSIONS.test(pathname)) return 'image';
  if (VIDEO_EXTENSIONS.test(pathname)) return 'video';
  if (DOCUMENT_EXTENSIONS.test(pathname)) return 'document';
  return undefined;
}

function attachmentLabel(url: string, fallbackLabel: string): string {
  const label = htmlToMarkdown(fallbackLabel).trim();
  if (label) return label;

  const filename = decodeURIComponent(new URL(url).pathname.split('/').pop() ?? '').trim();
  return filename || 'Archivo adjunto';
}

export function parseArchiveItems(html: string): ArchiveBandoItem[] {
  const itemPattern =
    /<li\b[\s\S]*?href="\/palomaresdelcampo\/(\d+)\/\d+"[\s\S]*?<h3[^>]*>([\s\S]*?)<\/h3>[\s\S]*?<div class="post-publication"[^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>[\s\S]*?<span class="badge"[^>]*>([\s\S]*?)<\/span>[\s\S]*?<div class="comunicadobody"[^>]*>([\s\S]*?)<\/div>/gi;

  return [...html.matchAll(itemPattern)].flatMap((match) => {
    const sourceId = match[1];
    const title = match[2];
    const date = match[3];
    const category = match[4];
    const description = match[5];
    if (
      sourceId === undefined ||
      title === undefined ||
      date === undefined ||
      category === undefined ||
      description === undefined
    ) {
      return [];
    }

    const link = `${ARCHIVE_ORIGIN}/palomaresdelcampo/${sourceId}/0`;
    return [
      {
        title: htmlToMarkdown(title),
        link,
        description: description.trim(),
        attachments: extractAttachments(description),
        category: htmlToMarkdown(category) || 'Info General',
        pubDate: parseBandomovilDate(htmlToMarkdown(date)).toISOString(),
        guid: link,
        sourceId,
      },
    ];
  });
}

export function extractXMLContent(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  if (!match) return '';

  const rawContent = match[1];
  if (rawContent === undefined) return '';
  let content = rawContent.trim();
  if (content.startsWith('<![CDATA[') && content.endsWith(']]>')) {
    content = content.slice(9, -3);
  }

  return decodeXmlEntities(content);
}

export function generateFilename(title: string, guid: string): string {
  const id = guid.match(/[?&]id=(\d+)/i)?.[1] ?? guid.match(/\/palomaresdelcampo\/(\d+)\//i)?.[1];
  const slug = slugify(title);
  return id ? `${id}-${slug}` : slug;
}

function serializeAttachments(attachments: BandoAttachment[] = []): string {
  if (attachments.length === 0) return 'attachments: []';

  return [
    'attachments:',
    ...attachments.flatMap((attachment) => [
      `  - type: '${escapeYaml(attachment.type)}'`,
      `    url: '${escapeYaml(attachment.url)}'`,
      `    label: '${escapeYaml(attachment.label)}'`,
      ...(attachment.alt ? [`    alt: '${escapeYaml(attachment.alt)}'`] : []),
    ]),
  ].join('\n');
}

export function createBandoMarkdown(item: BandoItem): string {
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
${serializeAttachments(item.attachments)}
---

${htmlToMarkdown(item.description)}
`;
}

export function cleanHTML(html: string): string {
  const text = htmlToMarkdown(html).replaceAll(/\s+/g, ' ').trim();
  return text.length > 180 ? `${text.slice(0, 180).trimEnd()}…` : text;
}

export function htmlToMarkdown(html: string): string {
  const content = sanitizeHtml(html ?? '', {
    allowedTags: ['br', 'p', 'strong', 'b', 'em', 'i'],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
    nonTextTags: [
      'script',
      'style',
      'textarea',
      'option',
      'iframe',
      'object',
      'embed',
      'svg',
      'math',
    ],
  })
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
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .trim();

  return content;
}

export function generateFrontmatter(item: BandoItem): string {
  const frontmatter = createBandoMarkdown(item).split('---\n').slice(1, 2)[0];
  if (frontmatter === undefined) throw new Error('Generated bando is missing its frontmatter.');
  return frontmatter;
}

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-|-$/g, '')
    .slice(0, 70)
    .replace(/-$/, '');
}

export function decodeXmlEntities(value: string): string {
  const namedEntities: Record<string, string> = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    nbsp: ' ',
    quot: '"',
  };

  return value.replaceAll(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match: string, entity: string) => {
    if (entity.startsWith('#x')) {
      return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
    }
    if (entity.startsWith('#')) {
      return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
    }
    return namedEntities[entity.toLowerCase()] ?? match;
  });
}

export function sanitizeHttpsUrl(value: string): string {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

export function escapeYaml(value: string): string {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll("'", "''")
    .replaceAll('\n', '\\n')
    .replaceAll('\r', '\\r');
}

const MAX_DETAIL_REDIRECTS = 5;

async function fetchText(url: string): Promise<string> {
  let currentUrl = new URL(url);
  assertOfficialBandomovilUrl(currentUrl);

  for (let redirects = 0; ; redirects += 1) {
    const response = await fetch(currentUrl.href, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      redirect: 'manual',
    });
    if (response.status >= 300 && response.status < 400) {
      if (redirects >= MAX_DETAIL_REDIRECTS) {
        await response.body?.cancel();
        throw new Error('Bandomovil request exceeded the redirect limit.');
      }
      const location = response.headers.get('location');
      if (!location) {
        await response.body?.cancel();
        throw new Error('Bandomovil redirect did not include a destination.');
      }
      await response.body?.cancel();
      const redirectUrl = new URL(location, currentUrl);
      assertOfficialBandomovilUrl(redirectUrl);
      currentUrl = redirectUrl;
      continue;
    }
    if (!response.ok) {
      throw new Error(`Bandomovil request failed with HTTP ${response.status}: ${currentUrl.href}`);
    }
    return response.text();
  }
}

export async function fetchBandomovilText(url: string): Promise<string> {
  return fetchText(url);
}

function assertOfficialBandomovilUrl(url: URL): void {
  const officialHost = new URL(ARCHIVE_ORIGIN).hostname;
  if (
    url.protocol !== 'https:' ||
    url.hostname !== officialHost ||
    (url.port !== '' && url.port !== '443') ||
    url.username !== '' ||
    url.password !== ''
  ) {
    throw new Error('Bandomovil URL or redirect escapes the official HTTPS host.');
  }
}

function parseArchivePageCount(html: string): number {
  const pages = [
    ...html.matchAll(/web\.php\?municipio=palomaresdelcampo(?:&amp;|&)pag=(\d+)/gi),
  ].flatMap((match) => {
    const page = match[1];
    return page === undefined ? [] : [Number(page)];
  });
  return Math.max(0, ...pages) + 1;
}

function deduplicateItems(items: ArchiveBandoItem[]): ArchiveBandoItem[] {
  return [...new Map(items.map((item) => [item.sourceId, item] as const)).values()];
}

async function mapWithConcurrency<Item, Result>(
  items: Item[],
  limit: number,
  callback: (item: Item) => Promise<Result>,
): Promise<Result[]> {
  const results: Result[] = [];
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      const item = items[index];
      if (item === undefined) throw new Error('Concurrency worker selected an invalid item index.');
      results[index] = await callback(item);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

async function fetchArchiveItems(): Promise<{ items: ArchiveBandoItem[]; pageCount: number }> {
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

async function fetchArchiveDetail(item: ArchiveBandoItem): Promise<ArchiveBandoItem> {
  const detailPage = await fetchText(item.link);
  const detail = parseArchiveItems(detailPage).find(
    (candidate) => candidate.sourceId === item.sourceId,
  );
  return detail ?? item;
}

async function fetchRSSItems(): Promise<ImportedBandoItem[]> {
  const xml = await fetchText(RSS_URL);
  const items = parseRSSItems(xml);

  if (items.length === 0) {
    throw new Error('The Bandomovil RSS did not contain any bandos');
  }

  return mapWithConcurrency(items, DETAIL_CONCURRENCY, async (item) => {
    const detailUrl = new URL(item.link);
    if (detailUrl.protocol !== 'https:' || detailUrl.hostname !== 'www.bandomovil.com') {
      throw new Error(`Unexpected Bandomovil detail URL: ${item.link}`);
    }
    const detailPage = await fetchText(detailUrl.href);
    return mergeRSSDetailAttachments(item, detailPage);
  });
}

export function getImportMode(value = process.env.BANDOS_IMPORT_MODE): ImportMode {
  return value === 'archive' ? 'archive' : 'rss';
}

export function mergeRSSDetailAttachments(
  item: ImportedBandoItem,
  detailPage: string,
): ImportedBandoItem {
  const attachments = [...item.attachments, ...extractAttachments(detailPage)];
  return {
    ...item,
    attachments: [
      ...new Map(attachments.map((attachment) => [attachment.url, attachment])).values(),
    ],
  };
}

async function loadImportItems(
  mode: ImportMode,
): Promise<{ items: ImportedBandoItem[]; pageCount: number }> {
  if (mode === 'archive') {
    const { items: archiveItems, pageCount } = await fetchArchiveItems();
    const inScope = archiveItems.filter((item) =>
      TARGET_YEARS.has(getBandomovilPublicationYear(item.pubDate)),
    );
    const items = await mapWithConcurrency(inScope, DETAIL_CONCURRENCY, fetchArchiveDetail);
    return { items, pageCount };
  }

  return { items: await fetchRSSItems(), pageCount: 0 };
}

export function mergeExistingAttachments<Item extends { attachments?: BandoAttachment[] }>(
  item: Item,
  previousMarkdown: string | undefined,
): Item {
  if (!previousMarkdown) return item;

  const previousAttachments = extractSerializedAttachments(previousMarkdown);
  if (previousAttachments.length === 0) return item;

  const attachments = [...(item.attachments ?? [])];
  const seenUrls = new Set(attachments.map((attachment) => attachment.url));
  for (const attachment of previousAttachments) {
    if (!seenUrls.has(attachment.url)) {
      attachments.push(attachment);
      seenUrls.add(attachment.url);
    }
  }

  return { ...item, attachments } as Item;
}

function extractSerializedAttachments(markdown: string): BandoAttachment[] {
  const attachments: BandoAttachment[] = [];
  const attachmentPattern =
    / {2}- type: '((?:''|[^'])*)'\n {4}url: '((?:''|[^'])*)'\n {4}label: '((?:''|[^'])*)'(?:\n {4}alt: '((?:''|[^'])*)')?/g;

  for (const match of markdown.matchAll(attachmentPattern)) {
    const type = match[1];
    const url = match[2];
    const label = match[3];
    const alt = match[4];
    if (type === undefined || url === undefined || label === undefined) continue;

    attachments.push({
      type: type.replaceAll("''", "'"),
      url: url.replaceAll("''", "'"),
      label: label.replaceAll("''", "'"),
      ...(alt ? { alt: alt.replaceAll("''", "'") } : {}),
    });
  }

  return attachments;
}

export async function fetchBandos({ mode = getImportMode() }: { mode?: string } = {}) {
  const importMode = getImportMode(mode);
  const { items, pageCount } = await loadImportItems(importMode);

  await fs.mkdir(contentDirectory, { recursive: true });
  let created = 0;
  let updated = 0;
  let removed = 0;
  const expectedFiles = new Set(
    items.map((item) => `${generateFilename(item.title, item.guid)}.md`),
  );

  for (const item of items) {
    const filePath = path.join(contentDirectory, `${generateFilename(item.title, item.guid)}.md`);
    let previous = '';
    try {
      previous = await fs.readFile(filePath, 'utf8');
    } catch (error: unknown) {
      if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') throw error;
    }

    const itemWithPreservedAttachments =
      importMode === 'rss' ? mergeExistingAttachments(item, previous) : item;
    const markdown = createBandoMarkdown(itemWithPreservedAttachments);
    if (previous === markdown) continue;
    await fs.writeFile(filePath, markdown, 'utf8');
    if (previous) updated += 1;
    else created += 1;
  }

  if (importMode === 'archive') {
    for (const entry of await fs.readdir(contentDirectory, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.md') || expectedFiles.has(entry.name)) continue;
      await fs.unlink(path.join(contentDirectory, entry.name));
      removed += 1;
    }
  }

  if (created || updated || removed) {
    await execFileAsync('pnpm', ['exec', 'prettier', '--write', 'src/content/bandos'], {
      cwd: projectRoot,
    });
  }

  return { created, updated, removed, total: items.length, pageCount, mode: importMode };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await fetchBandos();
    console.log(
      `Bandos importados en modo ${result.mode}: ${result.created} nuevos, ${result.updated} actualizados, ${result.removed} eliminados, ${result.total} procesados${result.pageCount ? ` en ${result.pageCount} páginas` : ''}.`,
    );
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
