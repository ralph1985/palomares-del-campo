import sitemap from '@astrojs/sitemap';
import { defineConfig, envField } from 'astro/config';

export default defineConfig({
  env: {
    schema: {
      PUBLIC_PAGE_TRANSITIONS_ENABLED: envField.boolean({
        context: 'client',
        access: 'public',
        optional: true,
        default: false,
      }),
    },
  },
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
