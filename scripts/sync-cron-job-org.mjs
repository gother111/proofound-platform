#!/usr/bin/env node

import fs from 'node:fs';
import { config as loadDotenv, parse as parseDotenv } from 'dotenv';

loadDotenv({ path: '.env.local' });

const API_BASE_URL = 'https://api.cron-job.org';
const GET_METHOD = 0;
const DEFAULT_TIMEOUT_SECONDS = 30;
const CRON_TIMEZONE = 'Europe/Stockholm';

function readEnvFile() {
  if (!fs.existsSync('.env.local')) {
    return {};
  }
  return parseDotenv(fs.readFileSync('.env.local'));
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return '';
}

function getRequiredConfig() {
  const envFile = readEnvFile();
  const apiKey = firstNonEmpty(process.env.CRON_API_KEY, envFile.CRON_API_KEY);
  const cronSecret = firstNonEmpty(process.env.CRON_SECRET, envFile.CRON_SECRET);
  const siteUrl = firstNonEmpty(
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    envFile.NEXT_PUBLIC_SITE_URL,
    envFile.SITE_URL
  ).replace(/\/$/, '');

  if (!apiKey) {
    throw new Error('CRON_API_KEY is required.');
  }

  if (!cronSecret) {
    throw new Error('CRON_SECRET is required.');
  }

  if (!siteUrl) {
    throw new Error('NEXT_PUBLIC_SITE_URL or SITE_URL is required.');
  }

  return { apiKey, cronSecret, siteUrl };
}

async function apiFetch(path, init, apiKey) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
      ...(init?.headers || {}),
    },
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(`cron-job.org API ${response.status}: ${JSON.stringify(payload)}`);
  }

  return payload;
}

function withAuthHeader(cronSecret) {
  return {
    headers: {
      Authorization: `Bearer ${cronSecret}`,
    },
  };
}

function buildJob({
  title,
  url,
  enabled,
  schedule,
  requestTimeout = DEFAULT_TIMEOUT_SECONDS,
  saveResponses = true,
  includeAuthHeader = true,
  cronSecret,
}) {
  return {
    title,
    enabled,
    saveResponses,
    url,
    requestMethod: GET_METHOD,
    requestTimeout,
    redirectSuccess: false,
    schedule: {
      timezone: CRON_TIMEZONE,
      expiresAt: 0,
      ...schedule,
    },
    notification: {
      onFailure: true,
      onFailureCount: 1,
      onSuccess: false,
      onDisable: true,
    },
    ...(includeAuthHeader ? { extendedData: withAuthHeader(cronSecret) } : {}),
  };
}

function buildManagedJobs(siteUrl, cronSecret) {
  return [
    buildJob({
      title: 'Proofound - Python Internal Worker',
      url: `${siteUrl}/api/cron/python-internal-worker`,
      enabled: true,
      requestTimeout: 300,
      schedule: {
        hours: [-1],
        mdays: [-1],
        minutes: [0, 15, 30, 45],
        months: [-1],
        wdays: [-1],
      },
      cronSecret,
    }),
    buildJob({
      title: 'Proofound – Fairness Note Refresh',
      url: `${siteUrl}/api/cron/fairness-note`,
      enabled: true,
      schedule: {
        hours: [2],
        mdays: [-1],
        minutes: [0],
        months: [-1],
        wdays: [-1],
      },
      cronSecret,
    }),
    buildJob({
      title: 'Proofound – Health Check',
      url: `${siteUrl}/api/cron/health-check`,
      enabled: true,
      includeAuthHeader: false,
      schedule: {
        hours: [0, 3, 6, 9, 12, 15, 18, 21],
        mdays: [-1],
        minutes: [0],
        months: [-1],
        wdays: [-1],
      },
      cronSecret,
    }),
    buildJob({
      title: 'Proofound – Performance Check',
      url: `${siteUrl}/api/cron/performance-check`,
      enabled: true,
      schedule: {
        hours: [6],
        mdays: [-1],
        minutes: [0],
        months: [-1],
        wdays: [-1],
      },
      cronSecret,
    }),
    buildJob({
      title: 'Proofound - SLA Enforcement',
      url: `${siteUrl}/api/cron/sla-enforcement`,
      enabled: true,
      schedule: {
        hours: [8],
        mdays: [-1],
        minutes: [0],
        months: [-1],
        wdays: [-1],
      },
      cronSecret,
    }),
    buildJob({
      title: 'Proofound – Fairness Report',
      url: `${siteUrl}/api/cron/fairness-report`,
      enabled: false,
      schedule: {
        hours: [3],
        mdays: [-1],
        minutes: [30],
        months: [-1],
        wdays: [-1],
      },
      cronSecret,
    }),
  ];
}

function buildLegacyJobsToDisable(siteUrl) {
  return [
    {
      title: 'Proofound - Send Deletion Reminders',
      url: `${siteUrl}/api/cron/send-deletion-reminders`,
    },
    {
      title: 'Proofound - Process Deletions',
      url: `${siteUrl}/api/cron/process-deletions`,
    },
    {
      title: 'Proofound - Refresh Matches',
      url: `${siteUrl}/api/cron/refresh-matches`,
    },
  ];
}

async function main() {
  const { apiKey, cronSecret, siteUrl } = getRequiredConfig();
  const managedJobs = buildManagedJobs(siteUrl, cronSecret);
  const legacyJobs = buildLegacyJobsToDisable(siteUrl);

  const current = await apiFetch('/jobs', { method: 'GET' }, apiKey);
  const existingJobs = current.jobs || [];
  const results = [];

  for (const desiredJob of managedJobs) {
    const existing = existingJobs.find((job) => job.url === desiredJob.url);

    if (!existing) {
      const created = await apiFetch(
        '/jobs',
        {
          method: 'PUT',
          body: JSON.stringify({ job: desiredJob }),
        },
        apiKey
      );

      results.push({
        action: 'created',
        jobId: created.jobId,
        title: desiredJob.title,
        enabled: desiredJob.enabled,
      });
      continue;
    }

    if (existing.enabled !== desiredJob.enabled) {
      await apiFetch(
        `/jobs/${existing.jobId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ job: { enabled: desiredJob.enabled } }),
        },
        apiKey
      );

      results.push({
        action: 'toggled',
        jobId: existing.jobId,
        title: desiredJob.title,
        enabled: desiredJob.enabled,
      });
      continue;
    }

    results.push({
      action: 'unchanged',
      jobId: existing.jobId,
      title: desiredJob.title,
      enabled: existing.enabled,
    });
  }

  for (const legacyJob of legacyJobs) {
    const existing = existingJobs.find((job) => job.url === legacyJob.url);
    if (!existing || !existing.enabled) {
      results.push({
        action: existing ? 'already_disabled' : 'missing',
        jobId: existing?.jobId ?? null,
        title: legacyJob.title,
        enabled: false,
      });
      continue;
    }

    await apiFetch(
      `/jobs/${existing.jobId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ job: { enabled: false } }),
      },
      apiKey
    );

    results.push({
      action: 'disabled_legacy_overlap',
      jobId: existing.jobId,
      title: legacyJob.title,
      enabled: false,
    });
  }

  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
