import { z, defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const attachment = z.object({
  type: z.enum(['image', 'document', 'video']),
  url: z.string().url(),
  label: z.string(),
  alt: z.string().optional(),
});

const noticias = defineCollection({
  loader: glob({
    pattern: '**/[^_]*.md',
    base: './src/content/noticias',
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    author: z.string().default('Redacción'),
    authorType: z.enum(['Person', 'Organization']).default('Organization'),
    date: z.coerce.date(),
    sourceName: z.string(),
    sourceUrl: z.string().url(),
    category: z.string().optional(),
    isFeatured: z.boolean().default(false),
  }),
});

const bandos = defineCollection({
  loader: glob({
    pattern: '**/[^_]*.md',
    base: './src/content/bandos',
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    author: z.string().default('Ayuntamiento de Palomares del Campo'),
    authorType: z.enum(['Person', 'Organization']).default('Organization'),
    date: z.coerce.date(),
    category: z.string().default('Info General'),
    sourceName: z.string(),
    sourceUrl: z.string().url(),
    sourceId: z.string(),
    attachments: z.array(attachment).default([]),
  }),
});

export const collections = {
  noticias,
  bandos,
};
