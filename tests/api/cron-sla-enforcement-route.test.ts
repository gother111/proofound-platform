import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  matchLimit: vi.fn(),
  matchWhere: vi.fn(),
  matchFrom: vi.fn(),
  select: vi.fn(),
  updateWhere: vi.fn(),
  updateSet: vi.fn(),
  update: vi.fn(),
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mocks.select(...args),
    update: (...args: unknown[]) => mocks.update(...args),
  },
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: mocks.logInfo,
    warn: mocks.logWarn,
    error: mocks.logError,
  },
}));

import { GET } from '@/app/api/cron/sla-enforcement/route';

describe('GET /api/cron/sla-enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'cron-secret';

    mocks.matchLimit.mockResolvedValue([]);
    mocks.matchWhere.mockReturnValue({ limit: mocks.matchLimit });
    mocks.matchFrom.mockReturnValue({ where: mocks.matchWhere });
    mocks.select.mockReturnValue({ from: mocks.matchFrom });

    mocks.updateWhere.mockResolvedValue(undefined);
    mocks.updateSet.mockReturnValue({ where: mocks.updateWhere });
    mocks.update.mockReturnValue({ set: mocks.updateSet });
  });

  it('flags completed interviews that do not have a decision maker recorded', async () => {
    mocks.matchLimit
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'interview-1' }, { id: 'interview-2' }]);

    const response = await GET(
      new NextRequest('https://example.com/api/cron/sla-enforcement', {
        headers: { authorization: 'Bearer cron-secret' },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.expiredMatches).toBe(0);
    expect(body.expiredInterviews).toBe(2);
    expect(body.flaggedOverdueDecisions).toBe(2);
    expect(body.interviewIds).toEqual(['interview-1', 'interview-2']);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('rejects requests with an invalid cron secret', async () => {
    const response = await GET(
      new NextRequest('https://example.com/api/cron/sla-enforcement', {
        headers: { authorization: 'Bearer wrong-secret' },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
    expect(mocks.select).not.toHaveBeenCalled();
  });
});
