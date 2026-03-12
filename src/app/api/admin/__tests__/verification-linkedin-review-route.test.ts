import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST } from '../verification/linkedin/[userId]/review/route';
import { requirePlatformAdminJson } from '@/lib/api/route-helpers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendVerificationApprovedEmail } from '@/lib/email';

vi.mock('@/lib/api/route-helpers', () => ({
  requirePlatformAdminJson: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/email', () => ({
  sendVerificationApprovedEmail: vi.fn(),
  sendVerificationRejectedEmail: vi.fn(),
}));

function buildRequest(body: Record<string, unknown>) {
  return new NextRequest('https://example.com/api/admin/verification/linkedin/user-1/review', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

function buildSupabaseMock() {
  const updateSpy = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  });

  const fromSpy = vi.fn((table: string) => {
    if (table === 'individual_profiles') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                linkedin_verification_data: {
                  hasIdentityVerification: true,
                  hasWorkplaceVerification: false,
                  automatedCheck: { confidence: 88 },
                },
                verification_status: 'pending',
                verification_method: null,
                verification_tier: 'unverified',
                verification_tier_source: 'unknown',
                verified: false,
                verified_at: null,
                linkedin_verification_status: 'pending',
                work_email_verified: false,
                work_email_verified_at: null,
                work_email_reverify_due_at: null,
              },
              error: null,
            }),
          }),
        }),
        update: updateSpy,
      };
    }

    if (table === 'profiles') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { display_name: 'Candidate Display Name' },
              error: null,
            }),
          }),
        }),
      };
    }

    return {};
  });

  return {
    supabase: { from: fromSpy },
    updateSpy,
  };
}

describe('admin linkedin review route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns guard response when admin guard fails', async () => {
    vi.mocked(requirePlatformAdminJson).mockResolvedValue(
      NextResponse.json({ error: 'Forbidden', details: null }, { status: 403 })
    );

    const response = await POST(buildRequest({ decision: 'approved' }), {
      params: Promise.resolve({ userId: 'user-1' }),
    });

    expect(response.status).toBe(403);
    expect(createClient).not.toHaveBeenCalled();
  });

  it('approves verification and keeps linkedin identity as a compatibility signal', async () => {
    vi.mocked(requirePlatformAdminJson).mockResolvedValue({
      adminLevel: 'platform_admin',
      userId: 'admin-1',
      email: 'admin@example.com',
      platformRole: 'platform_admin',
    });

    const { supabase, updateSpy } = buildSupabaseMock();
    vi.mocked(createClient).mockResolvedValue(supabase as any);
    vi.mocked(createAdminClient).mockReturnValue({
      auth: {
        admin: {
          getUserById: vi.fn().mockResolvedValue({
            data: {
              user: {
                email: 'candidate@example.com',
                user_metadata: { full_name: 'Candidate Full Name' },
              },
            },
          }),
        },
      },
    } as any);

    const response = await POST(
      buildRequest({
        decision: 'approved',
        notes: 'Looks good',
      }),
      { params: Promise.resolve({ userId: 'user-1' }) }
    );

    expect(response.status).toBe(200);
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        linkedin_verification_status: 'verified',
        linkedin_verification_level: 'identity',
        verification_tier: 'unverified',
        verification_tier_source: 'unknown',
        verification_status: 'unverified',
        verification_method: null,
        verified: false,
      })
    );
    expect(sendVerificationApprovedEmail).toHaveBeenCalledWith(
      'candidate@example.com',
      'Candidate Display Name',
      'linkedin',
      'user-1'
    );
  });

  it('does not grant identity by default when LinkedIn identity signal is missing', async () => {
    vi.mocked(requirePlatformAdminJson).mockResolvedValue({
      adminLevel: 'platform_admin',
      userId: 'admin-1',
      email: 'admin@example.com',
      platformRole: 'platform_admin',
    });

    const updateSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const fromSpy = vi.fn((table: string) => {
      if (table === 'individual_profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  linkedin_verification_data: {
                    hasIdentityVerification: false,
                    hasWorkplaceVerification: false,
                    automatedCheck: { confidence: 82 },
                  },
                  verification_status: 'pending',
                  verification_method: null,
                  verification_tier: 'unverified',
                  verification_tier_source: 'unknown',
                  verified: false,
                  verified_at: null,
                  linkedin_verification_status: 'pending',
                  work_email_verified: false,
                  work_email_verified_at: null,
                  work_email_reverify_due_at: null,
                },
                error: null,
              }),
            }),
          }),
          update: updateSpy,
        };
      }

      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { display_name: 'Candidate Display Name' },
                error: null,
              }),
            }),
          }),
        };
      }

      return {};
    });

    vi.mocked(createClient).mockResolvedValue({ from: fromSpy } as any);
    vi.mocked(createAdminClient).mockReturnValue({
      auth: {
        admin: {
          getUserById: vi.fn().mockResolvedValue({
            data: {
              user: {
                email: 'candidate@example.com',
                user_metadata: { full_name: 'Candidate Full Name' },
              },
            },
          }),
        },
      },
    } as any);

    const response = await POST(buildRequest({ decision: 'approved' }), {
      params: Promise.resolve({ userId: 'user-1' }),
    });

    expect(response.status).toBe(200);
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        linkedin_verification_status: 'verified',
        linkedin_verification_level: 'workplace',
        verification_tier: 'unverified',
        verification_tier_source: 'unknown',
        verification_status: 'unverified',
        verification_method: null,
        verified: false,
      })
    );
    expect(updateSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ verification_method: 'linkedin' })
    );
  });

  it('keeps admin identity override narrow and compatibility-only', async () => {
    vi.mocked(requirePlatformAdminJson).mockResolvedValue({
      adminLevel: 'platform_admin',
      userId: 'admin-1',
      email: 'admin@example.com',
      platformRole: 'platform_admin',
    });

    const updateSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const fromSpy = vi.fn((table: string) => {
      if (table === 'individual_profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  linkedin_verification_data: {
                    hasIdentityVerification: false,
                    hasWorkplaceVerification: false,
                    automatedCheck: { confidence: 77 },
                  },
                  verification_status: 'pending',
                  verification_method: null,
                  verification_tier: 'unverified',
                  verification_tier_source: 'unknown',
                  verified: false,
                  verified_at: null,
                  linkedin_verification_status: 'pending',
                  work_email_verified: false,
                  work_email_verified_at: null,
                  work_email_reverify_due_at: null,
                },
                error: null,
              }),
            }),
          }),
          update: updateSpy,
        };
      }

      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { display_name: 'Candidate Display Name' },
                error: null,
              }),
            }),
          }),
        };
      }

      return {};
    });

    vi.mocked(createClient).mockResolvedValue({ from: fromSpy } as any);
    vi.mocked(createAdminClient).mockReturnValue({
      auth: {
        admin: {
          getUserById: vi.fn().mockResolvedValue({
            data: {
              user: {
                email: 'candidate@example.com',
                user_metadata: { full_name: 'Candidate Full Name' },
              },
            },
          }),
        },
      },
    } as any);

    const response = await POST(buildRequest({ decision: 'approved', grantIdentity: true }), {
      params: Promise.resolve({ userId: 'user-1' }),
    });

    expect(response.status).toBe(200);
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        linkedin_verification_status: 'verified',
        linkedin_verification_level: 'identity',
        verification_tier: 'unverified',
        verification_tier_source: 'unknown',
        verification_status: 'unverified',
        verification_method: null,
        verified: false,
      })
    );
  });
});
