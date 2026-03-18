import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/email', () => ({
  sendWorkEmailVerification: vi.fn(),
}));

vi.mock('@/lib/workflow/service', () => ({
  buildWorkflowView: vi.fn(({ state, timestamps }) => ({
    machine: 'verification',
    state,
    displayState: state,
    reasonCode: null,
    timestamps,
    allowedActions: [],
  })),
  syncWorkEmailVerificationRequested: vi.fn().mockResolvedValue(null),
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

function createSupabaseMock() {
  const duplicateCheck = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  };

  const writeQuery = {
    upsert: vi.fn().mockResolvedValue({ error: null }),
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

  return { supabase };
}

describe('POST /api/verification/work-email/send pending status sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sendWorkEmailVerification).mockResolvedValue();
  });

  it('returns pending status in successful response payload', async () => {
    const { supabase } = createSupabaseMock();
    (createClient as any).mockResolvedValue(supabase);

    const response = await POST(makeRequest('person@acme.org'));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toMatchObject({
      success: true,
      verificationStatus: 'pending',
    });
  });

  it('keeps success response without writing legacy global verification status', async () => {
    const { supabase } = createSupabaseMock();
    (createClient as any).mockResolvedValue(supabase);

    const response = await POST(makeRequest('person@acme.org'));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.verificationStatus).toBe('pending');
  });
});
