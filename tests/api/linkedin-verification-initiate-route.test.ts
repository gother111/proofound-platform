import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock('@/lib/linkedin', () => ({
  fetchLinkedInProfile: vi.fn(),
  constructLinkedInProfileUrl: vi.fn(),
}));

vi.mock('@/lib/linkedin-scraper', () => ({
  checkLinkedInVerification: vi.fn(),
}));

vi.mock('@/lib/linkedin-enrichment', () => ({
  enrichLinkedInProfile: vi.fn(),
  combineVerificationData: vi.fn(),
}));

vi.mock('@/lib/linkedin-verified', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/linkedin-verified')>();

  return {
    ...actual,
    fetchLinkedInIdentityMe: vi.fn(),
    fetchLinkedInVerificationReport: vi.fn(),
    LinkedInRestApiError: class extends Error {
      status: number;

      constructor(status = 500) {
        super('LinkedIn error');
        this.status = status;
      }
    },
  };
});

vi.mock('@/lib/email', () => ({
  sendLinkedInVerificationPendingReviewEmail: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { POST } from '@/app/api/verification/linkedin/initiate/route';
import { fetchLinkedInIdentityMe, fetchLinkedInVerificationReport } from '@/lib/linkedin-verified';
import { fetchLinkedInProfile, constructLinkedInProfileUrl } from '@/lib/linkedin';
import { checkLinkedInVerification } from '@/lib/linkedin-scraper';
import { sendLinkedInVerificationPendingReviewEmail } from '@/lib/email';

function buildRequest() {
  return new NextRequest('https://proofound.io/api/verification/linkedin/initiate', {
    method: 'POST',
  });
}

function mockIntegrationQuery() {
  (db.select as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([
          {
            provider: 'linkedin',
            accessToken: 'linkedin-access-token',
            tokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
          },
        ]),
      }),
    }),
  });
}

function buildSupabaseMock() {
  const updateEqSpy = vi.fn().mockResolvedValue({ error: null });
  const updateSpy = vi.fn().mockReturnValue({
    eq: updateEqSpy,
  });

  const maybeSingleSpy = vi.fn().mockResolvedValue({
    data: {
      display_name: 'Candidate Example',
    },
    error: null,
  });

  const fromSpy = vi.fn((table: string) => {
    if (table === 'individual_profiles') {
      return {
        update: updateSpy,
      };
    }

    if (table === 'profiles') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: maybeSingleSpy,
          }),
        }),
      };
    }

    throw new Error(`Unexpected table: ${table}`);
  });

  return {
    supabase: {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-123',
              email: 'candidate@example.com',
              user_metadata: { full_name: 'Candidate Example' },
            },
          },
          error: null,
        }),
      },
      from: fromSpy,
    },
    updateSpy,
  };
}

describe('POST /api/verification/linkedin/initiate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIntegrationQuery();
  });

  it('stores linkedin identity as a compatibility signal without global trust inflation', async () => {
    const { supabase, updateSpy } = buildSupabaseMock();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(supabase as any);

    (fetchLinkedInVerificationReport as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      raw: { verifications: [{ verificationType: 'IDENTITY' }] },
      verifications: ['IDENTITY'],
      hasIdentityVerification: true,
    });
    (fetchLinkedInIdentityMe as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      raw: { profileUrl: 'https://www.linkedin.com/in/candidate-example' },
      profileUrl: 'https://www.linkedin.com/in/candidate-example',
      publicIdentifier: 'candidate-example',
      memberUrn: 'urn:li:member:1',
    });

    const response = await POST(buildRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.linkedinVerificationStatus).toBe('verified');
    expect(body.linkedinVerificationLevel).toBe('identity');
    expect(body.identityGranted).toBe(false);
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        linkedin_verification_status: 'verified',
        linkedin_verification_level: 'identity',
        linkedin_verified_at: expect.any(String),
      })
    );
    expect(checkLinkedInVerification).not.toHaveBeenCalled();
    expect(sendLinkedInVerificationPendingReviewEmail).not.toHaveBeenCalled();
  });

  it('keeps pending review and notifies admins when identity signal is missing and profile URL is unavailable', async () => {
    const { supabase, updateSpy } = buildSupabaseMock();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(supabase as any);

    (fetchLinkedInVerificationReport as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      raw: { verifications: [] },
      verifications: [],
      hasIdentityVerification: false,
      hasWorkplaceVerification: false,
    });
    (fetchLinkedInIdentityMe as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      raw: {},
      profileUrl: null,
      publicIdentifier: null,
      memberUrn: null,
    });
    (fetchLinkedInProfile as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('profile fetch failed')
    );
    (constructLinkedInProfileUrl as unknown as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const response = await POST(buildRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.linkedinVerificationStatus).toBe('pending');
    expect(body.linkedinVerificationLevel).toBe('pending');
    expect(body.identityGranted).toBe(false);
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        linkedin_verification_status: 'pending',
        linkedin_verification_level: 'pending',
        linkedin_verified_at: null,
      })
    );
    expect(body.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'legacy_profile_fetch_failed' }),
        expect.objectContaining({ code: 'profile_url_unavailable' }),
      ])
    );
    expect(sendLinkedInVerificationPendingReviewEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        candidateName: 'Candidate Example',
        confidence: 0,
        hasIdentityVerification: false,
        hasWorkplaceVerification: false,
        linkedinProfileUrl: null,
      })
    );
  });

  it('stores linkedin workplace as a compatibility signal without global trust inflation', async () => {
    const { supabase, updateSpy } = buildSupabaseMock();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(supabase as any);

    (fetchLinkedInVerificationReport as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      raw: { verifications: ['WORKPLACE'] },
      verifications: ['WORKPLACE'],
      hasIdentityVerification: false,
      hasWorkplaceVerification: true,
    });
    (fetchLinkedInIdentityMe as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      raw: { basicInfo: { profileUrl: 'https://www.linkedin.com/profile-thirdparty-redirect/x' } },
      profileUrl: 'https://www.linkedin.com/profile-thirdparty-redirect/x',
      publicIdentifier: null,
      memberUrn: 'urn:li:member:2',
    });

    const response = await POST(buildRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.linkedinVerificationStatus).toBe('verified');
    expect(body.linkedinVerificationLevel).toBe('workplace');
    expect(body.identityGranted).toBe(false);
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        linkedin_verification_status: 'verified',
        linkedin_verification_level: 'workplace',
        linkedin_verified_at: expect.any(String),
      })
    );
    expect(sendLinkedInVerificationPendingReviewEmail).not.toHaveBeenCalled();
    expect(checkLinkedInVerification).not.toHaveBeenCalled();
  });
});
