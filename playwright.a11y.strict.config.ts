import { defineConfig, devices } from '@playwright/test';

const configuredPort = Number.parseInt(process.env.PLAYWRIGHT_PORT || '39123', 10);
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
const playwrightBaseURL = configuredBaseURL || `http://127.0.0.1:${webServerPort}`;
const configuredBaseURLIsExternal = Boolean(
  parsedBaseURL && !['localhost', '127.0.0.1', '::1'].includes(parsedBaseURL.hostname)
);
const playwrightServerMode = process.env.PLAYWRIGHT_SERVER_MODE?.trim().toLowerCase();
const strictEnvPrefix =
  'PII_HASH_SALT=${PII_HASH_SALT:-playwright-test-salt} NEXT_PUBLIC_USE_MOCK_SUPABASE=false ';
const webServerCommand =
  playwrightServerMode === 'prod'
    ? `${strictEnvPrefix}npm run start -- -p ${webServerPort}`
    : `${strictEnvPrefix}npm run dev -- -p ${webServerPort}`;

// Strict a11y contract config for MVP launch decisions.
// Runs against real runtime env and forbids mock Supabase mode.
export default defineConfig({
  testDir: './tests/a11y',
  testMatch: /.*\.strict\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['line']],
  use: {
    baseURL: playwrightBaseURL,
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
    command: webServerCommand,
    url: playwrightBaseURL,
    reuseExistingServer: configuredBaseURLIsExternal,
    timeout: 120000,
  },
});
