import type { VerificationPolicySummary } from '@/lib/verification/policy';

export type PortfolioProfile = {
  id?: string | null;
  handle?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  individual_profiles?:
    | {
        headline?: string | null;
        bio?: string | null;
        tagline?: string | null;
        verification_status?: string | null;
        verification_method?: string | null;
        verified_at?: string | null;
        work_email?: string | null;
        work_email_verified?: boolean | null;
        linkedin_verification_status?: string | null;
        linkedin_verified_at?: string | null;
        linkedin_verification_data?: Record<string, unknown> | null;
        verified?: boolean | null;
      }
    | Array<{
        headline?: string | null;
        bio?: string | null;
        tagline?: string | null;
        verification_status?: string | null;
        verification_method?: string | null;
        verified_at?: string | null;
        work_email?: string | null;
        work_email_verified?: boolean | null;
        linkedin_verification_status?: string | null;
        linkedin_verified_at?: string | null;
        linkedin_verification_data?: Record<string, unknown> | null;
        verified?: boolean | null;
      }>
    | null;
};

export type TrustCounts = {
  proofsCount?: number | null;
  acceptedVerificationsCount?: number | null;
  attestationCount?: number | null;
};

export type TrustSignals = {
  identity: {
    verified: boolean;
    method?: string | null;
    verifiedAt?: string | null;
    label?: string | null;
  };
  workEmail: {
    verified: boolean;
    label?: string | null;
  };
  linkedin: {
    confidence?: number;
    hasIdentityVerification?: boolean;
    hasVerificationBadge?: boolean;
    verificationStatus?: string | null;
    verifiedAt?: string | null;
  };
  proofs: {
    count: number;
  };
  verifications: {
    count: number;
  };
  attestations: {
    count: number;
  };
  badges: Array<{
    key: string;
    label: string;
    meaning: string;
    doesNotMean: string;
  }>;
  activeIssues: Array<{
    slot: string;
    label: string;
    issueKey: string;
  }>;
};

function pickIndividual(profile: PortfolioProfile['individual_profiles']) {
  if (!profile) return null;
  if (Array.isArray(profile)) return profile[0] ?? null;
  return profile;
}

function parseLinkedInConfidence(data: Record<string, unknown> | null | undefined) {
  if (!data || typeof data !== 'object') return undefined;
  const automated = (data as any).automatedCheck;
  const directConfidence = (data as any).confidence;
  if (typeof directConfidence === 'number') return directConfidence;
  if (automated && typeof automated.confidence === 'number') return automated.confidence;
  return undefined;
}

function resolveHasLinkedInIdentityVerification(
  data: Record<string, unknown> | null | undefined
): boolean {
  if (!data || typeof data !== 'object') return false;
  if (data.hasIdentityVerification === true) return true;

  const apiReport =
    data.apiReport && typeof data.apiReport === 'object'
      ? (data.apiReport as Record<string, unknown>)
      : null;
  if (apiReport?.hasIdentityVerification === true) return true;

  const verifications = Array.isArray(apiReport?.verifications)
    ? apiReport?.verifications
    : Array.isArray(data.verifications)
      ? data.verifications
      : [];

  return verifications.some(
    (item) => typeof item === 'string' && item.toUpperCase().includes('IDENTITY')
  );
}

export function buildTrustSignals(
  profile: PortfolioProfile | null,
  counts: TrustCounts = {},
  policySummary?: VerificationPolicySummary | null
): TrustSignals {
  const individual = pickIndividual(profile?.individual_profiles);
  const linkedInVerificationData =
    (individual?.linkedin_verification_data as Record<string, unknown> | null | undefined) ??
    undefined;
  const hasLinkedInIdentityVerification =
    resolveHasLinkedInIdentityVerification(linkedInVerificationData);
  const identityVerified =
    policySummary?.compatibility.verified ??
    (individual?.verification_status === 'verified' || individual?.verified === true);

  const proofsCount = counts.proofsCount ?? 0;
  const acceptedVerificationsCount = counts.acceptedVerificationsCount ?? 0;
  const attestationCount = counts.attestationCount ?? 0;

  return {
    identity: {
      verified: identityVerified,
      method:
        policySummary?.compatibility.verificationMethod ?? individual?.verification_method ?? null,
      verifiedAt: individual?.verified_at ?? null,
      label: policySummary?.slots.identity.publicLabel ?? null,
    },
    workEmail: {
      verified:
        policySummary?.compatibility.workEmailVerified ?? Boolean(individual?.work_email_verified),
      label: policySummary?.slots.workplace.publicLabel ?? null,
    },
    linkedin: {
      hasIdentityVerification: hasLinkedInIdentityVerification,
      confidence: parseLinkedInConfidence(linkedInVerificationData),
      hasVerificationBadge: Boolean(
        hasLinkedInIdentityVerification ||
          (individual?.linkedin_verification_data as any)?.hasVerificationBadge
      ),
      verificationStatus: individual?.linkedin_verification_status ?? null,
      verifiedAt: individual?.linkedin_verified_at ?? null,
    },
    proofs: {
      count: proofsCount,
    },
    verifications: {
      count: acceptedVerificationsCount,
    },
    attestations: {
      count: attestationCount,
    },
    badges: (policySummary?.publicBadges ?? []).map((badge) => ({
      key: badge.key,
      label: badge.label,
      meaning: badge.meaning,
      doesNotMean: badge.doesNotMean,
    })),
    activeIssues: (policySummary?.activeIssues ?? []).map((issue) => ({
      slot: issue.slot,
      label: issue.label,
      issueKey: issue.issueKey,
    })),
  };
}

export default buildTrustSignals;
