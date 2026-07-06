import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/db', () => ({
  db: {
    execute: vi.fn(),
  },
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: vi.fn(),
  },
}));

import { GET } from '@/app/api/moderation/transparency-report/route';
import { db } from '@/db';

function buildRequest(url: string) {
  return new NextRequest(url, { method: 'GET' });
}

describe('GET /api/moderation/transparency-report', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns report with default 30 day window', async () => {
    (db.execute as any)
      .mockResolvedValueOnce([{ status: 'submitted', category: 'spam', count: 2 }])
      .mockResolvedValueOnce([{ action_type: 'content_removed', count: 1 }])
      .mockResolvedValueOnce([{ status: 'submitted', count: 1 }]);

    const response = await GET(buildRequest('http://localhost/api/moderation/transparency-report'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.period.days).toBe(30);
    expect(payload.totals).toEqual({
      reports: 2,
      actions: 1,
      appeals: 1,
    });
    expect(payload.reportsByStatusAndCategory).toHaveLength(1);
    expect(payload.actionsByType).toHaveLength(1);
    expect(payload.appealsByStatus).toHaveLength(1);
  });

  it('clamps days query parameter into 1..365 range', async () => {
    (db.execute as any)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const highResponse = await GET(
      buildRequest('http://localhost/api/moderation/transparency-report?days=9999')
    );
    const highPayload = await highResponse.json();
    expect(highPayload.period.days).toBe(365);

    (db.execute as any)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const lowResponse = await GET(
      buildRequest('http://localhost/api/moderation/transparency-report?days=0')
    );
    const lowPayload = await lowResponse.json();
    expect(lowPayload.period.days).toBe(1);
  });

  it('returns 500 when aggregation query fails', async () => {
    (db.execute as any).mockRejectedValueOnce(new Error('db-failure'));

    const response = await GET(
      buildRequest('http://localhost/api/moderation/transparency-report?days=30')
    );

    expect(response.status).toBe(500);
  });
});
