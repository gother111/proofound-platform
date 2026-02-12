import { defineConfig, devices } from '@playwright/test';

const playwrightPort = Number.parseInt(process.env.PLAYWRIGHT_PORT || '33100', 10);
const baseURL = process.env.BASE_URL || `http://127.0.0.1:${playwrightPort}`;

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
    baseURL,
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
    command: `npm run dev -- -p ${playwrightPort}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // Allow more time for server startup
  },
});
