import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { GET } from '@/app/api/verification/work-email/verify/route';

describe('GET /api/verification/work-email/verify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('stamps work email verification and annual re-verification due date', async () => {
    const profileRow = {
      user_id: 'user-1',
      work_email: 'person@acme.org',
      work_email_token_expires: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      work_email_org_id: null,
    };

    let fromCall = 0;
    let updatePayload: Record<string, any> | null = null;

    const tokenLookupQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: profileRow,
        error: null,
      }),
    };

    const existingVerifiedQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    };

    const updateQuery = {
      update: vi.fn().mockImplementation((payload: Record<string, any>) => {
        updatePayload = payload;
        return updateQuery;
      }),
      eq: vi.fn().mockResolvedValue({
        error: null,
      }),
    };

    const supabase = {
      from: vi.fn(() => {
        if (fromCall === 0) {
          fromCall += 1;
          return tokenLookupQuery;
        }
        if (fromCall === 1) {
          fromCall += 1;
          return existingVerifiedQuery;
        }
        if (fromCall === 2) {
          fromCall += 1;
          return updateQuery;
        }
        throw new Error(`Unexpected from() call index ${fromCall}`);
      }),
    } as any;

    (createClient as any).mockResolvedValue(supabase);

    const request = new NextRequest(
      'https://proofound.io/api/verification/work-email/verify?token=token-123',
      {
        method: 'GET',
      }
    );

    const response = await GET(request);
    expect(response.status).toBe(200);

    expect(updatePayload).toBeTruthy();
    expect(updatePayload?.work_email_verified).toBe(true);
    expect(updatePayload?.work_email_verified_at).toBeTruthy();
    expect(updatePayload?.work_email_reverify_due_at).toBeTruthy();

    const verifiedAt = new Date(updatePayload!.work_email_verified_at).getTime();
    const reverifyDueAt = new Date(updatePayload!.work_email_reverify_due_at).getTime();
    expect(reverifyDueAt).toBeGreaterThan(verifiedAt);
    expect(reverifyDueAt - verifiedAt).toBeGreaterThanOrEqual(364 * 24 * 60 * 60 * 1000);
  });
});
