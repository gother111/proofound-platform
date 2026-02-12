import { defineConfig, devices } from '@playwright/test';

const PLAYWRIGHT_BASE_URL = process.env.BASE_URL || 'http://localhost:39123';

// Strict a11y contract config for MVP launch decisions.
// Runs against real runtime env and forbids mock Supabase mode.
export default defineConfig({
  testDir: './tests/a11y',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['line']],
  use: {
    baseURL: PLAYWRIGHT_BASE_URL,
    trace: 'on-first-retry',
    actionTimeout: 30000,
    navigationTimeout: 30000,
    reducedMotion: 'reduce',
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
    command:
      'PII_HASH_SALT=${PII_HASH_SALT:-playwright-test-salt} PORT=39123 NEXT_PUBLIC_USE_MOCK_SUPABASE=false npm run dev',
    url: PLAYWRIGHT_BASE_URL,
    reuseExistingServer: false,
    timeout: 120000,
  },
});
