import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/email', () => ({
  sendWorkEmailVerification: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { sendWorkEmailVerification } from '@/lib/email';
import { POST } from '@/app/api/verification/work-email/send/route';

function makeRequest(workEmail: string) {
  return new NextRequest('https://proofound.io/api/verification/work-email/send', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ workEmail }),
  });
}

function createSupabaseMock(pendingStatusError: null | { message: string } = null) {
  const pendingPayloads: Array<Record<string, unknown>> = [];

  const duplicateCheck = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  };

  const writeQuery = {
    upsert: vi.fn().mockResolvedValue({ error: null }),
    update: vi.fn((payload: Record<string, unknown>) => {
      pendingPayloads.push(payload);
      return {
        eq: vi.fn().mockResolvedValue({ error: pendingStatusError }),
      };
    }),
  };

  const profilesQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { display_name: 'Verifier User' }, error: null }),
  };

  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
    },
    from: vi.fn((table: string) => {
      if (table === 'individual_profiles') {
        if ((supabase.from as any).mock.calls.length === 1) {
          return duplicateCheck;
        }
        return writeQuery;
      }

      if (table === 'profiles') {
        return profilesQuery;
      }

      throw new Error(`Unexpected table: ${table}`);
    }),
  } as any;

  return { supabase, pendingPayloads };
}

describe('POST /api/verification/work-email/send pending status sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sendWorkEmailVerification).mockResolvedValue();
  });

  it('returns pending status in successful response payload', async () => {
    const { supabase, pendingPayloads } = createSupabaseMock();
    (createClient as any).mockResolvedValue(supabase);

    const response = await POST(makeRequest('person@acme.org'));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toMatchObject({
      success: true,
      verificationStatus: 'pending',
    });
    expect(pendingPayloads).toContainEqual({
      verification_status: 'pending',
      verification_method: 'work_email',
    });
  });

  it('keeps success response even if explicit pending status update fails', async () => {
    const { supabase } = createSupabaseMock({ message: 'write failed' });
    (createClient as any).mockResolvedValue(supabase);

    const response = await POST(makeRequest('person@acme.org'));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.verificationStatus).toBe('pending');
  });
});
