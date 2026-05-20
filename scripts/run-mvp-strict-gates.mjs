#!/usr/bin/env node

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const args = process.argv.slice(2);

function getArgValue(flag, defaultValue) {
  const index = args.indexOf(flag);
  if (index === -1 || index === args.length - 1) return defaultValue;
  return args[index + 1];
}

const envFile = getArgValue('--strict-env-file', process.env.STRICT_ENV_FILE || '.env.local');
const port = Number.parseInt(getArgValue('--port', process.env.STRICT_BASE_PORT || '40123'), 10);
const gateStartedAt = new Date();
const runId = gateStartedAt.toISOString().replace(/[:.]/g, '-');
const artifactRoot = getArgValue(
  '--artifact-dir',
  process.env.MVP_STRICT_GATE_ARTIFACT_DIR || path.join('.artifacts', 'mvp-strict-gates', runId)
);
const logDir = path.join(artifactRoot, 'logs');
const commandsPath = path.join(artifactRoot, 'commands.json');
const summaryPath = path.join(artifactRoot, 'summary.json');
const launchSmokeArtifactPath = path.join(artifactRoot, 'launch-smoke-report.json');

fs.mkdirSync(logDir, { recursive: true });

function loadEnvFileIfPresent(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return false;

  const contents = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;

    let value = rawValue.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }

  return true;
}

if (envFile && loadEnvFileIfPresent(envFile)) {
  console.log(`Loaded environment file: ${envFile}`);
} else if (envFile) {
  console.warn(`Environment file not found: ${envFile}. Continuing with process env.`);
}

const commandResults = [];
let appProcess = null;
let appResult = null;

const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;
const commandTimeouts = {
  'npm-ci': 12 * 60 * 1000,
  'prod-dependency-audit': 5 * 60 * 1000,
  'all-dependency-audit': 5 * 60 * 1000,
  'playwright-install': 12 * 60 * 1000,
  'docs-freshness': 5 * 60 * 1000,
  lint: 10 * 60 * 1000,
  typecheck: 15 * 60 * 1000,
  'migration-drift': 5 * 60 * 1000,
  'migration-audit': 5 * 60 * 1000,
  'unit-tests': 20 * 60 * 1000,
  'focused-api-tests': 12 * 60 * 1000,
  'privacy-tests': 15 * 60 * 1000,
  'privacy-extended-tests': 20 * 60 * 1000,
  'privacy-storage-tests': 10 * 60 * 1000,
  'deploy-readiness-strict': 3 * 60 * 1000,
  build: 25 * 60 * 1000,
  'landing-e2e': 15 * 60 * 1000,
  'auth-real-e2e': 15 * 60 * 1000,
  'a11y-strict': 15 * 60 * 1000,
  'strict-e2e-quality': 5 * 60 * 1000,
  'individual-strict-e2e': 20 * 60 * 1000,
  'org-strict-e2e': 25 * 60 * 1000,
  'privacy-strict-e2e': 20 * 60 * 1000,
  'providers-advisory-e2e': 20 * 60 * 1000,
  'launch-smoke': 25 * 60 * 1000,
  'start-app': 3 * 60 * 1000,
  'wait-for-health': 2 * 60 * 1000,
  'perf-budgets': 8 * 60 * 1000,
  'launch-synthetics': 10 * 60 * 1000,
  'launch-status': 5 * 60 * 1000,
  'go-no-go': 15 * 60 * 1000,
};

function commandName(name) {
  return process.platform === 'win32' ? `${name}.cmd` : name;
}

function redactOutput(value) {
  return String(value)
    .replace(/(Bearer\s+)[A-Za-z0-9._~+/-]+/gi, '$1[REDACTED]')
    .replace(/(CRON_SECRET=)[^\s]+/gi, '$1[REDACTED]');
}

function writeStatusFiles() {
  fs.mkdirSync(artifactRoot, { recursive: true });
  fs.writeFileSync(commandsPath, `${JSON.stringify(commandResults, null, 2)}\n`, 'utf8');
}

writeStatusFiles();

function createResult({ id, label, command, timeoutMs, logPath }) {
  return {
    id,
    label,
    command,
    timeoutMs,
    status: 'running',
    startedAt: new Date().toISOString(),
    finishedAt: null,
    durationMs: null,
    exitCode: null,
    signal: null,
    logPath,
  };
}

function finishResult(result, updates) {
  const finishedAt = new Date();
  result.finishedAt = finishedAt.toISOString();
  result.durationMs = finishedAt.getTime() - new Date(result.startedAt).getTime();
  Object.assign(result, updates);
  writeStatusFiles();
}

function recordSkippedGate({ id, label, reason, command = 'not run' }) {
  const logPath = path.join(
    logDir,
    `${String(commandResults.length + 1).padStart(2, '0')}-${id}.log`
  );
  const result = createResult({
    id,
    label,
    command,
    timeoutMs: 0,
    logPath,
  });
  commandResults.push(result);
  fs.writeFileSync(logPath, `${reason}\n`, 'utf8');
  finishResult(result, {
    status: 'skipped',
    exitCode: 0,
    reason,
  });
  console.log(`\n==> ${label}`);
  console.log(`Skipped: ${reason}`);
  return result;
}

function quoteCommand([command, ...commandArgs]) {
  return [command, ...commandArgs].join(' ');
}

function runGateCommand({
  id,
  label,
  command,
  commandArgs = [],
  env = commandEnv,
  timeoutMs = commandTimeouts[id] || DEFAULT_TIMEOUT_MS,
}) {
  return new Promise((resolve, reject) => {
    const logPath = path.join(
      logDir,
      `${String(commandResults.length + 1).padStart(2, '0')}-${id}.log`
    );
    const logStream = fs.createWriteStream(logPath, { flags: 'a' });
    const result = createResult({
      id,
      label,
      command: quoteCommand([command, ...commandArgs]),
      timeoutMs,
      logPath,
    });
    commandResults.push(result);
    writeStatusFiles();

    console.log(`\n==> ${label}`);
    console.log(`$ ${result.command}`);

    let timedOut = false;
    const child = spawn(commandName(command), commandArgs, {
      cwd: process.cwd(),
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: process.platform !== 'win32',
    });

    const timeout = setTimeout(() => {
      timedOut = true;
      const message = `\nCommand timed out after ${timeoutMs}ms: ${result.command}\n`;
      logStream.write(message);
      process.stderr.write(message);
      if (process.platform === 'win32') {
        child.kill('SIGTERM');
      } else {
        try {
          process.kill(-child.pid, 'SIGTERM');
        } catch {
          child.kill('SIGTERM');
        }
      }
      setTimeout(() => {
        if (!child.killed) {
          try {
            if (process.platform !== 'win32') process.kill(-child.pid, 'SIGKILL');
          } catch {
            child.kill('SIGKILL');
          }
        }
      }, 5000).unref();
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      const text = redactOutput(chunk);
      logStream.write(text);
      process.stdout.write(text);
    });

    child.stderr.on('data', (chunk) => {
      const text = redactOutput(chunk);
      logStream.write(text);
      process.stderr.write(text);
    });

    child.on('error', (error) => {
      clearTimeout(timeout);
      logStream.end();
      finishResult(result, {
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      });
      reject(error);
    });

    child.on('exit', (code, signal) => {
      clearTimeout(timeout);
      logStream.end();
      const status = timedOut ? 'timed_out' : code === 0 ? 'passed' : 'failed';
      finishResult(result, {
        status,
        exitCode: code,
        signal,
      });

      if (status === 'passed') {
        resolve(result);
      } else {
        const suffix =
          status === 'timed_out'
            ? `timed out after ${timeoutMs}ms`
            : `failed with exit code ${code ?? signal ?? 'unknown'}`;
        reject(new Error(`${label} ${suffix}. Log: ${logPath}`));
      }
    });
  });
}

function fail(message) {
  throw new Error(message);
}

function parseNodeVersion(version) {
  const [major, minor, patch] = String(version)
    .replace(/^v/, '')
    .split('.')
    .map((part) => Number.parseInt(part, 10));
  return { major, minor, patch };
}

function enforceRuntime() {
  const expectedNode = fs.readFileSync('.nvmrc', 'utf8').trim();
  const actual = parseNodeVersion(process.versions.node);
  if (`${actual.major}.${actual.minor}.${actual.patch}` !== expectedNode) {
    fail(
      `Strict MVP gates require Node ${expectedNode}; current runtime is ${process.version}. Run with the Node version from .nvmrc.`
    );
  }

  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (packageJson.packageManager !== 'npm@11.12.1') {
    fail(`Expected packageManager npm@11.12.1, found ${packageJson.packageManager || 'missing'}.`);
  }
}

const requiredEnv = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'DATABASE_URL',
  'CRON_SECRET',
];

const providerConnectedRequired =
  String(process.env.STRICT_PROVIDER_E2E_REQUIRE_CONNECTED ?? '')
    .trim()
    .toLowerCase() === 'true';

const providerRequiredEnv = providerConnectedRequired
  ? [
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'GOOGLE_REDIRECT_URI',
      'LINKEDIN_CLIENT_ID',
      'LINKEDIN_CLIENT_SECRET',
      'E2E_PROVIDER_USER_ID',
      'E2E_PROVIDER_USER_EMAIL',
      'E2E_PROVIDER_USER_PASSWORD',
    ]
  : [];

function enforceEnvironment() {
  const siteUrlPresent = Boolean(
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim()
  );
  const missing = [...requiredEnv, ...providerRequiredEnv].filter(
    (name) => !process.env[name]?.trim()
  );
  if (!siteUrlPresent) {
    missing.push('NEXT_PUBLIC_SITE_URL/SITE_URL');
  }

  const enabledMockModes = [
    'NEXT_PUBLIC_USE_MOCK_SUPABASE',
    'MOCK_ORG_MODE',
    'MOCK_ADMIN_MODE',
    'MOBILE_MOCK_AUTH',
  ].filter(
    (name) =>
      String(process.env[name] ?? '')
        .trim()
        .toLowerCase() === 'true'
  );

  if (enabledMockModes.length > 0) {
    fail(`Strict MVP gates refuse mock launch modes: ${enabledMockModes.join(', ')}`);
  }

  if (missing.length > 0) {
    fail(
      `Missing required strict release-gate environment variables: ${missing.join(', ')}. Connected provider credentials are required only when STRICT_PROVIDER_E2E_REQUIRE_CONNECTED=true.`
    );
  }
}

const commandEnv = {
  ...process.env,
  NEXT_PUBLIC_USE_MOCK_SUPABASE: 'false',
  MOCK_ORG_MODE: 'false',
  MOCK_ADMIN_MODE: 'false',
  MOBILE_MOCK_AUTH: 'false',
  FORCE_LINT: 'true',
  FORCE_STRICT_DEPLOY_CHECK: 'true',
  npm_config_engine_strict: 'true',
  PLAYWRIGHT_SERVER_MODE: process.env.PLAYWRIGHT_SERVER_MODE || 'prod',
  STRICT_PROVIDER_E2E_REQUIRE_CONNECTED: providerConnectedRequired ? 'true' : 'false',
  PII_HASH_SALT: process.env.PII_HASH_SALT || 'strict-local-salt',
  NODE_OPTIONS: process.env.NODE_OPTIONS || '--max-old-space-size=6144',
};

async function waitForHealthy(baseUrl, timeoutMs = commandTimeouts['wait-for-health']) {
  const result = createResult({
    id: 'wait-for-health',
    label: 'Wait for production app health',
    command: `GET ${baseUrl}/api/health`,
    timeoutMs,
    logPath: path.join(
      logDir,
      `${String(commandResults.length + 1).padStart(2, '0')}-wait-for-health.log`
    ),
  });
  commandResults.push(result);
  writeStatusFiles();

  const started = Date.now();
  const log = fs.createWriteStream(result.logPath, { flags: 'a' });
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/api/health`, { cache: 'no-store' });
      const text = await response.text();
      log.write(`${new Date().toISOString()} ${response.status} ${text}\n`);
      if (response.ok) {
        const payload = JSON.parse(text);
        if (payload?.status === 'ok') {
          log.end();
          finishResult(result, { status: 'passed', exitCode: 0 });
          return;
        }
      }
    } catch (error) {
      log.write(
        `${new Date().toISOString()} ${error instanceof Error ? error.message : String(error)}\n`
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  log.end();
  finishResult(result, { status: 'timed_out', exitCode: null });
  fail(`App did not return public health status ok within ${timeoutMs}ms`);
}

async function startApp(baseUrlPort) {
  const logPath = path.join(
    logDir,
    `${String(commandResults.length + 1).padStart(2, '0')}-start-app.log`
  );
  appResult = createResult({
    id: 'start-app',
    label: 'Start production app for launch gates',
    command: `npm run start -- -p ${baseUrlPort}`,
    timeoutMs: 0,
    logPath,
  });
  commandResults.push(appResult);
  writeStatusFiles();

  const logStream = fs.createWriteStream(logPath, { flags: 'a' });
  appProcess = spawn(commandName('npm'), ['run', 'start', '--', '-p', String(baseUrlPort)], {
    cwd: process.cwd(),
    env: commandEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: process.platform !== 'win32',
  });

  appProcess.stdout.on('data', (chunk) => {
    const text = redactOutput(chunk);
    logStream.write(text);
    process.stdout.write(text);
  });
  appProcess.stderr.on('data', (chunk) => {
    const text = redactOutput(chunk);
    logStream.write(text);
    process.stderr.write(text);
  });
  appProcess.on('exit', (code, signal) => {
    logStream.end();
    if (appResult?.status === 'running') {
      finishResult(appResult, {
        status: code === 0 ? 'passed' : 'failed',
        exitCode: code,
        signal,
      });
    }
  });
  appProcess.on('error', (error) => {
    logStream.end();
    if (appResult?.status === 'running') {
      finishResult(appResult, {
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 1500));
  if (appProcess.exitCode !== null) {
    fail(`Production app exited early. Log: ${logPath}`);
  }
}

function stopApp() {
  if (!appProcess || appProcess.killed) return;

  if (process.platform === 'win32') {
    appProcess.kill('SIGTERM');
  } else {
    try {
      process.kill(-appProcess.pid, 'SIGTERM');
    } catch {
      appProcess.kill('SIGTERM');
    }
  }

  if (appResult?.status === 'running') {
    finishResult(appResult, {
      status: 'passed',
      exitCode: 0,
      signal: 'SIGTERM',
    });
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
  console.log(`Gate artifacts: ${artifactRoot}`);

  try {
    enforceRuntime();
    enforceEnvironment();

    await runGateCommand({
      id: 'npm-ci',
      label: 'Clean install',
      command: 'npm',
      commandArgs: ['ci', '--ignore-scripts'],
    });
    await runGateCommand({
      id: 'prod-dependency-audit',
      label: 'Production dependency audit (threshold: high)',
      command: 'npm',
      commandArgs: ['run', 'audit:prod'],
    });
    await runGateCommand({
      id: 'all-dependency-audit',
      label: 'All-scope dependency audit (threshold: high)',
      command: 'npm',
      commandArgs: ['run', 'audit:all'],
    });
    await runGateCommand({
      id: 'playwright-install',
      label: 'Install Playwright Chromium',
      command: 'npx',
      commandArgs: ['playwright', 'install', '--with-deps', 'chromium'],
    });
    await runGateCommand({
      id: 'docs-freshness',
      label: 'Docs freshness',
      command: 'npm',
      commandArgs: ['run', 'docs:freshness'],
    });
    await runGateCommand({
      id: 'lint',
      label: 'Lint',
      command: 'npm',
      commandArgs: ['run', 'lint'],
    });
    await runGateCommand({
      id: 'typecheck',
      label: 'Typecheck',
      command: 'npm',
      commandArgs: ['run', 'typecheck'],
    });
    await runGateCommand({
      id: 'migration-drift',
      label: 'Migration drift check',
      command: 'npm',
      commandArgs: ['run', 'db:drift-check'],
    });
    await runGateCommand({
      id: 'migration-audit',
      label: 'Migration ledger audit',
      command: 'npm',
      commandArgs: ['run', 'db:audit:migrations'],
    });
    await runGateCommand({
      id: 'unit-tests',
      label: 'Unit tests',
      command: 'npm',
      commandArgs: ['run', 'test'],
    });
    await runGateCommand({
      id: 'focused-api-tests',
      label: 'Focused API tests',
      command: 'npm',
      commandArgs: ['run', 'test:api:focused'],
    });
    await runGateCommand({
      id: 'privacy-tests',
      label: 'Privacy tests',
      command: 'npm',
      commandArgs: ['run', 'test:privacy'],
    });
    await runGateCommand({
      id: 'privacy-extended-tests',
      label: 'Extended privacy tests',
      command: 'npm',
      commandArgs: ['run', 'test:privacy:extended'],
    });
    await runGateCommand({
      id: 'privacy-storage-tests',
      label: 'Storage privacy tests',
      command: 'npm',
      commandArgs: ['run', 'test:privacy:storage'],
    });
    await runGateCommand({
      id: 'deploy-readiness-strict',
      label: 'Strict deploy readiness env validation',
      command: 'npm',
      commandArgs: ['run', 'deploy:readiness:strict'],
    });
    await runGateCommand({
      id: 'build',
      label: 'Production build',
      command: 'npm',
      commandArgs: ['run', 'build'],
    });
    await runGateCommand({
      id: 'landing-e2e',
      label: 'Landing E2E',
      command: 'npm',
      commandArgs: ['run', 'test:e2e:landing'],
    });
    await runGateCommand({
      id: 'auth-real-e2e',
      label: 'Auth real E2E',
      command: 'npm',
      commandArgs: ['run', 'test:e2e:auth:real'],
    });
    await runGateCommand({
      id: 'a11y-strict',
      label: 'Strict accessibility E2E',
      command: 'npm',
      commandArgs: ['run', 'test:a11y:strict'],
    });
    await runGateCommand({
      id: 'strict-e2e-quality',
      label: 'Strict E2E quality guard',
      command: 'npm',
      commandArgs: ['run', 'test:strict:quality'],
    });
    await runGateCommand({
      id: 'individual-strict-e2e',
      label: 'Individual strict E2E',
      command: 'npm',
      commandArgs: ['run', 'test:e2e:individual:strict'],
    });
    await runGateCommand({
      id: 'org-strict-e2e',
      label: 'Organization strict E2E',
      command: 'npm',
      commandArgs: ['run', 'test:e2e:org:strict'],
    });
    await runGateCommand({
      id: 'privacy-strict-e2e',
      label: 'Privacy strict E2E',
      command: 'npm',
      commandArgs: ['run', 'test:e2e:privacy:strict'],
    });
    if (providerConnectedRequired) {
      await runGateCommand({
        id: 'providers-advisory-e2e',
        label: 'Providers advisory E2E',
        command: 'npm',
        commandArgs: ['run', 'test:e2e:providers:advisory'],
      });
    } else {
      recordSkippedGate({
        id: 'providers-advisory-e2e',
        label: 'Providers advisory E2E',
        command: 'npm run test:e2e:providers:advisory',
        reason:
          'Connected-provider scheduling is not part of the default locked MVP launch corridor. Set STRICT_PROVIDER_E2E_REQUIRE_CONNECTED=true only for targets that intentionally launch this provider path.',
      });
    }
    await runGateCommand({
      id: 'launch-smoke',
      label: 'Launch smoke',
      command: 'npm',
      commandArgs: [
        'run',
        'test:launch:smoke',
        '--',
        '--artifact',
        launchSmokeArtifactPath,
        '--base-url',
        baseUrl,
      ],
    });

    await startApp(port);
    await waitForHealthy(baseUrl);

    await runGateCommand({
      id: 'perf-budgets',
      label: 'Performance budgets',
      command: 'npm',
      commandArgs: ['run', 'perf:budgets'],
      env: { ...commandEnv, BASE_URL: baseUrl },
    });
    await runGateCommand({
      id: 'launch-synthetics',
      label: 'Launch synthetic monitors',
      command: 'npm',
      commandArgs: [
        'run',
        'monitor:launch',
        '--',
        '--artifact',
        launchSmokeArtifactPath,
        '--base-url',
        baseUrl,
      ],
      env: {
        ...commandEnv,
        BASE_URL: baseUrl,
        LAUNCH_SMOKE_ARTIFACT_PATH: launchSmokeArtifactPath,
      },
    });
    await runGateCommand({
      id: 'launch-status',
      label: 'Launch status',
      command: 'npm',
      commandArgs: ['run', 'launch:status'],
      env: {
        ...commandEnv,
        BASE_URL: baseUrl,
        LAUNCH_SMOKE_ARTIFACT_PATH: launchSmokeArtifactPath,
      },
    });
    await runGateCommand({
      id: 'go-no-go',
      label: 'Go/No-Go',
      command: 'npm',
      commandArgs: ['run', 'go:no-go'],
      env: {
        ...commandEnv,
        BASE_URL: baseUrl,
        LAUNCH_SMOKE_ARTIFACT_PATH: launchSmokeArtifactPath,
      },
    });

    const summary = {
      status: 'passed',
      startedAt: gateStartedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      artifactRoot,
      commandsPath,
      launchSmokeArtifactPath,
    };
    fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
    console.log('Strict MVP gates passed');
  } catch (error) {
    const summary = {
      status: 'failed',
      startedAt: gateStartedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      artifactRoot,
      commandsPath,
      error: error instanceof Error ? error.message : String(error),
    };
    fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
    throw error;
  } finally {
    stopApp();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  console.error(`Gate artifacts: ${artifactRoot}`);
  process.exit(1);
});
