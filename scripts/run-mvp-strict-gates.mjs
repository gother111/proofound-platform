#!/usr/bin/env node

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { config as loadEnvFile } from 'dotenv';

const args = process.argv.slice(2);

function getArgValue(flag, defaultValue) {
  const index = args.indexOf(flag);
  if (index === -1 || index === args.length - 1) return defaultValue;
  return args[index + 1];
}

const envFile = getArgValue('--env-file', process.env.STRICT_ENV_FILE || '.env.local');
const port = Number.parseInt(
  getArgValue('--port', process.env.STRICT_BASE_PORT || '40123'),
  10
);

if (envFile && fs.existsSync(envFile)) {
  loadEnvFile({ path: envFile, override: false });
  console.log(`Loaded environment file: ${envFile}`);
} else if (envFile) {
  console.warn(`Environment file not found: ${envFile}. Continuing with process env.`);
}

const requiredEnv = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'DATABASE_URL',
  'NEXT_PUBLIC_SITE_URL',
  'ZOOM_CLIENT_ID',
  'ZOOM_CLIENT_SECRET',
  'ZOOM_REDIRECT_URI',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REDIRECT_URI',
  'LINKEDIN_CLIENT_ID',
  'LINKEDIN_CLIENT_SECRET',
  'E2E_PROVIDER_USER_ID',
  'E2E_PROVIDER_USER_EMAIL',
  'E2E_PROVIDER_USER_PASSWORD',
];

const mockMode = process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === 'true';
if (mockMode) {
  console.error(
    'Strict MVP gate runner refused to start because NEXT_PUBLIC_USE_MOCK_SUPABASE=true.'
  );
  process.exit(1);
}

const missing = requiredEnv.filter((name) => !process.env[name]?.trim());
if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const commandEnv = {
  ...process.env,
  NEXT_PUBLIC_USE_MOCK_SUPABASE: 'false',
  MOCK_ORG_MODE: 'false',
  STRICT_PROVIDER_E2E_REQUIRE_CONNECTED:
    process.env.STRICT_PROVIDER_E2E_REQUIRE_CONNECTED || 'true',
  STRICT_PROVIDER_E2E_REQUIRE_BOTH: process.env.STRICT_PROVIDER_E2E_REQUIRE_BOTH || 'true',
  PII_HASH_SALT: process.env.PII_HASH_SALT || 'strict-local-salt',
  NODE_OPTIONS: process.env.NODE_OPTIONS || '--max-old-space-size=6144',
};

let appProcess = null;

function run(command, commandArgs, env = commandEnv) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      env,
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${commandArgs.join(' ')} failed with exit code ${code}`));
      }
    });
  });
}

async function waitForHealthy(baseUrl, timeoutMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/api/health`, { cache: 'no-store' });
      if (response.ok) {
        const payload = await response.json();
        if (payload?.status === 'ok') {
          return;
        }
      }
    } catch {
      // keep retrying until timeout
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error(`App did not return public health status ok within ${timeoutMs}ms`);
}

function startApp(baseUrlPort) {
  return new Promise((resolve, reject) => {
    appProcess = spawn('npm', ['run', 'start', '--', '-p', String(baseUrlPort)], {
      env: commandEnv,
      stdio: 'inherit',
    });

    appProcess.on('error', reject);
    setTimeout(resolve, 1500);
  });
}

function stopApp() {
  if (appProcess && !appProcess.killed) {
    appProcess.kill('SIGTERM');
  }
}

process.on('SIGINT', () => {
  stopApp();
  process.exit(130);
});

process.on('SIGTERM', () => {
  stopApp();
  process.exit(143);
});

async function main() {
  const baseUrl = `http://localhost:${port}`;
  console.log(`Running strict MVP gates against ${baseUrl}`);

  try {
    await run('npm', ['run', 'lint']);
    await run('npm', ['run', 'typecheck']);
    await run('npm', ['run', 'test']);
    await run('npm', ['run', 'build']);

    await run('npm', ['run', 'test:e2e:landing']);
    await run('npm', ['run', 'test:e2e:auth:real']);
    await run('npm', ['run', 'test:a11y:strict']);
    await run('npm', ['run', 'test:strict:quality']);
    await run('npm', ['run', 'test:e2e:individual:strict']);
    await run('npm', ['run', 'test:e2e:org:strict']);
    await run('npm', ['run', 'test:e2e:privacy:strict']);
    await run('npm', ['run', 'test:e2e:providers:strict']);

    await run('npm', ['run', 'build']);

    await startApp(port);
    await waitForHealthy(baseUrl);

    await run('npm', ['run', 'perf:budgets'], { ...commandEnv, BASE_URL: baseUrl });
    await run('npm', ['run', 'go:no-go'], {
      ...commandEnv,
      BASE_URL: baseUrl,
      SUS_STUDY_COMPLETE: 'true',
    });

    console.log('Strict MVP gates passed');
  } finally {
    stopApp();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
