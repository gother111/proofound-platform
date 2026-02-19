import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST } from '../fairness-report/route';
import { requirePlatformAdminJson } from '@/lib/api/route-helpers';
import { createClient } from '@/lib/supabase/server';

vi.mock('@/lib/api/route-helpers', () => ({
  requirePlatformAdminJson: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

function buildRequest(body: Record<string, unknown>) {
  return new NextRequest('https://example.com/api/admin/fairness-report', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('admin fairness report route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns guard response when caller is not a platform admin', async () => {
    vi.mocked(requirePlatformAdminJson).mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized', details: null }, { status: 401 })
    );

    const response = await POST(buildRequest({ dateRange: '30' }));

    expect(response.status).toBe(401);
    expect(createClient).not.toHaveBeenCalled();
  });

  it('returns markdown report payload and records analytics event on success', async () => {
    vi.mocked(requirePlatformAdminJson).mockResolvedValue({
      adminLevel: 'platform_admin',
      userId: 'admin-1',
      email: 'admin@example.com',
      platformRole: 'platform_admin',
    });

    const insertSpy = vi.fn().mockResolvedValue({ error: null });
    const lteSpy = vi.fn().mockResolvedValue({
      data: [{ score: 0.82, profile_id: 'profile-1', assignment_id: 'assignment-1' }],
      error: null,
    });
    const gteSpy = vi.fn().mockReturnValue({ lte: lteSpy });
    const selectSpy = vi.fn().mockReturnValue({ gte: gteSpy });
    const fromSpy = vi.fn((table: string) => {
      if (table === 'matches') {
        return { select: selectSpy };
      }
      return { insert: insertSpy };
    });

    vi.mocked(createClient).mockResolvedValue({
      from: fromSpy,
    } as any);

    const response = await POST(buildRequest({ dateRange: '90' }));
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/markdown');
    expect(body).toContain('# Fairness Monitoring Report');
    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'admin-1',
        event_type: 'fairness_report_generated',
        event_data: expect.objectContaining({
          totalMatches: 1,
        }),
      })
    );
  });
});
