import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  processDecisionReminders: vi.fn(),
  checkPerformanceHealth: vi.fn(),
  sendPerformanceAlert: vi.fn(),
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
    mocks.processDecisionReminders.mockResolvedValue({ processed: 2, sent: 1 });
    mocks.checkPerformanceHealth.mockResolvedValue({
      healthy: true,
      breaches: [],
      metrics: { apiLatencyP95: 720 },
    });
    mocks.sendPerformanceAlert.mockResolvedValue(undefined);
  });

  afterEach(() => {
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
    expect(mocks.processDecisionReminders).toHaveBeenCalledTimes(1);
    expect(mocks.checkPerformanceHealth).toHaveBeenCalledTimes(1);
    expect(mocks.sendPerformanceAlert).not.toHaveBeenCalled();
  });
});
