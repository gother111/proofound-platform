import { describe, expect, it } from 'vitest';

import {
  resolveCanonicalVerificationTier,
  resolveLinkedInVerificationLevel,
} from '@/lib/verification/tier';

describe('verification tier resolution', () => {
  it('maps LinkedIn IDENTITY to identity tier', () => {
    const result = resolveCanonicalVerificationTier({
      verificationMethod: null,
      verificationStatus: 'unverified',
      verified: false,
      linkedinVerificationStatus: 'verified',
      linkedinVerificationData: {
        apiReport: { verifications: ['IDENTITY'] },
      },
      workEmailCurrentlyVerified: false,
    });

    expect(result.verificationTier).toBe('identity_verified');
    expect(result.verificationTierSource).toBe('linkedin_identity');
    expect(result.linkedinVerificationLevel).toBe('identity');
  });

  it('maps WORKPLACE + active work email to workplace tier with work-email precedence', () => {
    const result = resolveCanonicalVerificationTier({
      verificationMethod: 'work_email',
      verificationStatus: 'verified',
      verified: true,
      linkedinVerificationStatus: 'verified',
      linkedinVerificationData: {
        apiReport: { verifications: ['WORKPLACE'] },
      },
      workEmailCurrentlyVerified: true,
    });

    expect(result.verificationTier).toBe('workplace_verified');
    expect(result.verificationTierSource).toBe('work_email');
    expect(result.linkedinVerificationLevel).toBe('workplace');
  });

  it('maps WORKPLACE-only LinkedIn verification to workplace tier', () => {
    const result = resolveCanonicalVerificationTier({
      verificationMethod: null,
      verificationStatus: 'unverified',
      verified: false,
      linkedinVerificationStatus: 'verified',
      linkedinVerificationData: {
        apiReport: { verifications: ['WORKPLACE'] },
      },
      workEmailCurrentlyVerified: false,
    });

    expect(result.verificationTier).toBe('workplace_verified');
    expect(result.verificationTierSource).toBe('linkedin_workplace');
    expect(result.linkedinVerificationLevel).toBe('workplace');
  });

  it('keeps legacy Veriff verification as identity tier', () => {
    const result = resolveCanonicalVerificationTier({
      verificationMethod: 'veriff',
      verificationStatus: 'verified',
      verified: true,
      linkedinVerificationStatus: 'unverified',
      linkedinVerificationData: null,
      workEmailCurrentlyVerified: false,
    });

    expect(result.verificationTier).toBe('identity_verified');
    expect(result.verificationTierSource).toBe('veriff');
    expect(result.linkedinVerificationLevel).toBe('unverified');
  });

  it('does not trust stored identity tier without veriff or linkedin identity evidence', () => {
    const result = resolveCanonicalVerificationTier({
      currentTier: 'identity_verified',
      currentTierSource: 'veriff',
      verificationMethod: null,
      verificationStatus: 'unverified',
      verified: false,
      linkedinVerificationStatus: 'unverified',
      linkedinVerificationData: null,
      workEmailCurrentlyVerified: false,
    });

    expect(result.verificationTier).toBe('unverified');
    expect(result.verificationTierSource).toBe('unknown');
    expect(result.linkedinVerificationLevel).toBe('unverified');
  });

  it('resolves pending LinkedIn level when no official signals exist', () => {
    const level = resolveLinkedInVerificationLevel({
      linkedinVerificationStatus: 'pending',
      linkedinVerificationData: {
        apiReport: { verifications: [] },
      },
    });

    expect(level).toBe('pending');
  });
});
