import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: vi.fn(),
}));

import { requireApiAuthContext } from '@/lib/auth';
import { GET } from '@/app/api/expertise/verifications/incoming/route';

describe('GET /api/expertise/verifications/incoming', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses disambiguated skill verification select paths and normalized email filter', async () => {
    const eqSpy = vi.fn();
    const orderSpy = vi.fn().mockResolvedValue({ data: [], error: null });

    const queryBuilder = {
      eq: eqSpy,
      order: orderSpy,
    };

    eqSpy.mockReturnValue(queryBuilder);

    const selectSpy = vi.fn().mockReturnValue(queryBuilder);
    const fromSpy = vi.fn().mockReturnValue({
      select: selectSpy,
    });

    vi.mocked(requireApiAuthContext).mockResolvedValue({
      user: { id: 'user-1' },
      supabase: {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { email: 'USER@EXAMPLE.COM' } },
          }),
        },
        from: fromSpy,
      },
    } as any);

    const response = await GET(
      new NextRequest('http://localhost/api/expertise/verifications/incoming?status=pending')
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ requests: [] });

    expect(fromSpy).toHaveBeenCalledWith('skill_verification_requests');
    expect(selectSpy).toHaveBeenCalledTimes(1);
    const selectQuery = String(selectSpy.mock.calls[0]?.[0] || '');
    expect(selectQuery).toContain('skills:skills!skill_verification_requests_skill_id_fkey');
    expect(selectQuery).toContain('competency_level:level');
    expect(selectQuery).toContain('skills_taxonomy:skills_taxonomy!skills_skill_code_fkey');
    expect(selectQuery).toContain(
      'profiles:profiles!skill_verification_requests_requester_profile_id_fkey'
    );

    expect(eqSpy).toHaveBeenCalledWith('verifier_email', 'user@example.com');
    expect(eqSpy).toHaveBeenCalledWith('status', 'pending');
    expect(orderSpy).toHaveBeenCalledWith('created_at', { ascending: false });
  });
});
