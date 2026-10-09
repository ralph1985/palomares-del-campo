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

export const collections = {
  noticias,
};
