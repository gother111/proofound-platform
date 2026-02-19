import { defineConfig, devices } from '@playwright/test';

const playwrightPort = Number.parseInt(process.env.PLAYWRIGHT_PORT || '33101', 10);
const playwrightServerMode = process.env.PLAYWRIGHT_SERVER_MODE?.trim().toLowerCase();
const baseURL = process.env.BASE_URL || `http://127.0.0.1:${playwrightPort}`;
const webServerCommand =
  playwrightServerMode === 'prod'
    ? `NEXT_PUBLIC_USE_MOCK_SUPABASE=true npm run start -- -p ${playwrightPort}`
    : `NEXT_PUBLIC_USE_MOCK_SUPABASE=true npm run dev -- -p ${playwrightPort}`;

// Separate config for accessibility tests.
// Keeps CI stable by running against a mock Supabase environment for public pages.
export default defineConfig({
  testDir: './tests/a11y',
  testIgnore: /.*\.strict\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  // Avoid hanging locally on failures (HTML reporter can keep a server open).
  reporter: [['html', { open: 'never' }], ['line']],
  use: {
    baseURL,
    trace: 'on-first-retry',
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },
  timeout: 120000,
  expect: { timeout: 10000 },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // Avoid requiring real Supabase credentials for a11y tests.
    command: webServerCommand,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
