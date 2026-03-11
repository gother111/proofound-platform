import {
  resolveHasLinkedInIdentityVerification,
  resolveHasLinkedInWorkplaceVerification,
} from '@/lib/linkedin-verified';

export type VerificationTier = 'unverified' | 'workplace_verified' | 'identity_verified';

export type VerificationTierSource =
  | 'linkedin_identity'
  | 'linkedin_workplace'
  | 'work_email'
  | 'veriff'
  | 'unknown';

export type LinkedInVerificationLevel =
  | 'unverified'
  | 'pending'
  | 'workplace'
  | 'identity'
  | 'failed';

export type LegacyVerificationMethod = 'veriff' | 'work_email' | 'linkedin' | null;

export type LegacyVerificationStatus = 'unverified' | 'pending' | 'verified' | 'failed' | null;

function normalizeLegacyLinkedInStatus(value: unknown): LegacyVerificationStatus {
  if (value === 'unverified' || value === 'pending' || value === 'verified' || value === 'failed') {
    return value;
  }
  return null;
}

export function resolveLinkedInVerificationLevel(input: {
  linkedinVerificationStatus?: unknown;
  linkedinVerificationData?: unknown;
}): LinkedInVerificationLevel {
  const legacyStatus = normalizeLegacyLinkedInStatus(input.linkedinVerificationStatus);
  const hasIdentityVerification = resolveHasLinkedInIdentityVerification(
    input.linkedinVerificationData
  );
  const hasWorkplaceVerification = resolveHasLinkedInWorkplaceVerification(
    input.linkedinVerificationData
  );

  if (hasIdentityVerification) return 'identity';
  if (hasWorkplaceVerification) return 'workplace';

  if (legacyStatus === 'failed') return 'failed';
  if (legacyStatus === 'pending') return 'pending';
  if (legacyStatus === 'verified') {
    // Legacy rows that were approved without official identity label are workplace-tier by default.
    return 'workplace';
  }

  return 'unverified';
}

export function resolveCanonicalVerificationTier(input: {
  currentTier?: unknown;
  currentTierSource?: unknown;
  verificationMethod?: unknown;
  verificationStatus?: unknown;
  verified?: unknown;
  linkedinVerificationStatus?: unknown;
  linkedinVerificationData?: unknown;
  workEmailCurrentlyVerified?: boolean;
}): {
  verificationTier: VerificationTier;
  verificationTierSource: VerificationTierSource;
  linkedinVerificationLevel: LinkedInVerificationLevel;
} {
  const linkedinVerificationLevel = resolveLinkedInVerificationLevel({
    linkedinVerificationStatus: input.linkedinVerificationStatus,
    linkedinVerificationData: input.linkedinVerificationData,
  });

  const currentTier =
    input.currentTier === 'identity_verified' ||
    input.currentTier === 'workplace_verified' ||
    input.currentTier === 'unverified'
      ? (input.currentTier as VerificationTier)
      : null;

  const verificationMethod =
    input.verificationMethod === 'veriff' ||
    input.verificationMethod === 'work_email' ||
    input.verificationMethod === 'linkedin'
      ? (input.verificationMethod as LegacyVerificationMethod)
      : null;

  const verificationStatus =
    input.verificationStatus === 'verified' ||
    input.verificationStatus === 'pending' ||
    input.verificationStatus === 'failed' ||
    input.verificationStatus === 'unverified'
      ? (input.verificationStatus as LegacyVerificationStatus)
      : null;

  const legacyVeriffIdentity =
    verificationMethod === 'veriff' &&
    (verificationStatus === 'verified' || input.verified === true);

  if (legacyVeriffIdentity || linkedinVerificationLevel === 'identity') {
    const source: VerificationTierSource = legacyVeriffIdentity ? 'veriff' : 'linkedin_identity';

    return {
      verificationTier: 'identity_verified',
      verificationTierSource: source,
      linkedinVerificationLevel,
    };
  }

  const workEmailCurrentlyVerified = Boolean(input.workEmailCurrentlyVerified);

  if (workEmailCurrentlyVerified) {
    return {
      verificationTier: 'workplace_verified',
      verificationTierSource: 'work_email',
      linkedinVerificationLevel,
    };
  }

  if (linkedinVerificationLevel === 'workplace' || currentTier === 'workplace_verified') {
    return {
      verificationTier: 'workplace_verified',
      verificationTierSource: 'linkedin_workplace',
      linkedinVerificationLevel,
    };
  }

  return {
    verificationTier: 'unverified',
    verificationTierSource: 'unknown',
    linkedinVerificationLevel,
  };
}

export function identityMethodFromTierSource(
  source: VerificationTierSource
): LegacyVerificationMethod {
  if (source === 'veriff') return 'veriff';
  if (source === 'linkedin_identity') return 'linkedin';
  return null;
}
