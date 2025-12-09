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
  };
  workEmail: {
    verified: boolean;
  };
  linkedin: {
    confidence?: number;
    hasVerificationBadge?: boolean;
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

export function buildTrustSignals(
  profile: PortfolioProfile | null,
  counts: TrustCounts = {}
): TrustSignals {
  const individual = pickIndividual(profile?.individual_profiles);
  const identityVerified =
    individual?.verification_status === 'verified' || individual?.verified === true;

  const proofsCount = counts.proofsCount ?? 0;
  const acceptedVerificationsCount = counts.acceptedVerificationsCount ?? 0;
  const attestationCount = counts.attestationCount ?? 0;

  return {
    identity: {
      verified: identityVerified,
      method: individual?.verification_method ?? null,
      verifiedAt: individual?.verified_at ?? null,
    },
    workEmail: {
      verified: Boolean(individual?.work_email_verified),
    },
    linkedin: {
      confidence: parseLinkedInConfidence(
        (individual?.linkedin_verification_data as Record<string, unknown> | null | undefined) ??
          undefined
      ),
      hasVerificationBadge: Boolean(
        (individual?.linkedin_verification_data as any)?.hasVerificationBadge
      ),
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
  };
}

export default buildTrustSignals;
