import { defineConfig, devices } from '@playwright/test';

const configuredPort = Number.parseInt(process.env.PLAYWRIGHT_PORT || '33100', 10);
const playwrightServerMode = process.env.PLAYWRIGHT_SERVER_MODE?.trim().toLowerCase();
const configuredBaseURL = process.env.BASE_URL?.trim();
const parsedBaseURL = (() => {
  if (!configuredBaseURL) {
    return null;
  }
  try {
    return new URL(configuredBaseURL);
  } catch {
    return null;
  }
})();
const baseURLPort = parsedBaseURL?.port ? Number.parseInt(parsedBaseURL.port, 10) : NaN;
const webServerPort = Number.isFinite(baseURLPort) ? baseURLPort : configuredPort;
const baseURL = configuredBaseURL || `http://127.0.0.1:${webServerPort}`;
const reuseExistingServer =
  !process.env.CI &&
  (Boolean(configuredBaseURL) || process.env.PLAYWRIGHT_REUSE_EXISTING_SERVER === '1');
const webServerCommand =
  playwrightServerMode === 'prod'
    ? `npm run start -- -p ${webServerPort}`
    : `PROOFOUND_NEXT_DEV_CLEAN=1 NEXT_DISABLE_WEBPACK_CACHE=1 npm run dev -- -p ${webServerPort}`;

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
    command: webServerCommand,
    url: baseURL,
    reuseExistingServer,
    timeout: 240000, // CI startup can exceed 120s on cold runners
  },
});
