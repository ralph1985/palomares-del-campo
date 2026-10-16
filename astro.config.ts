import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://palomaresdelcampo.conquense.dev',
  devToolbar: {
    enabled: process.env.DISABLE_ASTRO_DEV_TOOLBAR_FOR_E2E !== 'true',
  },
  integrations: [
    sitemap({
      filter: (page) => !page.endsWith('/avisos/'),
    }),
  ],
});
