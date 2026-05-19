import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  buildLegacyJobsToDisable,
  buildManagedJobs,
  CRON_JOB_CLASSIFICATION_TABLE,
} from '../../scripts/lib/cron-job-org-config.mjs';

describe('cron scheduling ownership', () => {
  it('keeps only the Vercel-owned launch jobs in vercel.json', () => {
    const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
    const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
    const vercelCrons = vercelConfig.crons || [];
    const expectedCrons = CRON_JOB_CLASSIFICATION_TABLE.filter(
      (job) => job.owner === 'Vercel Cron'
    ).map((job) => ({
      path: job.route,
      schedule: job.schedule.replace(' UTC', ''),
    }));

    const byPath = (a: { path: string }, b: { path: string }) => a.path.localeCompare(b.path);

    expect([...vercelCrons].sort(byPath)).toEqual([...expectedCrons].sort(byPath));
  });

  it('keeps only the intended external jobs enabled', () => {
    const jobs = buildManagedJobs('https://proofound.io', 'cron-secret');
    const urls = jobs.map((job) => job.url);
    const expectedUrls = CRON_JOB_CLASSIFICATION_TABLE.filter(
      (job) => job.externalSchedulerAction === 'enable'
    ).map((job) => `https://proofound.io${job.route}`);

    expect(urls).toEqual(expectedUrls);
    expect(urls).not.toContain('https://proofound.io/api/cron/sla-enforcement');
  });

  it('disables the legacy or duplicate external jobs', () => {
    const jobs = buildLegacyJobsToDisable('https://proofound.io');
    const urls = jobs.map((job) => job.url);
    const expectedUrls = CRON_JOB_CLASSIFICATION_TABLE.filter(
      (job) => job.externalSchedulerAction === 'disable'
    ).map((job) => `https://proofound.io${job.route}`);

    expect(urls).toEqual(expectedUrls);
    expect(urls).toContain('https://proofound.io/api/cron/weekly-digest');
    expect(urls).toContain('https://proofound.io/api/cron/fairness-note');
    expect(urls).toContain('https://proofound.io/api/cron/fairness-report');
    expect(urls).toContain('https://proofound.io/api/cron/python-internal-worker');
    expect(urls).toContain('https://proofound.io/api/cron/cv-import-temp-cleanup');
  });

  it('keeps the human cron table aligned to the canonical classification table', () => {
    const cronSetupPath = path.join(process.cwd(), 'docs/CRON_SETUP.md');
    const cronSetup = fs.readFileSync(cronSetupPath, 'utf8');
    const tableRows = new Map(
      cronSetup
        .split('\n')
        .filter((line) => line.trim().startsWith('| `/api/cron/'))
        .map((line) => {
          const cells = line
            .split('|')
            .slice(1, -1)
            .map((cell) => cell.trim().replace(/\\\*/g, '*'));
          return [cells[0], cells];
        })
    );

    for (const job of CRON_JOB_CLASSIFICATION_TABLE) {
      expect(tableRows.get(`\`${job.route}\``)).toEqual([
        `\`${job.route}\``,
        job.classification,
        job.owner,
        job.schedule,
        job.launchReason,
        job.testCoverage,
      ]);
    }
  });

  it('keeps cron setup documented as current active launch guidance', () => {
    const cronSetupPath = path.join(process.cwd(), 'docs/CRON_SETUP.md');
    const docsRegistryPath = path.join(process.cwd(), 'docs/DOCS_REGISTRY.md');
    const cronSetup = fs.readFileSync(cronSetupPath, 'utf8');
    const docsRegistry = fs.readFileSync(docsRegistryPath, 'utf8');

    expect(cronSetup).toContain('Doc Class: `active`');
    expect(cronSetup).toContain('Last Verified: `2026-05-19`');
    expect(cronSetup).toContain('npm run cron:sync');
    expect(cronSetup).toContain('/api/cron/health-check');
    expect(cronSetup).toContain('/api/cron/performance-check');
    expect(cronSetup).toContain('/api/cron/weekly-digest');
    expect(docsRegistry).toContain(
      '| `docs/CRON_SETUP.md`                                                                                    | `active`         | `docs`        | `repo+live`         | `2026-05-19`'
    );
  });
});
