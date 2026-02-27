import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: vi.fn(),
}));

vi.mock('@/lib/email/sender', () => ({
  sendEmail: vi.fn(),
}));

vi.mock('@/lib/analytics/events', () => ({
  emitVerificationRequestedAsync: vi.fn(),
}));

import { requireApiAuthContext } from '@/lib/auth';
import { sendEmail } from '@/lib/email/sender';
import { POST } from '@/app/api/expertise/user-skills/[id]/verification-request/route';

const params = { params: Promise.resolve({ id: 'skill-1' }) };

function createRequest(origin: string, body: Record<string, unknown>) {
  return new NextRequest(`${origin}/api/expertise/user-skills/skill-1/verification-request`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

function createSupabaseMock(options?: {
  missingTokenColumnOnFirstInsert?: boolean;
  uniqueConflictOnInsert?: boolean;
  precheckResults?: Array<
    Array<{ id: string; status: 'pending' | 'accepted'; verifier_email: string }>
  >;
  requesterEmail?: string | null;
}) {
  const inserts: any[] = [];
  let insertCalls = 0;
  let precheckCalls = 0;

  const skillsQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: {
        id: 'skill-1',
        profile_id: 'user-1',
        skill_code: null,
        skill_id: 'custom-1-2-3-system-design',
        taxonomy: null,
      },
      error: null,
    }),
  };

  const profilesQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: {
        display_name: 'Alice',
      },
      error: null,
    }),
  };

  const verificationRequestsQuery = {
    select: vi.fn().mockImplementation(() => {
      const builder: any = {};
      builder.eq = vi.fn().mockImplementation(() => builder);
      builder.in = vi.fn().mockImplementation(() => {
        const resultSet =
          options?.precheckResults?.[
            Math.min(precheckCalls, Math.max((options.precheckResults?.length || 1) - 1, 0))
          ] || [];
        precheckCalls += 1;

        return Promise.resolve({
          data: resultSet,
          error: null,
        });
      });

      return builder;
    }),
    insert: vi.fn().mockImplementation(async (payload: any) => {
      inserts.push(payload);
      insertCalls += 1;
      if (options?.uniqueConflictOnInsert) {
        return {
          error: {
            code: '23505',
            message:
              'duplicate key value violates unique constraint "idx_skill_verification_active_unique_verifier"',
          },
        };
      }
      if (
        options?.missingTokenColumnOnFirstInsert &&
        insertCalls === 1 &&
        payload?.verification_token
      ) {
        return {
          error: {
            code: 'PGRST204',
            message:
              "Could not find the 'verification_token' column of 'skill_verification_requests' in the schema cache",
          },
        };
      }
      return { error: null };
    }),
  };

  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            email: options?.requesterEmail ?? 'alice@proofound.io',
          },
        },
        error: null,
      }),
    },
    from: vi.fn((table: string) => {
      if (table === 'skills') return skillsQuery;
      if (table === 'profiles') return profilesQuery;
      if (table === 'skill_verification_requests') return verificationRequestsQuery;
      throw new Error(`Unexpected table ${table}`);
    }),
  };

  return { supabase, inserts, verificationRequestsQuery, precheckCallCount: () => precheckCalls };
}

describe('POST /api/expertise/user-skills/[id]/verification-request', () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  let authContext: { user: { id: string; email: string }; supabase: any };

  beforeEach(() => {
    vi.clearAllMocks();
    const { supabase } = createSupabaseMock();
    authContext = {
      user: {
        id: 'user-1',
        email: 'alice@proofound.io',
      },
      supabase,
    };

    (requireApiAuthContext as any).mockImplementation(async () => authContext);
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
  });

  it('normalizes verifier email and sends token link using configured site url', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io';
    process.env.NEXT_PUBLIC_APP_URL = '';

    const { supabase, inserts } = createSupabaseMock();
    authContext.supabase = supabase;
    (sendEmail as any).mockResolvedValue({ success: true, id: 'email-1' });

    const response = await POST(
      createRequest('https://proofound.io', {
        verifierSource: 'peer',
        verifierEmail: 'Mentor@Example.COM',
        message: 'Please verify my artifact history.',
      }),
      params
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.email_sent).toBe(true);
    expect(body.request.id).toBe(inserts[0].id);

    expect(inserts[0]).toMatchObject({
      verifier_email: 'mentor@example.com',
      verifier_source: 'peer',
      requester_profile_id: 'user-1',
    });
    expect(inserts[0].verification_token).toMatch(/^[a-f0-9]{64}$/);

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'mentor@example.com',
      })
    );

    const sentEmailPayload = (sendEmail as any).mock.calls[0][0];
    expect(sentEmailPayload.html).toContain('https://proofound.io/verify/');
  });

  it('accepts verifier emails with surrounding whitespace', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io';
    process.env.NEXT_PUBLIC_APP_URL = '';

    const { supabase, inserts } = createSupabaseMock();
    authContext.supabase = supabase;
    (sendEmail as any).mockResolvedValue({ success: true, id: 'email-2' });

    const response = await POST(
      createRequest('https://proofound.io', {
        verifierSource: 'peer',
        verifierEmail: '  Mentor@Example.COM  ',
      }),
      params
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.email_sent).toBe(true);
    expect(body.request.id).toBe(inserts[0].id);
    expect(inserts[0].verifier_email).toBe('mentor@example.com');

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'mentor@example.com',
      })
    );
  });

  it('returns email_sent=false while keeping request persisted when email fails', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = '';
    process.env.NEXT_PUBLIC_APP_URL = '';

    const { supabase, inserts } = createSupabaseMock();
    authContext.supabase = supabase;
    (sendEmail as any).mockResolvedValue({ success: false, error: 'Email service not configured' });

    const response = await POST(
      createRequest('https://staging.proofound.io', {
        verifierSource: 'manager',
        verifierEmail: 'Boss@Company.COM',
      }),
      params
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.email_sent).toBe(false);
    expect(body.request.id).toBe(inserts[0].id);

    expect(inserts[0].verifier_email).toBe('boss@company.com');

    const sentEmailPayload = (sendEmail as any).mock.calls[0][0];
    expect(sentEmailPayload.html).toContain('https://staging.proofound.io/verify/');
  });

  it('falls back to legacy insert when verification_token column is missing', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io';
    process.env.NEXT_PUBLIC_APP_URL = '';

    const { supabase, inserts } = createSupabaseMock({ missingTokenColumnOnFirstInsert: true });
    authContext.supabase = supabase;
    (sendEmail as any).mockResolvedValue({ success: true, id: 'email-legacy' });

    const response = await POST(
      createRequest('https://proofound.io', {
        verifierSource: 'peer',
        verifierEmail: 'Legacy@Example.COM',
      }),
      params
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.email_sent).toBe(true);
    expect(body.request.id).toBe(inserts[1].id);

    expect(inserts).toHaveLength(2);
    expect(inserts[0].verification_token).toMatch(/^[a-f0-9]{64}$/);
    expect(inserts[1].verification_token).toBeUndefined();
    expect(inserts[1].verifier_email).toBe('legacy@example.com');

    const sentEmailPayload = (sendEmail as any).mock.calls[0][0];
    expect(sentEmailPayload.html).toContain(`https://proofound.io/verify/${inserts[1].id}`);
  });

  it('runs only the active-duplicate precheck select before insert', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io';
    process.env.NEXT_PUBLIC_APP_URL = '';

    const { supabase, verificationRequestsQuery } = createSupabaseMock();
    authContext.supabase = supabase;
    (sendEmail as any).mockResolvedValue({ success: true, id: 'email-no-readback' });

    const response = await POST(
      createRequest('https://proofound.io', {
        verifierSource: 'peer',
        verifierEmail: 'NoReadback@Example.COM',
      }),
      params
    );

    expect(response.status).toBe(201);
    expect(verificationRequestsQuery.select).toHaveBeenCalledTimes(1);
  });

  it('returns 401 when API auth context is unavailable', async () => {
    (requireApiAuthContext as any).mockResolvedValue(null);

    const response = await POST(
      createRequest('https://proofound.io', {
        verifierSource: 'peer',
        verifierEmail: 'mentor@example.com',
      }),
      params
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('blocks self verification requests by canonical email identity', async () => {
    const { supabase } = createSupabaseMock({ requesterEmail: 'alice@proofound.io' });
    authContext.supabase = supabase;

    const response = await POST(
      createRequest('https://proofound.io', {
        verifierSource: 'peer',
        verifierEmail: 'Alice+alias@Proofound.io',
      }),
      params
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: 'SELF_VERIFICATION_BLOCKED',
    });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('returns 409 when a pending active duplicate exists', async () => {
    const { supabase } = createSupabaseMock({
      precheckResults: [
        [{ id: 'req-pending', status: 'pending', verifier_email: 'mentor@example.com' }],
      ],
    });
    authContext.supabase = supabase;

    const response = await POST(
      createRequest('https://proofound.io', {
        verifierSource: 'peer',
        verifierEmail: 'Mentor@Example.com',
      }),
      params
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: 'DUPLICATE_VERIFICATION_REQUEST',
      existingRequestId: 'req-pending',
      existingStatus: 'pending',
    });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('returns 409 when an accepted active duplicate exists', async () => {
    const { supabase } = createSupabaseMock({
      precheckResults: [
        [{ id: 'req-accepted', status: 'accepted', verifier_email: 'mentor@example.com' }],
      ],
    });
    authContext.supabase = supabase;

    const response = await POST(
      createRequest('https://proofound.io', {
        verifierSource: 'manager',
        verifierEmail: 'mentor@example.com',
      }),
      params
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: 'DUPLICATE_VERIFICATION_REQUEST',
      existingRequestId: 'req-accepted',
      existingStatus: 'accepted',
    });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('returns 409 when unique constraint race occurs during insert', async () => {
    const { supabase, inserts, precheckCallCount } = createSupabaseMock({
      uniqueConflictOnInsert: true,
      precheckResults: [
        [],
        [{ id: 'req-race', status: 'pending', verifier_email: 'mentor@example.com' }],
      ],
    });
    authContext.supabase = supabase;

    const response = await POST(
      createRequest('https://proofound.io', {
        verifierSource: 'peer',
        verifierEmail: 'mentor@example.com',
      }),
      params
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: 'DUPLICATE_VERIFICATION_REQUEST',
      existingRequestId: 'req-race',
      existingStatus: 'pending',
    });
    expect(inserts).toHaveLength(1);
    expect(precheckCallCount()).toBe(2);
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
