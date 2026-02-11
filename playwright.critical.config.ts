import { defineConfig, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';

for (const file of ['.env.test', '.env.local']) {
  const filePath = path.resolve(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    loadEnv({ path: filePath, override: false });
  }
}

export default defineConfig({
  testDir: './e2e/critical',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['line']],
  timeout: 120000,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: process.env.BASE_URL || 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
