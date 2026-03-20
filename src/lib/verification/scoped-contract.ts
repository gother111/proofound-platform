import type { VerificationKind, VerificationStatus } from '@/lib/contracts/canonical-domain';

export const CLAIM_TEMPLATE_VALUES = [
  'did_this_work',
  'contributed_this_part',
  'worked_here_in_role',
  'outcome_happened',
  'credential_valid',
  'skill_observed_in_context',
  'engagement_happened',
] as const;

export type ClaimTemplate = (typeof CLAIM_TEMPLATE_VALUES)[number];

export const TRUST_TYPE_VALUES = [
  'self_claimed',
  'peer_attested',
  'org_verified',
  'human_reviewed',
  'auto_checks_passed',
] as const;

export type ScopedTrustType = (typeof TRUST_TYPE_VALUES)[number];

export const FRESHNESS_STATE_VALUES = [
  'active',
  'stale',
  'expired',
  'contradicted',
  'revoked',
  'corrected',
] as const;

export type ScopedFreshnessState = (typeof FRESHNESS_STATE_VALUES)[number];

export type HonestDisplayLabel =
  | 'self-claimed'
  | 'artifact-backed'
  | 'credential-backed'
  | 'peer-attested'
  | 'org-verified'
  | 'human-reviewed'
  | 'auto-check-passed'
  | 'stale'
  | 'contradicted'
  | 'revoked'
  | 'corrected';

type ClaimTemplateSourceArgs = {
  subjectType: string | null | undefined;
  verificationKind?: VerificationKind | string | null;
  claimSnapshot?: Record<string, unknown> | null;
};

type TrustTypeArgs = {
  verificationKind: VerificationKind | string | null | undefined;
  verifierClass?: string | null;
  claimSnapshot?: Record<string, unknown> | null;
  riskSignals?: Record<string, unknown> | null;
};

export type ScopedSignalSummary = {
  verificationRecordId: string;
  subjectType: string;
  subjectId: string;
  claimTemplate: ClaimTemplate;
  claimLabel: string;
  trustType: ScopedTrustType;
  trustLabel: HonestDisplayLabel;
  supportLabel: HonestDisplayLabel;
  freshnessState: ScopedFreshnessState;
  freshnessLabel: string | null;
  verifiedAt: string | null;
  updatedAt: string | null;
  contradictedAt: string | null;
  revokedAt: string | null;
  correctedAt: string | null;
  verificationKind: VerificationKind | string | null;
};

function isClaimTemplate(value: unknown): value is ClaimTemplate {
  return typeof value === 'string' && CLAIM_TEMPLATE_VALUES.includes(value as ClaimTemplate);
}

export function getClaimTemplateLabel(template: ClaimTemplate): string {
  switch (template) {
    case 'did_this_work':
      return 'I did this work';
    case 'contributed_this_part':
      return 'I contributed this part';
    case 'worked_here_in_role':
      return 'I worked here in this role';
    case 'outcome_happened':
      return 'This outcome happened';
    case 'credential_valid':
      return 'This credential is valid';
    case 'skill_observed_in_context':
      return 'This skill was directly observed in this context';
    case 'engagement_happened':
      return 'This engagement happened';
  }
}

export function getTrustTypeLabel(trustType: ScopedTrustType): HonestDisplayLabel {
  switch (trustType) {
    case 'peer_attested':
      return 'peer-attested';
    case 'org_verified':
      return 'org-verified';
    case 'human_reviewed':
      return 'human-reviewed';
    case 'auto_checks_passed':
      return 'auto-check-passed';
    case 'self_claimed':
    default:
      return 'self-claimed';
  }
}

export function getFreshnessStateLabel(freshnessState: ScopedFreshnessState): string | null {
  switch (freshnessState) {
    case 'active':
      return null;
    case 'stale':
      return 'stale';
    case 'expired':
      return 'expired';
    case 'contradicted':
      return 'contradicted';
    case 'revoked':
      return 'revoked';
    case 'corrected':
      return 'corrected';
    default:
      return null;
  }
}

export function getSupportLabel(template: ClaimTemplate): HonestDisplayLabel {
  return template === 'credential_valid' ? 'credential-backed' : 'artifact-backed';
}

export function resolveClaimTemplate(args: ClaimTemplateSourceArgs): ClaimTemplate {
  const existingTemplate = args.claimSnapshot?.claimTemplate;
  if (isClaimTemplate(existingTemplate)) {
    return existingTemplate;
  }

  if (args.verificationKind === 'impact_attestation') {
    return 'outcome_happened';
  }

  if (args.subjectType === 'skill') {
    return 'skill_observed_in_context';
  }

  if (args.subjectType === 'experience' || args.subjectType === 'volunteering') {
    return 'worked_here_in_role';
  }

  if (args.subjectType === 'education') {
    return 'credential_valid';
  }

  if (args.subjectType === 'impact_story') {
    const roleScope =
      typeof args.claimSnapshot?.roleScope === 'string'
        ? args.claimSnapshot.roleScope
        : typeof args.claimSnapshot?.role_scope === 'string'
          ? args.claimSnapshot.role_scope
          : null;
    return roleScope === 'contributed' ? 'contributed_this_part' : 'did_this_work';
  }

  if (args.subjectType === 'project') {
    return 'did_this_work';
  }

  if (args.subjectType === 'engagement') {
    return 'engagement_happened';
  }

  return 'did_this_work';
}

export function withClaimTemplate<T extends Record<string, unknown>>(
  snapshot: T,
  fallbackTemplate: ClaimTemplate,
  fallbackLabel?: string
): T & { claimTemplate: ClaimTemplate; claimLabel: string } {
  const claimTemplate = resolveClaimTemplate({
    subjectType:
      typeof snapshot.subjectType === 'string'
        ? snapshot.subjectType
        : (snapshot.subject_type as string),
    verificationKind:
      typeof snapshot.verificationKind === 'string'
        ? (snapshot.verificationKind as string)
        : (snapshot.verification_kind as string),
    claimSnapshot: snapshot,
  });
  const finalTemplate = claimTemplate || fallbackTemplate;
  return {
    ...snapshot,
    claimTemplate: finalTemplate,
    claimLabel: fallbackLabel || getClaimTemplateLabel(finalTemplate),
  };
}

function isSameOrgManagerScope(args: TrustTypeArgs): boolean {
  if (args.verificationKind !== 'skill_attestation_manager') {
    return false;
  }

  const requesterDomain =
    typeof args.riskSignals?.requesterDomainSnapshot === 'string'
      ? args.riskSignals.requesterDomainSnapshot
      : typeof args.claimSnapshot?.context === 'object' &&
          args.claimSnapshot?.context !== null &&
          typeof (args.claimSnapshot.context as Record<string, unknown>).requesterDomain ===
            'string'
        ? ((args.claimSnapshot.context as Record<string, unknown>).requesterDomain as string)
        : null;
  const verifierDomain =
    typeof args.riskSignals?.verifierDomainSnapshot === 'string'
      ? args.riskSignals.verifierDomainSnapshot
      : typeof args.claimSnapshot?.context === 'object' &&
          args.claimSnapshot?.context !== null &&
          typeof (args.claimSnapshot.context as Record<string, unknown>).verifierDomain === 'string'
        ? ((args.claimSnapshot.context as Record<string, unknown>).verifierDomain as string)
        : null;

  if (requesterDomain && verifierDomain) {
    return requesterDomain === verifierDomain;
  }

  return args.verifierClass === 'authenticated_manager';
}

export function resolveTrustType(args: TrustTypeArgs): ScopedTrustType {
  switch (args.verificationKind) {
    case 'skill_attestation_peer':
    case 'impact_attestation':
      return 'peer_attested';
    case 'skill_attestation_manager':
      return isSameOrgManagerScope(args) ? 'org_verified' : 'peer_attested';
    case 'platform_manual_review':
    case 'org_registry_manual':
      return 'human_reviewed';
    case 'veriff_identity':
    case 'linkedin_identity':
    case 'linkedin_workplace':
    case 'work_email':
    case 'org_domain':
      return 'auto_checks_passed';
    default:
      return 'self_claimed';
  }
}

export function resolveFreshnessState(args: {
  effectiveState: VerificationStatus | 'none';
  isStale: boolean;
}): ScopedFreshnessState | null {
  if (args.effectiveState === 'verified') {
    return args.isStale ? 'stale' : 'active';
  }

  if (args.effectiveState === 'expired') {
    return 'expired';
  }

  if (args.effectiveState === 'contradicted' || args.effectiveState === 'disputed') {
    return 'contradicted';
  }

  if (args.effectiveState === 'revoked') {
    return 'revoked';
  }

  if (args.effectiveState === 'superseded' || args.effectiveState === 'downgraded') {
    return 'corrected';
  }

  return null;
}
