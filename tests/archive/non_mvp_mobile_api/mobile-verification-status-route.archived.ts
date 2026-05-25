import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/api/mobile/auth', () => ({
  requireMobileAuth: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
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

import { db } from '@/db';
import { GET } from '@/archive/non_launch_api/app/api/mobile/v1/verification/status/route';
import { requireMobileAuth } from '@/lib/api/mobile/auth';

function makeRequest() {
  return new NextRequest('http://localhost/api/mobile/v1/verification/status', {
    method: 'GET',
  });
}

describe('mobile verification status route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns auth response when bearer token is missing/invalid', async () => {
    const unauthorized = NextResponse.json(
      {
        success: false,
        error: { code: 'unauthorized', message: 'Missing bearer token' },
      },
      { status: 401 }
    );

    (requireMobileAuth as any).mockResolvedValue(unauthorized);

    const response = await GET(makeRequest());
    expect(response.status).toBe(401);
  });

  it('keeps linkedin identity as compatibility-only on mobile', async () => {
    (requireMobileAuth as any).mockResolvedValue({ user: { id: 'user-1' } });
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            {
              verified: false,
              verificationMethod: null,
              verificationStatus: 'unverified',
              verificationTier: 'unverified',
              verificationTierSource: 'unknown',
              verifiedAt: null,
              linkedinVerificationStatus: 'verified',
              linkedinVerificationLevel: null,
              linkedinVerifiedAt: new Date('2026-03-10T00:00:00.000Z'),
              linkedinVerificationData: { hasIdentityVerification: true },
              workEmail: null,
              workEmailVerified: false,
              workEmailVerifiedAt: null,
              workEmailReverifyDueAt: null,
              workEmailTokenHash: null,
              workEmailTokenExpires: null,
            },
          ]),
        }),
      }),
    });

    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.channels.linkedin.state).toBe('verified');
    expect(body.data.channels.linkedin.signalLevel).toBe('identity');
    expect(body.data.channels.linkedin.hasIdentitySignal).toBe(true);
    expect(body.data).not.toHaveProperty('linkedinVerificationLevel');
    expect(body.data).not.toHaveProperty('verificationTier');
    expect(body.data.summary.publicBadges).toEqual([]);
  });
});
