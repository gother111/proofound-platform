import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../analytics/growth/route';
import { db } from '@/db';
import { requirePlatformAdmin } from '@/lib/auth/admin';
import { logAnalyticsAccess } from '@/lib/audit/admin-logger';

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock('@/lib/auth/admin', () => ({
  requirePlatformAdmin: vi.fn(),
}));

vi.mock('@/lib/audit/admin-logger', () => ({
  logAnalyticsAccess: vi.fn(),
}));

function buildSelectChain(rows: Array<{ period: string; count: number }>) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        groupBy: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue(rows),
        }),
      }),
    }),
  };
}

function mockGrowthQueries(
  userRows: Array<{ period: string; count: number }>,
  organizationRows: Array<{ period: string; count: number }>
) {
  const select = db.select as unknown as ReturnType<typeof vi.fn>;
  select.mockReset();
  select.mockReturnValueOnce(buildSelectChain(userRows));
  select.mockReturnValueOnce(buildSelectChain(organizationRows));
}

describe('admin growth analytics route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requirePlatformAdmin).mockResolvedValue({
      userId: 'admin-1',
      email: 'admin@example.com',
      platformRole: 'platform_admin',
      adminLevel: 'platform_admin',
    });
    vi.mocked(logAnalyticsAccess).mockResolvedValue();
  });

  it.each(['day', 'week', 'month'] as const)(
    'returns growth analytics for valid groupBy=%s',
    async (groupBy) => {
      mockGrowthQueries(
        [
          { period: '2026-02-01', count: 2 },
          { period: '2026-02-02', count: 3 },
        ],
        [{ period: '2026-02-01', count: 1 }]
      );

      const response = await GET(
        new NextRequest(
          `https://example.com/api/admin/analytics/growth?period=30d&groupBy=${groupBy}`
        )
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.period.groupBy).toBe(groupBy);
      expect(body.data.users).toEqual([
        { period: '2026-02-01', count: 2, cumulative: 2 },
        { period: '2026-02-02', count: 3, cumulative: 5 },
      ]);
      expect(body.data.organizations).toEqual([{ period: '2026-02-01', count: 1, cumulative: 1 }]);
      expect(logAnalyticsAccess).toHaveBeenCalledWith('admin-1', 'growth', {
        period: '30d',
        groupBy,
      });
      expect(db.select).toHaveBeenCalledTimes(2);
    }
  );

  it('falls back to day for invalid groupBy values', async () => {
    mockGrowthQueries([], []);

    const response = await GET(
      new NextRequest('https://example.com/api/admin/analytics/growth?period=7d&groupBy=quarter')
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.period.groupBy).toBe('day');
    expect(logAnalyticsAccess).toHaveBeenCalledWith('admin-1', 'growth', {
      period: '7d',
      groupBy: 'day',
    });
  });
});
