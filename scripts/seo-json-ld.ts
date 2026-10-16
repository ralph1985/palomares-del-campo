const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isJsonLdType = (value: unknown): value is string | string[] =>
  typeof value === 'string' ||
  (Array.isArray(value) && value.every((entry: unknown) => typeof entry === 'string'));

export const validateJsonLdContent = (content: string): string[] => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return ['invalid JSON-LD'];
  }

  const entries: unknown[] = Array.isArray(parsed) ? parsed : [parsed];
  const failures: string[] = [];

  for (const entry of entries) {
    if (!isRecord(entry)) {
      failures.push('invalid JSON-LD');
      continue;
    }

    const type = entry['@type'];
    if (type !== undefined && !isJsonLdType(type)) {
      failures.push('invalid JSON-LD');
      continue;
    }

    const isArticle = type === 'Article' || (Array.isArray(type) && type.includes('Article'));
    if (!isArticle) continue;

    const author = entry.author;
    if (!isRecord(author) || (author['@type'] !== 'Person' && author['@type'] !== 'Organization')) {
      failures.push('Article author must be a Person or Organization node');
    }
    if (!isRecord(author) || typeof author.name !== 'string' || !author.name.trim()) {
      failures.push('Article author node has no name');
    }
  }

  return failures;
};
