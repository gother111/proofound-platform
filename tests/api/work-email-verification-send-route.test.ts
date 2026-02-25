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

type IndividualProfileRow = {
  user_id: string;
  work_email_verified: boolean;
};

function createSupabaseMock(options: {
  authUser?: { id: string };
  authError?: Error | null;
  existingProfile?: IndividualProfileRow | null;
  upsertError?: { message: string } | null;
  profile?: { display_name: string } | null;
}) {
  const {
    authUser = { id: 'user-1' },
    authError = null,
    existingProfile = null,
    upsertError = null,
    profile = { display_name: 'Alice' },
  } = options;

  const profileRow = profile;
  const upsertPayloads: Array<Record<string, unknown>> = [];

  const individualProfilesQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: existingProfile, error: null }),
  };

  const individualProfilesUpsert = {
    upsert: vi.fn((payload: Record<string, unknown>) => {
      upsertPayloads.push(payload);
      return Promise.resolve({ error: upsertError });
    }),
  };

  const profileQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: profileRow,
      error: null,
    }),
  };

  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: authUser },
        error: authError,
      }),
    },
    from: vi.fn((table: string) => {
      if (table === 'individual_profiles') {
        return {
          ...individualProfilesQuery,
          ...individualProfilesUpsert,
        };
      }

      if (table === 'profiles') {
        return profileQuery;
      }

      throw new Error(`Unexpected table: ${table}`);
    }),
  } as any;

  return { supabase, upsertPayloads, individualProfilesQuery, profileQuery };
}

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('https://proofound.io/api/verification/work-email/send', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/verification/work-email/send', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('normalizes email, stores verification token, and sends work email verification', async () => {
    const { supabase, upsertPayloads } = createSupabaseMock({
      existingProfile: null,
      profile: { display_name: 'Alice Researcher' },
    });
    (createClient as any).mockResolvedValue(supabase);
    vi.mocked(sendWorkEmailVerification).mockResolvedValue();

    const response = await POST(
      makeRequest({
        workEmail: 'Alice@Acme.Org',
        orgId: '123e4567-e89b-42d3-a456-426614174000',
      }),
      {} as any
    );

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(upsertPayloads).toHaveLength(1);
    expect(upsertPayloads[0]).toMatchObject({
      user_id: 'user-1',
      work_email: 'alice@acme.org',
      work_email_org_id: '123e4567-e89b-42d3-a456-426614174000',
      work_email_verified: false,
    });
    expect(sendWorkEmailVerification).toHaveBeenCalledTimes(1);
    const [sentEmail, sentToken] = vi.mocked(sendWorkEmailVerification).mock.calls[0] as [
      string,
      string,
      string,
    ];
    expect(sentEmail).toBe('Alice@Acme.Org');
    expect(typeof sentToken).toBe('string');
    expect(sentToken).toMatch(/^[a-f0-9]{64}$/);
    expect(vi.mocked(sendWorkEmailVerification).mock.calls[0][2]).toBe('Alice Researcher');
  });

  it('returns 400 when work email is already verified by another account', async () => {
    const { supabase, upsertPayloads } = createSupabaseMock({
      existingProfile: {
        user_id: 'other-user',
        work_email_verified: true,
      },
    });
    (createClient as any).mockResolvedValue(supabase);

    const response = await POST(
      makeRequest({
        workEmail: 'owner@acme.org',
      }),
      {} as any
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: 'This work email is already verified by another account',
    });
    expect(upsertPayloads).toHaveLength(0);
    expect(sendWorkEmailVerification).not.toHaveBeenCalled();
  });

  it('returns 500 when email delivery fails', async () => {
    const { supabase } = createSupabaseMock({
      existingProfile: null,
    });
    (createClient as any).mockResolvedValue(supabase);
    vi.mocked(sendWorkEmailVerification).mockRejectedValue(new Error('Resend unavailable'));

    const response = await POST(
      makeRequest({
        workEmail: 'new@acme.org',
      }),
      {} as any
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({
      error: 'Failed to send verification email',
    });
  });

  it('returns 401 when auth is missing', async () => {
    const { supabase } = createSupabaseMock({
      authUser: undefined as unknown as { id: string },
      authError: new Error('not signed in'),
    });
    (createClient as any).mockResolvedValue(supabase);

    const response = await POST(makeRequest({ workEmail: 'test@acme.org' }), {} as any);

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: 'Unauthorized' });
  });
});
