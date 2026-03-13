import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/verification/policy', async () => {
  const actual = await vi.importActual<typeof import('@/lib/verification/policy')>(
    '@/lib/verification/policy'
  );

  return {
    ...actual,
    listVerificationRecordsForOwner: vi.fn().mockResolvedValue([]),
  };
});

import { createClient } from '@/lib/supabase/server';
import { GET } from '@/app/api/verification/status/route';

type VerificationProfile = {
  verified: boolean;
  verification_method: 'veriff' | 'work_email' | 'linkedin' | null;
  verification_status: 'unverified' | 'pending' | 'verified' | 'failed' | null;
  verification_tier?: 'unverified' | 'workplace_verified' | 'identity_verified' | null;
  verification_tier_source?:
    | 'linkedin_identity'
    | 'linkedin_workplace'
    | 'work_email'
    | 'veriff'
    | 'unknown'
    | null;
  verified_at: string | null;
  linkedin_verification_status?: 'unverified' | 'pending' | 'verified' | 'failed' | null;
  linkedin_verification_level?:
    | 'unverified'
    | 'pending'
    | 'workplace'
    | 'identity'
    | 'failed'
    | null;
  linkedin_verified_at?: string | null;
  linkedin_verification_data?: Record<string, unknown> | null;
  work_email: string | null;
  work_email_verified: boolean;
  work_email_verified_at: string | null;
  work_email_reverify_due_at: string | null;
  work_email_token: string | null;
  work_email_token_expires: string | null;
};

type ProfileQueryResult = {
  data: VerificationProfile | null;
  error?: { code?: string; message?: string; details?: string | null; hint?: string | null } | null;
};

function createSupabaseMock(options: {
  authUser?: { id: string } | null;
  authError?: Error | null;
  profile?: VerificationProfile | null;
  profileError?: { code?: string; message?: string; details?: string } | null;
  profileResponses?: ProfileQueryResult[];
}) {
  const {
    authUser = { id: 'user-1' },
    authError = null,
    profile = null,
    profileError = null,
    profileResponses = [],
  } = options;

  const maybeSingle = vi.fn();
  if (profileResponses.length > 0) {
    profileResponses.forEach((response) => {
      maybeSingle.mockResolvedValueOnce({
        data: response.data,
        error: response.error ?? null,
      });
    });
  } else {
    maybeSingle.mockResolvedValue({
      data: profile,
      error: profileError,
    });
  }

  const individualProfilesQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle,
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
        work_email_verified_at: null,
        work_email_reverify_due_at: null,
        work_email_token: 'token-123',
        work_email_token_expires: expiresAt,
      },
    });
    (createClient as any).mockResolvedValue(supabase);

    const response = await GET(makeRequest());
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.channels.workEmail.state).toBe('pending');
    expect(body.channels.workEmail.email).toBe('person@acme.org');
    expect(body.workflow?.state).toBe('pending');
    expect(body).not.toHaveProperty('verificationTier');
    expect(body).not.toHaveProperty('verificationMethod');
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
        work_email_verified_at: null,
        work_email_reverify_due_at: null,
        work_email_token: 'token-123',
        work_email_token_expires: expiresAt,
      },
    });
    (createClient as any).mockResolvedValue(supabase);

    const response = await GET(makeRequest());
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.channels.workEmail.state).toBe('failed');
    expect(body.workflow?.state).toBe('failed');
    expect(body.summary.publicBadges).toEqual([]);
  });

  it('marks work email as stale when re-verification due date is in the past', async () => {
    const pastDue = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const verifiedAt = new Date(Date.now() - 366 * 24 * 60 * 60 * 1000).toISOString();
    const supabase = createSupabaseMock({
      profile: {
        verified: true,
        verification_method: 'work_email',
        verification_status: 'verified',
        verified_at: verifiedAt,
        work_email: 'person@acme.org',
        work_email_verified: true,
        work_email_verified_at: verifiedAt,
        work_email_reverify_due_at: pastDue,
        work_email_token: null,
        work_email_token_expires: null,
      },
    });
    (createClient as any).mockResolvedValue(supabase);

    const response = await GET(makeRequest());
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.channels.workEmail.state).toBe('expired');
    expect(body.channels.workEmail.needsReverify).toBe(true);
    expect(body.channels.workEmail.reverifyDueAt).toBe(pastDue);
    expect(body.workflow?.state).toBe('expired');
  });

  it('keeps work email as valid when re-verification due date is in the future', async () => {
    const futureDue = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const verifiedAt = new Date().toISOString();
    const supabase = createSupabaseMock({
      profile: {
        verified: true,
        verification_method: 'work_email',
        verification_status: 'verified',
        verified_at: verifiedAt,
        work_email: 'person@acme.org',
        work_email_verified: true,
        work_email_verified_at: verifiedAt,
        work_email_reverify_due_at: futureDue,
        work_email_token: null,
        work_email_token_expires: null,
      },
    });
    (createClient as any).mockResolvedValue(supabase);

    const response = await GET(makeRequest());
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.channels.workEmail.state).toBe('verified');
    expect(body.channels.workEmail.needsReverify).toBe(false);
    expect(body.channels.workEmail.reverifyDueAt).toBe(futureDue);
    expect(body.workflow?.state).toBe('verified');
    expect(body.summary.publicBadges).toEqual([]);
  });

  it('fails honestly when required verification columns are missing', async () => {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const supabase = createSupabaseMock({
      profileResponses: [
        {
          data: null,
          error: {
            code: '42703',
            message: 'column individual_profiles.work_email_verified_at does not exist',
          },
        },
      ],
    });
    (createClient as any).mockResolvedValue(supabase);

    const response = await GET(makeRequest());
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('Failed to fetch verification status');
    expect(body.details).toContain('does not exist');
  });

  it('keeps LinkedIn signals channel-scoped without global trust inflation', async () => {
    const nowIso = new Date().toISOString();
    const supabase = createSupabaseMock({
      profile: {
        verified: false,
        verification_method: null,
        verification_status: 'unverified',
        verified_at: null,
        linkedin_verification_status: 'verified',
        linkedin_verified_at: nowIso,
        linkedin_verification_data: {
          hasIdentityVerification: true,
        },
        work_email: null,
        work_email_verified: false,
        work_email_verified_at: null,
        work_email_reverify_due_at: null,
        work_email_token: null,
        work_email_token_expires: null,
      },
    });
    (createClient as any).mockResolvedValue(supabase);

    const response = await GET(makeRequest());
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.channels.linkedin.state).toBe('verified');
    expect(body.channels.linkedin.signalLevel).toBe('identity');
    expect(body.channels.linkedin.hasIdentitySignal).toBe(true);
    expect(body.channels.linkedin.verifiedAt).toBe(nowIso);
    expect(body).not.toHaveProperty('linkedinVerificationLevel');
    expect(body).not.toHaveProperty('linkedinHasIdentityVerification');
    expect(body.summary.publicBadges).toEqual([]);
  });
});
