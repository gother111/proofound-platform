import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET } from '../fairness-metrics/route';
import { adminListGuard } from '../_utils';
import { createClient } from '@/lib/supabase/server';

vi.mock('../_utils', () => ({
  adminListGuard: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('admin fairness metrics route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns guard response when admin guard fails', async () => {
    vi.mocked(adminListGuard).mockResolvedValue(
      NextResponse.json({ error: 'Forbidden', details: null }, { status: 403 })
    );

    const response = await GET(
      new NextRequest('https://example.com/api/admin/fairness-metrics?days=30')
    );

    expect(response.status).toBe(403);
    expect(createClient).not.toHaveBeenCalled();
  });

  it('queries real match columns and returns fairness payload keys', async () => {
    vi.mocked(adminListGuard).mockResolvedValue({
      adminUser: { userId: 'admin-1' },
      params: { page: 1, limit: 10, search: '', sortField: 'createdAt', sortDir: 'desc' },
    } as any);

    const selectSpy = vi.fn().mockReturnValue({
      gte: vi.fn().mockReturnValue({
        lte: vi.fn().mockResolvedValue({
          data: [
            { score: '0.82', profile_id: 'p-1', assignment_id: 'a-1', created_at: '2026-02-01' },
            { score: '73', profile_id: 'p-2', assignment_id: 'a-1', created_at: '2026-02-02' },
            { score: '68', profile_id: 'p-3', assignment_id: 'a-2', created_at: '2026-02-03' },
          ],
          error: null,
        }),
      }),
    });

    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({
        select: selectSpy,
      }),
    } as any);

    const response = await GET(
      new NextRequest('https://example.com/api/admin/fairness-metrics?days=30')
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(selectSpy).toHaveBeenCalledWith('score, profile_id, assignment_id, created_at');
    expect(body.metrics).toBeDefined();
    expect(body.gapAnalyses).toBeDefined();
    expect(body.dateRange).toBeDefined();
    expect(body.totalMatches).toBe(3);
  });
});
