import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  buildLegacyJobsToDisable,
  buildManagedJobs,
} from '../../scripts/lib/cron-job-org-config.mjs';

describe('cron scheduling ownership', () => {
  it('keeps only the core daily jobs in vercel.json', () => {
    const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
    const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
    const cronPaths = (vercelConfig.crons || []).map((entry: { path: string }) => entry.path);

    expect(cronPaths).toEqual([
      '/api/cron/refresh-matches',
      '/api/cron/refresh-matches-worker',
      '/api/cron/decision-reminders',
      '/api/cron/sla-enforcement',
    ]);
    expect(cronPaths).not.toContain('/api/cron/account-deletion-workflow');
  });

  it('keeps only the intended external jobs enabled', () => {
    const jobs = buildManagedJobs('https://proofound.io', 'cron-secret');
    const urls = jobs.map((job) => job.url);

    expect(urls).toEqual([
      'https://proofound.io/api/cron/health-check',
      'https://proofound.io/api/cron/performance-check',
    ]);
    expect(urls).not.toContain('https://proofound.io/api/cron/sla-enforcement');
  });

  it('disables the legacy or duplicate external jobs', () => {
    const jobs = buildLegacyJobsToDisable('https://proofound.io');
    const urls = jobs.map((job) => job.url);

    expect(urls).toEqual([
      'https://proofound.io/api/cron/account-deletion-workflow',
      'https://proofound.io/api/cron/python-internal-worker',
      'https://proofound.io/api/cron/cv-import-temp-cleanup',
      'https://proofound.io/api/cron/send-deletion-reminders',
      'https://proofound.io/api/cron/process-deletions',
      'https://proofound.io/api/cron/refresh-matches',
      'https://proofound.io/api/cron/weekly-digest',
      'https://proofound.io/api/cron/sla-enforcement',
    ]);
  });
});
