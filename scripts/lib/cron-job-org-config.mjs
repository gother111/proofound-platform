const GET_METHOD = 0;
const DEFAULT_TIMEOUT_SECONDS = 30;
const CRON_TIMEZONE = 'Europe/Stockholm';

export const CRON_JOB_CLASSIFICATION_TABLE = [
  {
    route: '/api/cron/decision-reminders',
    classification: 'active_launch_automation',
    owner: 'Vercel Cron',
    schedule: '0 10 * * * UTC',
    launchReason: 'Sends launch-critical decision reminders from the MVP workflow corridor.',
    testCoverage: 'tests/scripts/cron-scheduling.test.ts verifies the Vercel cron entry.',
    externalSchedulerAction: 'disable',
    title: 'Proofound - Decision Reminders',
  },
  {
    route: '/api/cron/refresh-matches',
    classification: 'active_launch_automation',
    owner: 'Vercel Cron',
    schedule: '0 3 * * * UTC',
    launchReason: 'Enqueues the daily MVP match refresh workload.',
    testCoverage: 'tests/scripts/cron-scheduling.test.ts verifies the Vercel cron entry.',
    externalSchedulerAction: 'disable',
    title: 'Proofound - Refresh Matches',
  },
  {
    route: '/api/cron/refresh-matches-worker',
    classification: 'active_launch_automation',
    owner: 'Vercel Cron',
    schedule: '15 3 * * * UTC',
    launchReason: 'Drains the MVP match refresh queue after enqueue.',
    testCoverage: 'tests/scripts/cron-scheduling.test.ts verifies the Vercel cron entry.',
    externalSchedulerAction: 'disable',
    title: 'Proofound - Refresh Matches Worker',
  },
  {
    route: '/api/cron/sla-enforcement',
    classification: 'active_launch_automation',
    owner: 'Vercel Cron',
    schedule: '0 8 * * * UTC',
    launchReason: 'Maintains launch-critical SLA state for the assignment-review workflow.',
    testCoverage: 'tests/scripts/cron-scheduling.test.ts verifies the Vercel cron entry.',
    externalSchedulerAction: 'disable',
    title: 'Proofound - SLA Enforcement',
  },
  {
    route: '/api/cron/health-check',
    classification: 'active_observability',
    owner: 'cron-job.org',
    schedule: 'Every 3 hours, Europe/Stockholm',
    launchReason: 'External health signal for launch monitoring.',
    testCoverage: 'tests/scripts/cron-scheduling.test.ts verifies the managed cron-job.org job.',
    externalSchedulerAction: 'enable',
    title: 'Proofound – Health Check',
  },
  {
    route: '/api/cron/performance-check',
    classification: 'active_observability',
    owner: 'cron-job.org',
    schedule: 'Daily at 06:00, Europe/Stockholm',
    launchReason: 'External performance signal for launch monitoring.',
    testCoverage: 'tests/scripts/cron-scheduling.test.ts verifies the managed cron-job.org job.',
    externalSchedulerAction: 'enable',
    title: 'Proofound – Performance Check',
  },
  {
    route: '/api/cron/launch-synthetic-checks',
    classification: 'manual_launch_ops',
    owner: 'Manual/internal launch ops',
    schedule: 'Not scheduled',
    launchReason: 'Available for explicit launch synthetic checks, not recurring infrastructure.',
    testCoverage: 'tests/api/launch-surface-inventory.test.ts covers internal-only launch surface.',
    externalSchedulerAction: 'disable',
    title: 'Proofound - Launch Synthetic Checks',
  },
  {
    route: '/api/cron/account-deletion-workflow',
    classification: 'archived_compatibility',
    owner: 'None',
    schedule: 'Not scheduled',
    launchReason: 'Archived compatibility route; not active launch infrastructure.',
    testCoverage: 'tests/api/launch-surface-inventory.test.ts covers archived route status.',
    externalSchedulerAction: 'disable',
    title: 'Proofound - Account Deletion Workflow',
  },
  {
    route: '/api/cron/send-deletion-reminders',
    classification: 'archived_compatibility',
    owner: 'None',
    schedule: 'Not scheduled',
    launchReason: 'Archived standalone deletion reminder route; not active launch infrastructure.',
    testCoverage: 'tests/api/launch-surface-inventory.test.ts covers archived route status.',
    externalSchedulerAction: 'disable',
    title: 'Proofound - Send Deletion Reminders',
  },
  {
    route: '/api/cron/process-deletions',
    classification: 'archived_compatibility',
    owner: 'None',
    schedule: 'Not scheduled',
    launchReason:
      'Archived standalone deletion processing route; not active launch infrastructure.',
    testCoverage: 'tests/api/launch-surface-inventory.test.ts covers archived route status.',
    externalSchedulerAction: 'disable',
    title: 'Proofound - Process Deletions',
  },
  {
    route: '/api/cron/python-internal-worker',
    classification: 'removed_non_mvp',
    owner: 'None',
    schedule: 'Not scheduled',
    launchReason: 'Removed from the locked MVP launch surface; not active launch infrastructure.',
    testCoverage: 'tests/api/launch-surface-inventory.test.ts covers archived route status.',
    externalSchedulerAction: 'disable',
    title: 'Proofound - Python Internal Worker',
  },
  {
    route: '/api/cron/cv-import-temp-cleanup',
    classification: 'removed_non_mvp',
    owner: 'None',
    schedule: 'Not scheduled',
    launchReason: 'CV import cleanup is outside the locked MVP launch surface.',
    testCoverage: 'tests/api/launch-surface-inventory.test.ts covers archived route status.',
    externalSchedulerAction: 'disable',
    title: 'Proofound - CV Import Temp Cleanup',
  },
  {
    route: '/api/cron/weekly-digest',
    classification: 'removed_non_mvp',
    owner: 'None',
    schedule: 'Not scheduled',
    launchReason:
      'Standalone weekly digest cron is disabled; digest delivery piggybacks on decision-reminders.',
    testCoverage:
      'tests/scripts/cron-scheduling.test.ts verifies cron-job.org disables it if present.',
    externalSchedulerAction: 'disable',
    title: 'Proofound - Weekly Digest',
  },
  {
    route: '/api/cron/fairness-note',
    classification: 'removed_non_mvp',
    owner: 'None',
    schedule: 'Not scheduled',
    launchReason: 'Fairness-note automation is archived outside the locked MVP launch surface.',
    testCoverage: 'src/lib/launch/surface-policy.ts classifies it as archived.',
    externalSchedulerAction: 'disable',
    title: 'Proofound - Fairness Note',
  },
  {
    route: '/api/cron/fairness-report',
    classification: 'removed_non_mvp',
    owner: 'None',
    schedule: 'Not scheduled',
    launchReason: 'Fairness-report automation is archived outside the locked MVP launch surface.',
    testCoverage: 'src/lib/launch/surface-policy.ts classifies it as archived.',
    externalSchedulerAction: 'disable',
    title: 'Proofound - Fairness Report',
  },
  {
    route: '/api/cron/generate-fairness-note',
    classification: 'removed_non_mvp',
    owner: 'None',
    schedule: 'Not scheduled',
    launchReason:
      'Legacy fairness-note generation is archived outside the locked MVP launch surface.',
    testCoverage: 'src/lib/launch/surface-policy.ts classifies it as archived.',
    externalSchedulerAction: 'disable',
    title: 'Proofound - Generate Fairness Note',
  },
];

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

export function buildManagedJobs(siteUrl, cronSecret) {
  return CRON_JOB_CLASSIFICATION_TABLE.filter(
    (job) => job.externalSchedulerAction === 'enable'
  ).map((job) => {
    if (job.route === '/api/cron/health-check') {
      return buildJob({
        title: job.title,
        url: `${siteUrl}${job.route}`,
        enabled: true,
        schedule: {
          hours: [0, 3, 6, 9, 12, 15, 18, 21],
          mdays: [-1],
          minutes: [0],
          months: [-1],
          wdays: [-1],
        },
        cronSecret,
      });
    }

    if (job.route === '/api/cron/performance-check') {
      return buildJob({
        title: job.title,
        url: `${siteUrl}${job.route}`,
        enabled: true,
        schedule: {
          hours: [6],
          mdays: [-1],
          minutes: [0],
          months: [-1],
          wdays: [-1],
        },
        cronSecret,
      });
    }

    throw new Error(`No cron-job.org schedule mapping for ${job.route}`);
  });
}

export function buildLegacyJobsToDisable(siteUrl) {
  return CRON_JOB_CLASSIFICATION_TABLE.filter(
    (job) => job.externalSchedulerAction === 'disable'
  ).map((job) => ({
    title: job.title,
    url: `${siteUrl}${job.route}`,
  }));
}
