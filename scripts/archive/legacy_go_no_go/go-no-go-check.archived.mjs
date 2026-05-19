/**
 * Archived Go / No-Go Gate Script
 *
 * This file is historical context only. The active launch gate is:
 *   npm run go:no-go
 *
 * which runs scripts/go-no-go-check.ts.
 */

import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SKIP = process.env.SKIP_GO_NOGO === '1';

const requiredFiles = ['RLS_DEPLOYMENT_SUMMARY.md', 'ACCESSIBILITY_AUDIT_REPORT.md'];

function fail(message) {
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

async function checkPerfStatus() {
  const res = await fetch(`${BASE_URL}/api/monitoring/perf-status`, {
    headers: {
      authorization: `Bearer ${getCronSecret()}`,
    },
  });
  if (!res.ok) {
    fail(`perf-status endpoint returned ${res.status}`);
  }
  const data = await res.json();
  if (!data.ok) {
    fail(`API latency budget not met: ${data.message || 'no message'}`);
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

function checkSUSFlag() {
  if (process.env.SUS_STUDY_COMPLETE !== 'true') {
    fail('SUS_STUDY_COMPLETE env not set to true');
  }
}

async function main() {
  if (SKIP) {
    console.log('SKIP_GO_NOGO=1 set, skipping gate.');
    return;
  }

  console.log(`Running Go/No-Go gates against ${BASE_URL}`);
  checkFiles();
  checkSUSFlag();
  await checkPerfStatus();
  console.log('Go/No-Go gates passed');
}

main().catch((err) => fail(err.message || String(err)));
