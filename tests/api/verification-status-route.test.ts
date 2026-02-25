import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { GET } from '@/app/api/verification/status/route';

type VerificationProfile = {
  verified: boolean;
  verification_method: 'veriff' | 'work_email' | 'linkedin' | null;
  verification_status: 'unverified' | 'pending' | 'verified' | 'failed' | null;
  verified_at: string | null;
  work_email: string | null;
  work_email_verified: boolean;
  work_email_token: string | null;
  work_email_token_expires: string | null;
};

function createSupabaseMock(options: {
  authUser?: { id: string } | null;
  authError?: Error | null;
  profile?: VerificationProfile | null;
  profileError?: { code?: string; message?: string; details?: string } | null;
}) {
  const {
    authUser = { id: 'user-1' },
    authError = null,
    profile = null,
    profileError = null,
  } = options;

  const individualProfilesQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: profile,
      error: profileError,
    }),
  };

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: authUser },
        error: authError,
      }),
    },
    from: vi.fn((table: string) => {
      if (table === 'individual_profiles') {
        return individualProfilesQuery;
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
  } as any;
}

function makeRequest() {
  return new NextRequest('https://proofound.io/api/verification/status', {
    method: 'GET',
  });
}

describe('GET /api/verification/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('derives pending status from active work email token when explicit status is missing', async () => {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const supabase = createSupabaseMock({
      profile: {
        verified: false,
        verification_method: null,
        verification_status: null,
        verified_at: null,
        work_email: 'person@acme.org',
        work_email_verified: false,
        work_email_token: 'token-123',
        work_email_token_expires: expiresAt,
      },
    });
    (createClient as any).mockResolvedValue(supabase);

    const response = await GET(makeRequest());
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.verificationStatus).toBe('pending');
    expect(body.verificationMethod).toBe('work_email');
    expect(body.workEmail).toBe('person@acme.org');
  });

  it('keeps explicit status even when token is active', async () => {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const supabase = createSupabaseMock({
      profile: {
        verified: false,
        verification_method: null,
        verification_status: 'failed',
        verified_at: null,
        work_email: 'person@acme.org',
        work_email_verified: false,
        work_email_token: 'token-123',
        work_email_token_expires: expiresAt,
      },
    });
    (createClient as any).mockResolvedValue(supabase);

    const response = await GET(makeRequest());
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.verificationStatus).toBe('failed');
    expect(body.verificationMethod).toBeNull();
  });
});
