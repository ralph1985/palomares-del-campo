/// <reference types="vitest/config" />

import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      include: [
        'src/game/**/*.ts',
        'src/scripts/convex-game.ts',
        'src/scripts/palomarenos-map-data.ts',
        'src/components/SEO.astro',
        'src/components/game/GamePrivacyNotice.astro',
        'src/components/current-affairs/CurrentAffairsEmptyState.astro',
        'src/components/accommodations/AccommodationCard.astro',
        'src/components/about/HeritageCard.astro',
        'src/components/ui/ActionLink.astro',
        'src/components/ui/ExternalLink.astro',
        'src/components/ui/Button.astro',
        'src/components/ui/CollectionCardMeta.astro',
        'src/components/BandoCard.astro',
        'src/components/NewsCard.astro',
        'src/components/CollectionArchive.astro',
        'src/layouts/BaseLayout.astro',
        'convex/**/*.ts',
      ],
      exclude: ['convex/_generated/**', 'convex/schema.ts', '**/*.d.ts'],
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
