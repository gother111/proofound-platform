#!/usr/bin/env node

import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local', quiet: true });
loadEnv({ quiet: true });

function fail(message) {
  console.error(`Launch status check failed: ${message}`);
  process.exit(1);
}

function getCronSecret() {
  const value = process.env.CRON_SECRET?.trim();
  if (!value || value.toLowerCase() === 'undefined' || value.toLowerCase() === 'null') {
    fail('CRON_SECRET is required');
  }
  return value;
}

function normalizeBaseUrl(value) {
  try {
    const parsed = new URL(value);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return value.trim().replace(/\/+$/, '');
  }
}

const baseUrl = normalizeBaseUrl(process.env.BASE_URL || 'http://localhost:3000');
const response = await fetch(`${baseUrl}/api/monitoring/launch-status`, {
  headers: {
    authorization: `Bearer ${getCronSecret()}`,
  },
});

if (!response.ok) {
  const text = await response.text();
  fail(`endpoint returned ${response.status}: ${text}`);
}

const payload = await response.json();
if (!payload.ok || payload.readinessState !== 'ready') {
  const reasons = Array.isArray(payload.notReadyReasons)
    ? payload.notReadyReasons.map((reason) => reason.code || reason.message).join(', ')
    : 'none';
  fail(
    `readinessState=${String(payload.readinessState)}, ok=${String(payload.ok)}, reasons=${reasons}`
  );
}

if (payload.summary?.missingMonitors > 0) {
  fail(`missing monitor evidence: ${payload.summary.missingMonitors}`);
}

if (payload.summary?.p1Failures > 0 || payload.summary?.p2Failures > 0) {
  fail(
    `critical monitor failures: p1=${payload.summary?.p1Failures}, p2=${payload.summary?.p2Failures}`
  );
}

console.log('Launch status is ready.');
