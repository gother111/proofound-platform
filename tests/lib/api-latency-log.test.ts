import { beforeEach, describe, expect, it, vi } from 'vitest';

import { logAPILatency } from '@/lib/monitoring/api-latency';
import { emitAnalyticsEventAsync } from '@/lib/analytics/events';
import { log } from '@/lib/log';

vi.mock('@/lib/analytics/events', () => ({
  emitAnalyticsEventAsync: vi.fn(),
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: vi.fn(),
  },
}));

describe('logAPILatency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('emits canonical api_latency event with duration_ms payload', async () => {
    await logAPILatency({
      path: '/api/test',
      method: 'POST',
      duration: 321,
      status: 200,
      requestId: 'req-123',
    });

    expect(emitAnalyticsEventAsync).toHaveBeenCalledTimes(1);
    expect(emitAnalyticsEventAsync).toHaveBeenCalledWith({
      eventType: 'api_latency',
      entityType: 'api',
      entityId: '/api/test',
      properties: {
        path: '/api/test',
        method: 'POST',
        duration_ms: 321,
        duration: 321,
        status: 200,
        request_id: 'req-123',
        meets_target: true,
      },
    });
  });

  it('flags events above the target as not meeting SLA', async () => {
    await logAPILatency({
      path: '/api/slow',
      method: 'GET',
      duration: 2500,
      status: 503,
      requestId: 'req-999',
    });

    const event = (emitAnalyticsEventAsync as any).mock.calls[0][0];
    expect(event.properties.meets_target).toBe(false);
    expect(event.properties.duration_ms).toBe(2500);
  });

  it('logs analytics failures without breaking the request path', async () => {
    vi.mocked(emitAnalyticsEventAsync).mockImplementationOnce(() => {
      throw new Error('analytics unavailable');
    });

    await expect(
      logAPILatency({
        path: '/api/flaky',
        method: 'GET',
        duration: 120,
        status: 200,
        requestId: 'req-flaky',
      })
    ).resolves.toBeUndefined();

    expect(log.error).toHaveBeenCalledWith('monitoring.api_latency.log_failed', {
      path: '/api/flaky',
      method: 'GET',
      requestId: 'req-flaky',
      error: 'analytics unavailable',
    });
  });
});
