type JsonLdRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonLdRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getAttribute = (tag: string, name: string): string | undefined => {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return match?.[1] ?? match?.[2] ?? match?.[3];
};

const getTags = (html: string, name: string): string[] => {
  const tags: string[] = [];
  for (const match of html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))) {
    tags.push(match[0]);
  }
  return tags;
};

const getMetaContents = (html: string, key: string, keyAttribute: 'name' | 'property'): string[] =>
  getTags(html, 'meta')
    .filter((tag) => getAttribute(tag, keyAttribute)?.toLowerCase() === key.toLowerCase())
    .map((tag) => getAttribute(tag, 'content'))
    .filter((content): content is string => content !== undefined);

const getCanonicalUrl = (html: string): string | undefined => {
  for (const tag of getTags(html, 'link')) {
    if (getAttribute(tag, 'rel')?.toLowerCase() === 'canonical') {
      return getAttribute(tag, 'href');
    }
  }
  return undefined;
};

const isUnknownArray = (value: unknown): value is unknown[] => Array.isArray(value);

const getJsonLdEntries = (html: string): unknown[] => {
  const entries: unknown[] = [];
  for (const match of html.matchAll(
    /<script\b(?=[^>]*type=["']application\/ld\+json["'])[^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    const content = match[1];
    if (content === undefined) continue;
    try {
      const parsed: unknown = JSON.parse(content);
      if (isUnknownArray(parsed)) {
        for (const entry of parsed) entries.push(entry);
      } else {
        entries.push(parsed);
      }
    } catch {
      // The repository-wide SEO validator reports invalid JSON-LD separately.
    }
  }
  return entries;
};

const hasType = (entry: unknown, expected: string): entry is JsonLdRecord => {
  if (!isRecord(entry)) return false;
  const type = entry['@type'];
  return type === expected || (Array.isArray(type) && type.includes(expected));
};

export const validateRouteSpecificSeo = (route: string, html: string): string[] => {
  const failures: string[] = [];
  const jsonLdEntries = getJsonLdEntries(html);

  if (route === '/') {
    if (!html.includes('<title>Palomares del Campo</title>')) {
      failures.push('homepage title must be Palomares del Campo');
    }
    if (getMetaContents(html, 'robots', 'name')[0]?.toLowerCase() !== 'index,follow') {
      failures.push('homepage must be indexable');
    }

    const canonical = getCanonicalUrl(html);
    const openGraphUrl = getMetaContents(html, 'og:url', 'property')[0];
    if (!canonical || openGraphUrl !== canonical) {
      failures.push('homepage Open Graph URL must match its canonical URL');
    }

    const website = jsonLdEntries.find((entry) => hasType(entry, 'WebSite'));
    const websiteUrl = isRecord(website) ? website.url : undefined;
    const expectedUrl = canonical?.replace(/\/$/, '');
    if (!website || typeof websiteUrl !== 'string' || websiteUrl !== expectedUrl) {
      failures.push('homepage is missing WebSite JSON-LD');
    }
  }

  if (route.startsWith('/noticias/') && route !== '/noticias/') {
    const openGraphType = getMetaContents(html, 'og:type', 'property')[0];
    if (openGraphType?.toLowerCase() !== 'article') {
      failures.push('news detail must declare og:type article');
    }

    const canonical = getCanonicalUrl(html);
    let canonicalPath: string | undefined;
    try {
      canonicalPath = canonical ? new URL(canonical).pathname : undefined;
    } catch {
      canonicalPath = undefined;
    }
    if (canonicalPath !== route) {
      failures.push('news detail canonical URL must match its route');
    }

    const publishedAt = getMetaContents(html, 'article:published_time', 'property')[0];
    if (!publishedAt || Number.isNaN(Date.parse(publishedAt))) {
      failures.push('news detail must have a valid article:published_time');
    }

    const article = jsonLdEntries.find((entry) => hasType(entry, 'Article'));
    if (!article) {
      failures.push('news detail is missing Article JSON-LD');
    } else if (typeof article.headline !== 'string' || !article.headline.trim()) {
      failures.push('news detail Article JSON-LD has no headline');
    }
    if (!jsonLdEntries.some((entry) => hasType(entry, 'BreadcrumbList'))) {
      failures.push('news detail is missing BreadcrumbList JSON-LD');
    }
  }

  if (route === '/sobre-el-pueblo/') {
    const images = getMetaContents(html, 'og:image', 'property');
    if (images.length === 0 || images.some((image) => !image.startsWith('https://'))) {
      failures.push('about page Open Graph image must use HTTPS');
    }
    const twitterCard = getMetaContents(html, 'twitter:card', 'name')[0];
    if (twitterCard !== 'summary_large_image') {
      failures.push('about page must use the summary_large_image Twitter card');
    }
  }

  return failures;
};
