import sitemap from '@astrojs/sitemap';
import { defineConfig, envField } from 'astro/config';

export default defineConfig({
  image: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.bandomovil.com',
        pathname: '/userFiles/**',
      },
      {
        protocol: 'https',
        hostname: 'palomaresdelcampo.dipucuenca.es',
        pathname: '/images/PALOMARES_DEL_CAMPO/**',
      },
    ],
  },
  env: {
    schema: {
      PUBLIC_PAGE_TRANSITIONS_ENABLED: envField.boolean({
        context: 'client',
        access: 'public',
        optional: true,
        default: false,
      }),
      PUBLIC_PALOMARENOS_ENABLED: envField.boolean({
        context: 'client',
        access: 'public',
        optional: true,
        default: false,
      }),
      PUBLIC_BALL_GAME_ENABLED: envField.boolean({
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
      filter: (page) =>
        !page.endsWith('/avisos/') &&
        (process.env.PUBLIC_BALL_GAME_ENABLED === 'true' || !page.endsWith('/juego/')),
    }),
  ],
});
