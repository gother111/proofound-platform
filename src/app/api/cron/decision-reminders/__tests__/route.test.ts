import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  processDecisionReminders: vi.fn(),
  checkPerformanceHealth: vi.fn(),
  sendPerformanceAlert: vi.fn(),
  processWeeklyDigests: vi.fn(),
  getWeeklyDigestAvailability: vi.fn(),
  processWorkflowAsyncJobs: vi.fn(),
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('@/lib/decisions/automation', () => ({
  processDecisionReminders: mocks.processDecisionReminders,
}));

vi.mock('@/lib/analytics/health-check', () => ({
  checkPerformanceHealth: mocks.checkPerformanceHealth,
  sendPerformanceAlert: mocks.sendPerformanceAlert,
}));

vi.mock('@/lib/notifications/weekly-digest', () => ({
  processWeeklyDigests: mocks.processWeeklyDigests,
  getWeeklyDigestAvailability: mocks.getWeeklyDigestAvailability,
}));

vi.mock('@/lib/workflow/processor', () => ({
  processWorkflowAsyncJobs: mocks.processWorkflowAsyncJobs,
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: mocks.logInfo,
    warn: mocks.logWarn,
    error: mocks.logError,
  },
}));

import { GET } from '../route';

describe('/api/cron/decision-reminders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('ENABLE_WEEKLY_DIGEST', 'false');
    mocks.processDecisionReminders.mockResolvedValue({ processed: 2, sent: 1 });
    mocks.checkPerformanceHealth.mockResolvedValue({
      healthy: true,
      breaches: [],
      metrics: { apiLatencyP95: 720 },
    });
    mocks.sendPerformanceAlert.mockResolvedValue(undefined);
    mocks.processWeeklyDigests.mockResolvedValue({
      processed: 3,
      emailed: 3,
      createdInApp: 3,
      skipped: 0,
      errors: [],
    });
    mocks.getWeeklyDigestAvailability.mockReturnValue({
      enabled: false,
      reason: 'Weekly digest delivery is disabled unless ENABLE_WEEKLY_DIGEST=true',
    });
    mocks.processWorkflowAsyncJobs.mockResolvedValue({ processed: 0 });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('returns 500 when internal cron secret is not configured', async () => {
    vi.stubEnv('INTERNAL_API_SECRET', '');
    vi.stubEnv('CRON_SECRET', '');

    const response = await GET(
      new Request('https://example.com/api/cron/decision-reminders') as any
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('CRON_SECRET is missing. Refusing to run cron job.');
    expect(mocks.processDecisionReminders).not.toHaveBeenCalled();
  });

  it('returns 401 when bearer token does not match configured secret', async () => {
    vi.stubEnv('CRON_SECRET', 'top-secret');
    vi.stubEnv('INTERNAL_API_SECRET', '');

    const response = await GET(
      new Request('https://example.com/api/cron/decision-reminders', {
        headers: { authorization: 'Bearer wrong-secret' },
      }) as any
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
    expect(mocks.processDecisionReminders).not.toHaveBeenCalled();
  });

  it('runs reminders and health check when bearer token is valid', async () => {
    vi.stubEnv('CRON_SECRET', 'top-secret');
    vi.stubEnv('INTERNAL_API_SECRET', '');

    const response = await GET(
      new Request('https://example.com/api/cron/decision-reminders', {
        headers: { authorization: 'Bearer top-secret' },
      }) as any
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.decisionReminders).toEqual({ processed: 2, sent: 1 });
    expect(body.performanceHealthCheck.status).toBe('healthy');
    expect(body.weeklyDigest).toEqual({
      status: 'skipped',
      reason: 'Weekly digest delivery is disabled unless ENABLE_WEEKLY_DIGEST=true',
    });
    expect(mocks.processDecisionReminders).toHaveBeenCalledTimes(1);
    expect(mocks.checkPerformanceHealth).toHaveBeenCalledTimes(1);
    expect(mocks.processWorkflowAsyncJobs).toHaveBeenCalledTimes(1);
    expect(mocks.processWeeklyDigests).not.toHaveBeenCalled();
    expect(mocks.sendPerformanceAlert).not.toHaveBeenCalled();
  }, 15000);

  it('skips weekly digest when env is unset', async () => {
    vi.unstubAllEnvs();
    vi.stubEnv('CRON_SECRET', 'top-secret');
    vi.stubEnv('INTERNAL_API_SECRET', '');
    mocks.getWeeklyDigestAvailability.mockReturnValue({
      enabled: false,
      reason: 'Weekly digest delivery is disabled unless ENABLE_WEEKLY_DIGEST=true',
    });

    const response = await GET(
      new Request('https://example.com/api/cron/decision-reminders', {
        headers: { authorization: 'Bearer top-secret' },
      }) as any
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.weeklyDigest).toEqual({
      status: 'skipped',
      reason: 'Weekly digest delivery is disabled unless ENABLE_WEEKLY_DIGEST=true',
    });
    expect(mocks.processWeeklyDigests).not.toHaveBeenCalled();
  });

  it('runs weekly digest on Monday only when explicitly enabled', async () => {
    vi.stubEnv('CRON_SECRET', 'top-secret');
    vi.stubEnv('INTERNAL_API_SECRET', '');
    vi.stubEnv('ENABLE_WEEKLY_DIGEST', 'true');
    mocks.getWeeklyDigestAvailability.mockReturnValue({
      enabled: true,
      reason: null,
    });
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-23T10:00:00.000Z'));

    const response = await GET(
      new Request('https://example.com/api/cron/decision-reminders', {
        headers: { authorization: 'Bearer top-secret' },
      }) as any
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.processWeeklyDigests).toHaveBeenCalledWith(false);
    expect(body.weeklyDigest).toEqual({
      status: 'success',
      processed: 3,
      emailed: 3,
      createdInApp: 3,
      skipped: 0,
      errors: 0,
    });
  });
});
