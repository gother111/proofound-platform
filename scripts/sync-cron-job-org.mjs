#!/usr/bin/env node

import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { config as loadDotenv, parse as parseDotenv } from 'dotenv';
import {
  buildLegacyJobsToDisable,
  buildManagedJobs,
} from './lib/cron-job-org-config.mjs';

loadDotenv({ path: '.env.local' });

const API_BASE_URL = 'https://api.cron-job.org';

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

export async function main() {
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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
