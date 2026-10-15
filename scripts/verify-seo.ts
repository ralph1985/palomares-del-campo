import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const failures: string[] = [];

async function walk(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(path)));
    } else {
      files.push(path);
    }
  }

  return files;
}

function count(text: string, pattern: RegExp): number {
  return [...text.matchAll(pattern)].length;
}

function firstMatch(text: string, pattern: RegExp, label: string): string {
  const match = text.match(pattern);
  if (!match) {
    failures.push(`Missing ${label}`);
    return '';
  }
  return match[1];
}

const htmlFiles = (await walk(root)).filter((path: string) => path.endsWith('.html'));
for (const path of htmlFiles) {
  const route = `/${relative(root, path)
    .replaceAll('\\', '/')
    .replace(/index\.html$/, '')}`;
  const html = await readFile(path, 'utf8');

  if (route === '/avisos/') {
    continue;
  }

  const requiredMetadata: Array<[string, RegExp]> = [
    ['title', /<title>/g],
    ['description', /<meta name="description"/g],
    ['robots', /<meta name="robots"/g],
    ['canonical', /<link rel="canonical"/g],
    ['Open Graph URL', /property="og:url"/g],
  ];
  for (const [label, pattern] of requiredMetadata) {
    if (count(html, pattern) !== 1) {
      failures.push(`${route}: expected exactly one ${label}`);
    }
  }

  if (!/<html lang="es">/.test(html)) {
    failures.push(`${route}: document language is not es`);
  }

  const canonical = firstMatch(html, /<link rel="canonical" href="([^"]+)"/, `${route} canonical`);
  if (canonical && !canonical.startsWith('https://palomaresdelcampo.conquense.dev/')) {
    failures.push(`${route}: canonical is not on the production domain`);
  }

  for (const image of html.matchAll(/property="og:image" content="([^"]+)"/g)) {
    if (!image[1].startsWith('https://')) {
      failures.push(`${route}: Open Graph image is not absolute`);
    }
  }

  for (const jsonLd of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) {
    try {
      const parsed = JSON.parse(jsonLd[1]!) as JsonLdItem | JsonLdItem[];
      const entries: JsonLdItem[] = Array.isArray(parsed) ? parsed : [parsed];
      for (const entry of entries) {
        if (entry['@type'] === 'Article') {
          const authorType = entry.author?.['@type'];
          if (!entry.author || (authorType !== 'Person' && authorType !== 'Organization')) {
            failures.push(`${route}: Article author must be a Person or Organization node`);
          }
          if (!entry.author?.name) {
            failures.push(`${route}: Article author node has no name`);
          }
        }
      }
    } catch {
      failures.push(`${route}: invalid JSON-LD`);
    }
  }
}

const sitemapIndex = await readFile(join(root, 'sitemap-index.xml'), 'utf8');
const childSitemaps = [...sitemapIndex.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) =>
  join(root, match[1]!.split('/').pop()!),
);
const sitemapUrls = [];
for (const sitemap of childSitemaps) {
  const content = await readFile(sitemap, 'utf8');
  sitemapUrls.push(...[...content.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]));
}

if (sitemapUrls.length === 0) {
  failures.push('Sitemap contains no URLs');
}
if (new Set(sitemapUrls).size !== sitemapUrls.length) {
  failures.push('Sitemap contains duplicate URLs');
}
if (sitemapUrls.some((url) => url.includes('/avisos/'))) {
  failures.push('Redirect route /avisos/ must not be in the sitemap');
}
if (sitemapUrls.some((url) => !url.startsWith('https://palomaresdelcampo.conquense.dev/'))) {
  failures.push('Sitemap contains a non-absolute or non-production URL');
}

const robots = await readFile(join(root, 'robots.txt'), 'utf8');
if (!robots.includes('Allow: /')) {
  failures.push('robots.txt does not allow public crawling');
}
if (!robots.includes('Sitemap: https://palomaresdelcampo.conquense.dev/sitemap-index.xml')) {
  failures.push('robots.txt does not reference sitemap-index.xml');
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(
  `SEO verification passed: ${htmlFiles.length - 1} indexable HTML pages and ${sitemapUrls.length} sitemap URLs.`,
);

type JsonLdItem = {
  '@type'?: string;
  author?: { '@type'?: string; name?: string };
};
