import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: mocks.logInfo,
    warn: mocks.logWarn,
    error: mocks.logError,
  },
}));

import { GET } from '@/app/api/cron/account-deletion-workflow/route';

describe('GET /api/cron/account-deletion-workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'cron-secret';
  });

  it('returns a successful no-op compatibility response', async () => {
    const response = await GET(
      new NextRequest('https://example.com/api/cron/account-deletion-workflow', {
        headers: { authorization: 'Bearer cron-secret' },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      success: true,
      mode: 'legacy_noop',
      reminders: {
        processed: 0,
        results: [],
      },
      deletions: {
        processed: 0,
        results: [],
        mode: 'immediate',
      },
    });
    expect(body.message).toContain('no longer generates fairness notes');
    expect(body).not.toHaveProperty('fairnessNote');
  });

  it('rejects requests with an invalid cron secret', async () => {
    const response = await GET(
      new NextRequest('https://example.com/api/cron/account-deletion-workflow', {
        headers: { authorization: 'Bearer wrong-secret' },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
  });
});
