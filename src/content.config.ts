import { z, defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const noticias = defineCollection({
  loader: glob({
    pattern: '**/[^_]*.md',
    base: './src/content/noticias',
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    author: z.string().default('Redacción'),
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
    date: z.coerce.date(),
    category: z.string().default('Info General'),
    sourceName: z.string(),
    sourceUrl: z.string().url(),
    sourceId: z.string(),
  }),
});

export const collections = {
  noticias,
  bandos,
};
