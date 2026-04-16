const GET_METHOD = 0;
const DEFAULT_TIMEOUT_SECONDS = 30;
const CRON_TIMEZONE = 'Europe/Stockholm';

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
  return [
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
  ];
}

export function buildLegacyJobsToDisable(siteUrl) {
  return [
    {
      title: 'Proofound - Account Deletion Workflow',
      url: `${siteUrl}/api/cron/account-deletion-workflow`,
    },
    {
      title: 'Proofound - Python Internal Worker',
      url: `${siteUrl}/api/cron/python-internal-worker`,
    },
    {
      title: 'Proofound - CV Import Temp Cleanup',
      url: `${siteUrl}/api/cron/cv-import-temp-cleanup`,
    },
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
    {
      title: 'Proofound - Weekly Digest',
      url: `${siteUrl}/api/cron/weekly-digest`,
    },
    {
      title: 'Proofound - SLA Enforcement',
      url: `${siteUrl}/api/cron/sla-enforcement`,
    },
  ];
}
