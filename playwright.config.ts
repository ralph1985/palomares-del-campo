import { defineConfig, devices } from '@playwright/test';
import { findAvailablePort } from './scripts/find-available-port';

const suppliedBaseURL = process.env.PLAYWRIGHT_BASE_URL;
let localPort: number | undefined;
if (!suppliedBaseURL) {
  const configuredPort = process.env.PLAYWRIGHT_LOCAL_TEST_PORT;
  const selectedPort = configuredPort ? Number(configuredPort) : await findAvailablePort();
  if (!Number.isInteger(selectedPort) || selectedPort < 1 || selectedPort > 65535) {
    throw new Error(`Invalid Playwright local port: ${configuredPort ?? selectedPort}.`);
  }
  localPort = selectedPort;
  process.env.PLAYWRIGHT_LOCAL_TEST_PORT = String(selectedPort);
}
const baseURL = suppliedBaseURL ?? `http://127.0.0.1:${localPort}`;
const pageTransitionsEnabled = process.env.PUBLIC_PAGE_TRANSITIONS_ENABLED ?? 'true';
process.env.PUBLIC_PAGE_TRANSITIONS_ENABLED = pageTransitionsEnabled;
const palomarenosEnabled = process.env.PUBLIC_PALOMARENOS_ENABLED ?? 'true';
process.env.PUBLIC_PALOMARENOS_ENABLED = palomarenosEnabled;
const ballGameEnabled = process.env.PUBLIC_BALL_GAME_ENABLED ?? 'true';
process.env.PUBLIC_BALL_GAME_ENABLED = ballGameEnabled;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  ...(process.env.CI ? { workers: 1 } : {}),
  reporter: 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  ...(localPort === undefined
    ? {}
    : {
        webServer: {
          command: `pnpm exec astro dev --host 127.0.0.1 --port ${localPort} --strictPort`,
          url: baseURL,
          reuseExistingServer: false,
          timeout: 120_000,
          env: {
            ...process.env,
            CONVEX_URL: '',
            DISABLE_ASTRO_DEV_TOOLBAR_FOR_E2E: 'true',
            PUBLIC_E2E_TEST_MODE: 'true',
            PUBLIC_PAGE_TRANSITIONS_ENABLED: pageTransitionsEnabled,
            PUBLIC_PALOMARENOS_ENABLED: palomarenosEnabled,
            PUBLIC_BALL_GAME_ENABLED: ballGameEnabled,
            PUBLIC_TURNSTILE_SITE_KEY: 'e2e-test-site-key',
          },
        },
      }),
});
