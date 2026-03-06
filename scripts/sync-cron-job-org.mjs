#!/usr/bin/env node

import fs from 'node:fs';
import { config as loadDotenv, parse as parseDotenv } from 'dotenv';

loadDotenv({ path: '.env.local' });

const API_BASE_URL = 'https://api.cron-job.org';
const GET_METHOD = 0;

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

function buildPythonInternalWorkerJob(siteUrl, cronSecret) {
  return {
    title: 'Proofound - Python Internal Worker',
    enabled: true,
    saveResponses: true,
    url: `${siteUrl}/api/cron/python-internal-worker`,
    requestMethod: GET_METHOD,
    requestTimeout: 300,
    redirectSuccess: false,
    schedule: {
      timezone: 'Europe/Stockholm',
      expiresAt: 0,
      hours: [-1],
      mdays: [-1],
      minutes: [0, 15, 30, 45],
      months: [-1],
      wdays: [-1],
    },
    notification: {
      onFailure: true,
      onFailureCount: 1,
      onSuccess: false,
      onDisable: true,
    },
    extendedData: {
      headers: {
        Authorization: `Bearer ${cronSecret}`,
      },
    },
  };
}

async function main() {
  const { apiKey, cronSecret, siteUrl } = getRequiredConfig();
  const desiredJob = buildPythonInternalWorkerJob(siteUrl, cronSecret);

  const current = await apiFetch('/jobs', { method: 'GET' }, apiKey);
  const existing = (current.jobs || []).find((job) => job.url === desiredJob.url);

  if (existing) {
    await apiFetch(`/jobs/${existing.jobId}`, {
      method: 'PATCH',
      body: JSON.stringify({ job: desiredJob }),
    }, apiKey);
    console.log(
      JSON.stringify(
        {
          status: 'updated',
          jobId: existing.jobId,
          title: desiredJob.title,
          url: desiredJob.url,
          minutes: desiredJob.schedule.minutes,
        },
        null,
        2
      )
    );
    return;
  }

  const created = await apiFetch('/jobs', {
    method: 'PUT',
    body: JSON.stringify({ job: desiredJob }),
  }, apiKey);

  console.log(
    JSON.stringify(
      {
        status: 'created',
        jobId: created.jobId,
        title: desiredJob.title,
        url: desiredJob.url,
        minutes: desiredJob.schedule.minutes,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
