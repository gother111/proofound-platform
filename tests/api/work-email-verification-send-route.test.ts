import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import crypto from 'crypto';

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

vi.mock('@/lib/log', () => ({
  log: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import { createClient } from '@/lib/supabase/server';
import { sendWorkEmailVerification } from '@/lib/email';
import { POST } from '@/app/api/verification/work-email/send/route';
import { syncWorkEmailVerificationRequested } from '@/lib/workflow/service';
import { log } from '@/lib/log';

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

  return {
    supabase,
    upsertPayloads,
    individualProfilesQuery,
    profileQuery,
  };
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

function makeRawRequest(body: string) {
  return new NextRequest('https://proofound.io/api/verification/work-email/send', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body,
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
    expect(body.verificationStatus).toBe('pending');
    expect(upsertPayloads).toHaveLength(1);
    expect(upsertPayloads[0]).toMatchObject({
      user_id: 'user-1',
      work_email: 'alice@acme.org',
      work_email_org_id: '123e4567-e89b-42d3-a456-426614174000',
      work_email_verified: false,
    });
    expect(upsertPayloads[0].work_email_token).toBeNull();
    expect(typeof upsertPayloads[0].work_email_token_hash).toBe('string');
    expect(sendWorkEmailVerification).toHaveBeenCalledTimes(1);
    const [sentEmail, sentToken] = vi.mocked(sendWorkEmailVerification).mock.calls[0] as [
      string,
      string,
      string,
    ];
    expect(sentEmail).toBe('Alice@Acme.Org');
    expect(typeof sentToken).toBe('string');
    expect(sentToken).toMatch(/^[a-f0-9]{64}$/);
    expect(upsertPayloads[0].work_email_token_hash).toBe(
      crypto.createHash('sha256').update(sentToken).digest('hex')
    );
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
    expect(log.error).toHaveBeenCalledWith('verification.work_email_send.email_send_failed', {
      userId: 'user-1',
      orgId: null,
      recipientDomain: 'acme.org',
      error: 'Resend unavailable',
    });
  });

  it('logs profile update failures structurally while keeping the public response generic', async () => {
    const { supabase } = createSupabaseMock({
      existingProfile: null,
      upsertError: { message: 'profile upsert unavailable' },
    });
    (createClient as any).mockResolvedValue(supabase);

    const response = await POST(makeRequest({ workEmail: 'new@acme.org' }), {} as any);

    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({
      error: 'Failed to save work email',
    });
    expect(log.error).toHaveBeenCalledWith('verification.work_email_send.profile_update_failed', {
      userId: 'user-1',
      orgId: null,
      error: 'profile upsert unavailable',
    });
    expect(sendWorkEmailVerification).not.toHaveBeenCalled();
  });

  it('logs workflow sync failures structurally while preserving successful send response', async () => {
    const { supabase } = createSupabaseMock({
      existingProfile: null,
    });
    (createClient as any).mockResolvedValue(supabase);
    vi.mocked(sendWorkEmailVerification).mockResolvedValue();
    vi.mocked(syncWorkEmailVerificationRequested).mockRejectedValueOnce(
      new Error('workflow unavailable')
    );

    const response = await POST(makeRequest({ workEmail: 'new@acme.org' }), {} as any);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.workflow).toBeNull();
    expect(log.warn).toHaveBeenCalledWith('verification.work_email_send.workflow_sync_failed', {
      userId: 'user-1',
      orgId: null,
      error: 'workflow unavailable',
    });
  });

  it('logs unexpected route failures structurally while keeping the public response generic', async () => {
    (createClient as any).mockRejectedValueOnce(new Error('supabase unavailable'));

    const response = await POST(makeRequest({ workEmail: 'new@acme.org' }), {} as any);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Internal server error' });
    expect(log.error).toHaveBeenCalledWith('verification.work_email_send.failed', {
      error: 'supabase unavailable',
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

  it('returns 400 for malformed JSON before token generation or email delivery', async () => {
    const { supabase, upsertPayloads } = createSupabaseMock({
      existingProfile: null,
    });
    (createClient as any).mockResolvedValue(supabase);

    const response = await POST(makeRawRequest('{'), {} as any);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Invalid JSON body' });
    expect(upsertPayloads).toHaveLength(0);
    expect(sendWorkEmailVerification).not.toHaveBeenCalled();
  });
});
