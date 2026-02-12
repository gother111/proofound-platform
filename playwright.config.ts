import { defineConfig, devices } from '@playwright/test';

const PLAYWRIGHT_BASE_URL = process.env.BASE_URL || 'http://localhost:39123';

export default defineConfig({
  testDir: './e2e',
  // Use stable snapshot paths so visual baselines are explicit and reviewable.
  snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  // Avoid hanging locally on failures (HTML reporter can keep a server open).
  reporter: [['html', { open: 'never' }], ['line']],
  use: {
    baseURL: PLAYWRIGHT_BASE_URL,
    trace: 'on-first-retry',
    // Increase timeout for async flows like matching generation
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },
  // Global timeout for each test
  timeout: 120000, // 2 minutes per test (needed for complex flows)
  expect: {
    // Increase assertion timeout
    timeout: 10000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'PII_HASH_SALT=${PII_HASH_SALT:-playwright-test-salt} PORT=39123 npm run dev',
    url: PLAYWRIGHT_BASE_URL,
    reuseExistingServer: false,
    timeout: 120000, // Allow more time for server startup
  },
});
