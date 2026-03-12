import { describe, expect, it } from 'vitest';

import {
  resolveCanonicalVerificationTier,
  resolveLinkedInVerificationLevel,
} from '@/lib/verification/tier';

describe('verification tier resolution', () => {
  it('keeps LinkedIn IDENTITY as a raw level without granting a tier', () => {
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

    expect(result.verificationTier).toBe('unverified');
    expect(result.verificationTierSource).toBe('unknown');
    expect(result.linkedinVerificationLevel).toBe('identity');
  });

  it('keeps WORKPLACE + active work email as compatibility only', () => {
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

    expect(result.verificationTier).toBe('unverified');
    expect(result.verificationTierSource).toBe('unknown');
    expect(result.linkedinVerificationLevel).toBe('workplace');
  });

  it('keeps WORKPLACE-only LinkedIn verification as a raw level without a tier', () => {
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

    expect(result.verificationTier).toBe('unverified');
    expect(result.verificationTierSource).toBe('unknown');
    expect(result.linkedinVerificationLevel).toBe('workplace');
  });

  it('keeps legacy Veriff verification as compatibility metadata only', () => {
    const result = resolveCanonicalVerificationTier({
      verificationMethod: 'veriff',
      verificationStatus: 'verified',
      verified: true,
      linkedinVerificationStatus: 'unverified',
      linkedinVerificationData: null,
      workEmailCurrentlyVerified: false,
    });

    expect(result.verificationTier).toBe('unverified');
    expect(result.verificationTierSource).toBe('unknown');
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
