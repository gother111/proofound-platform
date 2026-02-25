import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/email/sender', () => ({
  sendEmail: vi.fn(),
}));

vi.mock('@/lib/analytics/events', () => ({
  emitVerificationRequestedAsync: vi.fn(),
}));

import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
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

function createSupabaseMock(insertResult: { id: string }) {
  const inserts: any[] = [];

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
    insert: vi.fn().mockImplementation((payload: any) => {
      inserts.push(payload);
      return {
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              ...insertResult,
              ...payload,
            },
            error: null,
          }),
        }),
      };
    }),
  };

  const supabase = {
    from: vi.fn((table: string) => {
      if (table === 'skills') return skillsQuery;
      if (table === 'profiles') return profilesQuery;
      if (table === 'skill_verification_requests') return verificationRequestsQuery;
      throw new Error(`Unexpected table ${table}`);
    }),
  };

  return { supabase, inserts };
}

describe('POST /api/expertise/user-skills/[id]/verification-request', () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    vi.clearAllMocks();

    (requireAuth as any).mockResolvedValue({
      id: 'user-1',
      email: 'alice@proofound.io',
    });
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
  });

  it('normalizes verifier email and sends token link using configured site url', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io';
    process.env.NEXT_PUBLIC_APP_URL = '';

    const { supabase, inserts } = createSupabaseMock({ id: 'req-1' });
    (createClient as any).mockResolvedValue(supabase);
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

  it('returns email_sent=false while keeping request persisted when email fails', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = '';
    process.env.NEXT_PUBLIC_APP_URL = '';

    const { supabase, inserts } = createSupabaseMock({ id: 'req-2' });
    (createClient as any).mockResolvedValue(supabase);
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
    expect(body.request.id).toBe('req-2');

    expect(inserts[0].verifier_email).toBe('boss@company.com');

    const sentEmailPayload = (sendEmail as any).mock.calls[0][0];
    expect(sentEmailPayload.html).toContain('https://staging.proofound.io/verify/');
  });
});
