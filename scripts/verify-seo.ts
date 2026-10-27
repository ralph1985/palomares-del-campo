import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateJsonLdContent } from './seo-json-ld';
import { isIndexableRobotsDirective, validateRouteSpecificSeo } from './seo-metadata';

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
  const value = match[1];
  if (value === undefined) {
    failures.push(`Malformed ${label}`);
    return '';
  }
  return value;
}

const htmlFiles = (await walk(root)).filter((path: string) => path.endsWith('.html'));
const indexableCanonicalUrls = new Set<string>();
for (const path of htmlFiles) {
  const route = `/${relative(root, path)
    .replaceAll('\\', '/')
    .replace(/index\.html$/, '')}`;
  const html = await readFile(path, 'utf8');

  if (route === '/avisos/') {
    continue;
  }

  for (const error of validateRouteSpecificSeo(route, html)) {
    failures.push(`${route}: ${error}`);
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
  const robotsDirective = firstMatch(
    html,
    /<meta name="robots" content="([^"]+)"/,
    `${route} robots directive`,
  );
  if (isIndexableRobotsDirective(robotsDirective) && canonical) {
    indexableCanonicalUrls.add(canonical);
  }

  for (const image of html.matchAll(/property="og:image" content="([^"]+)"/g)) {
    const imageUrl = image[1];
    if (imageUrl === undefined || !imageUrl.startsWith('https://')) {
      failures.push(`${route}: Open Graph image is not absolute`);
    }
  }

  for (const jsonLd of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) {
    const content = jsonLd[1];
    if (content === undefined) {
      failures.push(`${route}: invalid JSON-LD`);
      continue;
    }
    for (const error of validateJsonLdContent(content)) {
      failures.push(`${route}: ${error}`);
    }
  }
}

const sitemapIndex = await readFile(join(root, 'sitemap-index.xml'), 'utf8');
const childSitemaps: string[] = [];
for (const match of sitemapIndex.matchAll(/<loc>(.*?)<\/loc>/g)) {
  const location = match[1];
  const fileName = location?.split('/').at(-1);
  if (!fileName) {
    failures.push('Sitemap index contains an invalid location');
    continue;
  }
  childSitemaps.push(join(root, fileName));
}

const sitemapUrls: string[] = [];
for (const sitemap of childSitemaps) {
  const content = await readFile(sitemap, 'utf8');
  for (const match of content.matchAll(/<loc>(.*?)<\/loc>/g)) {
    const url = match[1];
    if (url === undefined) {
      failures.push('Sitemap contains an invalid URL');
      continue;
    }
    sitemapUrls.push(url);
  }
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
const sitemapUrlSet = new Set(sitemapUrls);
for (const canonical of indexableCanonicalUrls) {
  if (!sitemapUrlSet.has(canonical)) {
    failures.push(`Sitemap is missing indexable canonical URL ${canonical}`);
  }
}
for (const url of sitemapUrlSet) {
  if (!indexableCanonicalUrls.has(url)) {
    failures.push(`Sitemap includes a URL without an indexable HTML page: ${url}`);
  }
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
  `SEO verification passed: ${indexableCanonicalUrls.size} indexable HTML pages and ${sitemapUrls.length} sitemap URLs.`,
);
