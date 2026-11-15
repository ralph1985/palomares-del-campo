import sitemap from '@astrojs/sitemap';
import { rm } from 'node:fs/promises';
import type { AstroIntegration } from 'astro';
import { defineConfig, envField } from 'astro/config';

const removeDisabledFeaturePages: AstroIntegration = {
  name: 'remove-disabled-feature-pages',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      const disabledRoutes = [
        ...(process.env.PUBLIC_BALL_GAME_ENABLED === 'true' ? [] : ['juego/']),
        ...(process.env.PUBLIC_PALOMARENOS_ENABLED === 'true' ? [] : ['palomarenos-por-el-mundo/']),
      ];

      await Promise.all(
        disabledRoutes.map((route) => rm(new URL(route, dir), { recursive: true, force: true })),
      );
    },
  },
};

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
        (process.env.PUBLIC_BALL_GAME_ENABLED === 'true' || !page.endsWith('/juego/')) &&
        (process.env.PUBLIC_PALOMARENOS_ENABLED === 'true' ||
          !page.endsWith('/palomarenos-por-el-mundo/')),
    }),
    removeDisabledFeaturePages,
  ],
});
