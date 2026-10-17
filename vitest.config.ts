import { defineConfig } from 'vitest/config';

export default defineConfig({
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
