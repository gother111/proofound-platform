#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { config as loadEnv } from 'dotenv';

import {
  LAUNCH_MONITOR_DEFINITIONS,
  REQUIRED_SAFE_MODE_FLAGS,
  normalizeLaunchBaseUrl,
} from '../src/lib/launch/contracts';
import {
  evaluateLaunchSmokeArtifact,
  validateLaunchSmokeArtifact,
} from '../src/lib/launch/smoke-artifact';
import { formatLaunchBlockingReasons } from '../src/lib/launch/status-report';
import { CLIENT_FEATURE_FLAG_RESPONSE_MAP } from '../src/lib/featureFlags';

loadEnv({ path: '.env.local', quiet: true });
loadEnv({ quiet: true });

const BASE_URL = normalizeLaunchBaseUrl(process.env.BASE_URL || 'http://localhost:3000');
const SKIP = process.env.SKIP_GO_NOGO === '1';
const ARTIFACT_PATH =
  process.env.LAUNCH_SMOKE_ARTIFACT_PATH || '.artifacts/launch-smoke-report.json';
const RUN_SMOKE_DIRECT = process.env.GO_NO_GO_DIRECT_SMOKE !== '0';
const RUN_SYNTHETICS = process.env.GO_NO_GO_RUN_SYNTHETICS !== '0';
const RESTORE_REPORT_PATH =
  process.env.LAUNCH_RESTORE_REPORT_PATH || '.artifacts/launch-restore-report.json';
const RESTORE_REPORT_MAX_AGE_HOURS = Number(
  process.env.LAUNCH_RESTORE_REPORT_MAX_AGE_HOURS || '72'
);

const requiredFiles = ['RLS_DEPLOYMENT_SUMMARY.md', 'ACCESSIBILITY_AUDIT_REPORT.md'];

function fail(message: string): never {
  console.error(`Go/No-Go check failed: ${message}`);
  process.exit(1);
}

function getCronSecret() {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (
    !cronSecret ||
    cronSecret.toLowerCase() === 'undefined' ||
    cronSecret.toLowerCase() === 'null'
  ) {
    fail('CRON_SECRET is required to query authenticated launch-ops endpoints');
  }
  return cronSecret;
}

function internalOpsHeaders() {
  return {
    authorization: `Bearer ${getCronSecret()}`,
  };
}

function command(name: string) {
  return process.platform === 'win32' ? `${name}.cmd` : name;
}

function isLocalLaunchBaseUrl() {
  try {
    const url = new URL(BASE_URL);
    return ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  } catch {
    return false;
  }
}

function readJsonFile(filePath: string) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(
      `could not read JSON evidence at ${filePath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

function checkFiles() {
  for (const file of requiredFiles) {
    const full = path.join(process.cwd(), file);
    if (!fs.existsSync(full)) {
      fail(`missing required evidence file: ${file}`);
    }
  }
}

function checkSafeModeFlags() {
  const routeFlags = new Set(Object.values(CLIENT_FEATURE_FLAG_RESPONSE_MAP));
  for (const flag of REQUIRED_SAFE_MODE_FLAGS) {
    if (!routeFlags.has(flag)) {
      fail(`feature flag route does not expose required safe-mode flag: ${flag}`);
    }
  }
}

function collectRouteFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const routes: string[] = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      routes.push(...collectRouteFiles(absolutePath));
      continue;
    }
    if (entry.isFile() && entry.name === 'route.ts') {
      routes.push(absolutePath);
    }
  }

  return routes;
}

function checkAiLaunchNoGoGuards() {
  for (const [key, value] of Object.entries(process.env)) {
    if (/^NEXT_PUBLIC_.*GEMINI.*KEY$/i.test(key) && value?.trim()) {
      fail(`client-exposed Gemini key is configured: ${key}`);
    }
  }

  if (process.env.AI_RAW_PROMPT_LOGGING_ENABLED?.trim().toLowerCase() === 'true') {
    fail('AI_RAW_PROMPT_LOGGING_ENABLED must be false for launch');
  }

  if (process.env.AI_ASSISTANTS_ENABLED?.trim().toLowerCase() === 'true') {
    const configuredCap = [
      process.env.AI_MONTHLY_HARD_CAP_SEK,
      process.env.AI_PROD_MONTHLY_HARD_CAP_SEK,
    ].some((value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed >= 0;
    });

    if (!configuredCap) {
      fail('AI assistants are enabled but no AI monthly hard cap is configured');
    }
  }

  const aiRouteRoot = path.join(process.cwd(), 'src/app/api/ai');
  const forbiddenRoutePattern =
    /\b(?:candidate[-_/]?score|candidate[-_/]?rank|scor(?:e|ing)|rank(?:ing)?)\b/i;
  for (const routeFile of collectRouteFiles(aiRouteRoot)) {
    const routePath = `/api/ai/${path
      .relative(aiRouteRoot, path.dirname(routeFile))
      .replace(/\\/g, '/')}`;
    if (forbiddenRoutePattern.test(routePath)) {
      fail(`forbidden AI scoring/ranking route found: ${routePath}`);
    }
  }
}

function runLaunchSmokeRunner(reason: string) {
  if (!RUN_SMOKE_DIRECT) {
    fail(reason);
  }

  console.log(`Running launch smoke runner because ${reason}.`);

  const run = spawnSync(
    command('npx'),
    ['tsx', 'scripts/launch-smoke-runner.ts', '--artifact', ARTIFACT_PATH, '--base-url', BASE_URL],
    {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: {
        ...process.env,
        BASE_URL,
      },
    }
  );

  if (run.status !== 0) {
    fail('launch smoke runner failed');
  }
}

function readLaunchSmokeArtifact() {
  return validateLaunchSmokeArtifact(JSON.parse(fs.readFileSync(ARTIFACT_PATH, 'utf8')));
}

function ensureLaunchSmokeArtifact() {
  if (!fs.existsSync(ARTIFACT_PATH)) {
    runLaunchSmokeRunner(`launch smoke artifact is missing at ${ARTIFACT_PATH}`);
  }

  let artifact = readLaunchSmokeArtifact();
  let evaluation = evaluateLaunchSmokeArtifact(artifact, { baseUrl: BASE_URL });

  if (evaluation.state !== 'fresh_passing') {
    runLaunchSmokeRunner(evaluation.message);
    artifact = readLaunchSmokeArtifact();
    evaluation = evaluateLaunchSmokeArtifact(artifact, { baseUrl: BASE_URL });
  }

  if (evaluation.state !== 'fresh_passing') {
    fail(evaluation.message);
  }
}

async function checkPerfStatus() {
  const response = await fetch(`${BASE_URL}/api/monitoring/perf-status`, {
    headers: internalOpsHeaders(),
  });
  if (!response.ok) {
    fail(`perf-status endpoint returned ${response.status}`);
  }
  const data = await response.json();
  if (!data.ok) {
    fail(`API latency budget not met: ${data.message || 'no message'}`);
  }
}

async function maybeRunSynthetics() {
  if (!RUN_SYNTHETICS) return;

  const response = await fetch(`${BASE_URL}/api/cron/launch-synthetic-checks`, {
    headers: internalOpsHeaders(),
  });

  if (!response.ok) {
    const text = await response.text();
    fail(`launch synthetic checks endpoint returned ${response.status}: ${text}`);
  }
}

async function checkLaunchStatus() {
  const response = await fetch(`${BASE_URL}/api/monitoring/launch-status`, {
    headers: internalOpsHeaders(),
  });
  if (!response.ok && response.status !== 503) {
    fail(`launch-status endpoint returned ${response.status}`);
  }

  const data = await response.json();
  if (!data.ok || data.readinessState !== 'ready') {
    const reasons = formatLaunchBlockingReasons(
      Array.isArray(data.notReadyReasons) ? data.notReadyReasons : []
    );

    fail(
      `launch-status is not ready (ok=${String(data.ok)}, readinessState=${String(data.readinessState)}, reasons=${reasons})`
    );
  }
  if (data.summary?.expectedMonitors !== LAUNCH_MONITOR_DEFINITIONS.length) {
    fail('launch-status endpoint did not report the full monitor contract');
  }
  if (data.summary?.missingMonitors > 0) {
    fail(`launch-status endpoint reports ${data.summary.missingMonitors} missing monitors`);
  }
  if (data.summary?.p1Failures > 0 || data.summary?.p2Failures > 0) {
    fail(
      `launch-status reports failing critical monitors (p1=${data.summary?.p1Failures}, p2=${data.summary?.p2Failures})`
    );
  }
  if (data.summary?.aiRawPromptLoggingEnabled === true) {
    fail('launch-status reports raw AI prompt logging enabled');
  }
  if (data.summary?.aiAssistantsEnabled === false) {
    console.log('AI assistants disabled; launch-status reports safe fallback mode.');
  } else {
    console.log(
      `AI assistants enabled; launch-status budget state: ${String(data.summary?.aiBudgetState)}`
    );
  }
}

function checkRestoreReadiness() {
  const checkpointScript = path.join(process.cwd(), 'scripts/db-backup-checkpoint.mjs');
  const restoreVerifyScript = path.join(process.cwd(), 'scripts/db-restore-verify.mjs');
  const restoreDrillDoc = path.join(process.cwd(), 'docs/launch-restore-drill.md');

  if (!fs.existsSync(checkpointScript)) {
    fail('restore readiness missing scripts/db-backup-checkpoint.mjs');
  }
  if (!fs.existsSync(restoreVerifyScript)) {
    fail('restore readiness missing scripts/db-restore-verify.mjs');
  }
  if (!fs.existsSync(restoreDrillDoc)) {
    fail('restore readiness missing docs/launch-restore-drill.md');
  }

  if (isLocalLaunchBaseUrl()) {
    console.log(
      'Local go/no-go target detected; restore tooling exists, but production-candidate launch still requires restore evidence.'
    );
    return;
  }

  if (!fs.existsSync(RESTORE_REPORT_PATH)) {
    fail(
      `production-candidate go/no-go requires a restore verification report at ${RESTORE_REPORT_PATH}. Run npm run db:restore:verify -- --checkpoint <dir> --out ${RESTORE_REPORT_PATH} against an isolated recovery target.`
    );
  }

  const report = readJsonFile(RESTORE_REPORT_PATH);
  if (report.ok !== true) {
    fail(`restore verification report is not passing: ${RESTORE_REPORT_PATH}`);
  }

  const generatedAt = new Date(String(report.generatedAt || ''));
  if (Number.isNaN(generatedAt.getTime())) {
    fail(
      `restore verification report is missing a valid generatedAt timestamp: ${RESTORE_REPORT_PATH}`
    );
  }

  const maxAgeMs = Number.isFinite(RESTORE_REPORT_MAX_AGE_HOURS)
    ? RESTORE_REPORT_MAX_AGE_HOURS * 60 * 60 * 1000
    : 72 * 60 * 60 * 1000;
  if (Date.now() - generatedAt.getTime() > maxAgeMs) {
    fail(
      `restore verification report is stale: ${RESTORE_REPORT_PATH}. Regenerate it for the intended production-candidate target.`
    );
  }

  const checkpointDir = String(report.checkpointDir || '');
  if (!checkpointDir) {
    fail(`restore verification report is missing checkpointDir: ${RESTORE_REPORT_PATH}`);
  }
  for (const fileName of ['summary.json', 'row-fingerprint.json']) {
    const evidencePath = path.join(checkpointDir, fileName);
    if (!fs.existsSync(evidencePath)) {
      fail(`restore verification report references missing checkpoint evidence: ${evidencePath}`);
    }
  }
}

async function main() {
  if (SKIP) {
    console.log('SKIP_GO_NOGO=1 set, skipping gate.');
    return;
  }

  console.log(`Running Go/No-Go gates against ${BASE_URL}`);
  checkFiles();
  checkSafeModeFlags();
  checkAiLaunchNoGoGuards();
  ensureLaunchSmokeArtifact();
  checkRestoreReadiness();
  await checkPerfStatus();
  await maybeRunSynthetics();
  await checkLaunchStatus();
  console.log('Go/No-Go gates passed');
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
