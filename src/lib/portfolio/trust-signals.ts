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
  badges: Array<{
    key: string;
    label: string;
    state: string;
  }>;
  activeIssues: Array<{
    slot: string;
    label: string;
    issueKey: string;
  }>;
};

export function buildTrustSignals(
  _profile: PortfolioProfile | null,
  counts: TrustCounts = {},
  policySummary?: VerificationPolicySummary | null
): TrustSignals {
  const proofsCount = counts.proofsCount ?? 0;
  const acceptedVerificationsCount = counts.acceptedVerificationsCount ?? 0;

  return {
    identity: {
      verified: false,
      method: null,
      verifiedAt: null,
      label: null,
    },
    workEmail: {
      verified: false,
      label: null,
    },
    linkedin: {
      hasIdentityVerification: false,
      confidence: undefined,
      hasVerificationBadge: false,
      verificationStatus: null,
      verifiedAt: null,
    },
    proofs: {
      count: proofsCount,
    },
    verifications: {
      count: acceptedVerificationsCount,
    },
    badges: (policySummary?.publicBadges ?? []).map((badge) => ({
      key: badge.key,
      label: badge.label,
      state: badge.state,
    })),
    activeIssues: (policySummary?.activeIssues ?? []).map((issue) => ({
      slot: issue.slot,
      label: issue.label,
      issueKey: issue.issueKey,
    })),
  };
}

export default buildTrustSignals;
