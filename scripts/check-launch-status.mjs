#!/usr/bin/env node

import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local', quiet: true });
loadEnv({ quiet: true });

function fail(message) {
  console.error(`Launch status check failed: ${message}`);
  process.exit(1);
}

function normalizeInternalSecret(value) {
  const secret = value?.trim();
  if (!secret || secret.toLowerCase() === 'undefined' || secret.toLowerCase() === 'null') {
    return null;
  }
  return secret;
}

function getInternalLaunchSecret() {
  const value =
    normalizeInternalSecret(process.env.INTERNAL_API_SECRET) ??
    normalizeInternalSecret(process.env.CRON_SECRET);
  if (!value || value.toLowerCase() === 'undefined' || value.toLowerCase() === 'null') {
    fail('INTERNAL_API_SECRET or CRON_SECRET is required');
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

function trustedLaunchOrigins() {
  return [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    process.env.LAUNCH_TRUSTED_BASE_URLS,
  ]
    .flatMap((value) => (value ? value.split(',') : []))
    .flatMap((value) => {
      try {
        return [normalizeBaseUrl(value.trim())];
      } catch {
        return [];
      }
    });
}

function assertBaseUrlMayReceiveInternalSecret(value) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    fail('BASE_URL must be an absolute URL before internal launch secrets are sent');
  }

  const host = parsed.hostname.toLowerCase();
  const isLocal = ['localhost', '127.0.0.1', '::1'].includes(host);
  const trustedOrigins = trustedLaunchOrigins();

  if (isLocal || trustedOrigins.includes(value)) {
    return;
  }

  fail(
    'Refusing to send internal launch secrets to untrusted BASE_URL. Add the exact origin to LAUNCH_TRUSTED_BASE_URLS for approved launch checks.'
  );
}

assertBaseUrlMayReceiveInternalSecret(baseUrl);

const response = await fetch(`${baseUrl}/api/monitoring/launch-status`, {
  headers: {
    authorization: `Bearer ${getInternalLaunchSecret()}`,
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
