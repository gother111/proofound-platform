import { and, desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { verificationRecords } from '@/db/schema';
import type {
  VerificationKind,
  VerificationSlot,
  VerificationStatus,
  VerifierClass,
  IntegrityStatus,
  DisputeState,
} from '@/lib/contracts/canonical-domain';

export const BADGE_SEMANTICS_VERSION = 2;

type VerificationRecordRow = typeof verificationRecords.$inferSelect;

type LegacyProfileCompatInput = {
  verified?: boolean | null;
  verificationMethod?: 'veriff' | 'work_email' | 'linkedin' | null;
  verificationStatus?: 'unverified' | 'pending' | 'verified' | 'failed' | null;
  verificationTier?: 'unverified' | 'workplace_verified' | 'identity_verified' | null;
  verificationTierSource?:
    | 'linkedin_identity'
    | 'linkedin_workplace'
    | 'work_email'
    | 'veriff'
    | 'unknown'
    | null;
  workEmailCurrentlyVerified?: boolean;
  linkedinVerificationStatus?: 'unverified' | 'pending' | 'verified' | 'failed' | null;
  linkedinHasIdentityVerification?: boolean;
};

type LegacyOrgCompatInput = {
  trustStatus?: 'unverified' | 'pending' | 'domain_verified' | 'platform_reviewed' | null;
  verified?: boolean | null;
};

export type VerificationIssueKey = 'expired' | 'under_review' | 'changed' | 'revoked' | 'pending';

export type VerificationSurface = 'public_portfolio' | 'org_review' | 'internal';

export type VerificationBadgeSummary = {
  key:
    | 'identity_checked'
    | 'workplace_confirmed'
    | 'evidence_attested'
    | 'platform_reviewed'
    | 'domain_confirmed'
    | 'verification_expired'
    | 'verification_under_review'
    | 'verification_changed'
    | 'verification_revoked'
    | 'trust_review_pending'
    | 'trust_review_changed'
    | 'trust_review_revoked';
  label: string;
  meaning: string;
  doesNotMean: string;
  state: VerificationStatus | 'none';
  surface: VerificationSurface;
  slot: VerificationSlot | 'evidence.attestation';
  kind: VerificationKind | 'mixed';
  verifierClass: VerifierClass | null;
  verifiedAt: string | null;
  expiresAt: string | null;
  issueReason: string | null;
};

export type VerificationSlotSummary = {
  slot: VerificationSlot;
  kind: VerificationKind | null;
  state: VerificationStatus | 'none';
  publicLabel: string | null;
  viewerLabel: string | null;
  meaning: string | null;
  doesNotMean: string | null;
  verifierClass: VerifierClass | null;
  integrityStatus: IntegrityStatus | 'unknown';
  disputeState: DisputeState;
  verifiedAt: string | null;
  expiresAt: string | null;
  updatedAt: string | null;
  badgeSemanticsVersion: number;
  issueKey: VerificationIssueKey | null;
  activeTrust: boolean;
};

export type VerificationPolicySummary = {
  badgeSemanticsVersion: number;
  recordsEvaluated: number;
  slots: {
    identity: VerificationSlotSummary;
    workplace: VerificationSlotSummary;
    organizationDomain: VerificationSlotSummary;
    organizationPlatformReview: VerificationSlotSummary;
  };
  evidence: {
    verifiedCount: number;
    latestVerifiedAt: string | null;
    publicLabel: string | null;
  };
  activeIssues: Array<{
    slot: VerificationSlot | 'evidence.attestation';
    state: VerificationStatus;
    issueKey: VerificationIssueKey;
    label: string;
  }>;
  publicBadges: VerificationBadgeSummary[];
  orgReviewBadges: VerificationBadgeSummary[];
  internalBadges: VerificationBadgeSummary[];
  compatibility: {
    verificationTier: 'unverified' | 'workplace_verified' | 'identity_verified';
    verificationTierSource:
      | 'linkedin_identity'
      | 'linkedin_workplace'
      | 'work_email'
      | 'veriff'
      | 'unknown';
    verificationStatus: 'unverified' | 'pending' | 'verified' | 'failed';
    verificationMethod: 'veriff' | 'work_email' | 'linkedin' | null;
    verified: boolean;
    workEmailVerified: boolean;
    workEmailNeedsReverify: boolean;
    orgTrustStatus: 'unverified' | 'pending' | 'domain_verified' | 'platform_reviewed';
    orgVerified: boolean;
  };
};

const SLOT_ORDER: VerificationSlot[] = [
  'individual.identity',
  'individual.workplace',
  'organization.domain',
  'organization.platform_review',
];

const FRESHNESS_WINDOWS_MS: Partial<Record<VerificationKind, number | null>> = {
  work_email: 365 * 24 * 60 * 60 * 1000,
  linkedin_workplace: 365 * 24 * 60 * 60 * 1000,
  linkedin_identity: 730 * 24 * 60 * 60 * 1000,
  veriff_identity: 730 * 24 * 60 * 60 * 1000,
  skill_attestation_peer: null,
  skill_attestation_manager: null,
  impact_attestation: null,
  org_domain: 365 * 24 * 60 * 60 * 1000,
  org_registry_manual: 730 * 24 * 60 * 60 * 1000,
  platform_manual_review: 730 * 24 * 60 * 60 * 1000,
};

const STALE_AFTER_MS: Partial<Record<VerificationKind, number | null>> = {
  skill_attestation_peer: 730 * 24 * 60 * 60 * 1000,
  skill_attestation_manager: 730 * 24 * 60 * 60 * 1000,
  impact_attestation: 730 * 24 * 60 * 60 * 1000,
};

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toMs(value: Date | string | null | undefined): number | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  const timestamp = date.getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function mapKindToSlot(kind: VerificationKind): VerificationSlot {
  switch (kind) {
    case 'veriff_identity':
    case 'linkedin_identity':
      return 'individual.identity';
    case 'linkedin_workplace':
    case 'work_email':
      return 'individual.workplace';
    case 'skill_attestation_peer':
    case 'skill_attestation_manager':
      return 'skill.attestation';
    case 'impact_attestation':
      return 'impact_story.attestation';
    case 'org_domain':
      return 'organization.domain';
    case 'org_registry_manual':
    case 'platform_manual_review':
      return 'organization.platform_review';
  }
}

function inferVerifierClass(
  kind: VerificationKind,
  verifierClass?: string | null
): VerifierClass | null {
  if (
    verifierClass === 'system_provider' ||
    verifierClass === 'system_signal' ||
    verifierClass === 'authenticated_manager' ||
    verifierClass === 'authenticated_peer' ||
    verifierClass === 'authenticated_external' ||
    verifierClass === 'manual_platform_reviewer'
  ) {
    return verifierClass;
  }

  switch (kind) {
    case 'veriff_identity':
    case 'linkedin_identity':
      return 'system_provider';
    case 'work_email':
    case 'linkedin_workplace':
    case 'org_domain':
      return 'system_signal';
    case 'skill_attestation_manager':
      return 'authenticated_manager';
    case 'skill_attestation_peer':
      return 'authenticated_peer';
    case 'impact_attestation':
      return 'authenticated_external';
    case 'org_registry_manual':
    case 'platform_manual_review':
      return 'manual_platform_reviewer';
  }
}

function resolveExpiry(record: VerificationRecordRow, nowMs: number): string | null {
  const explicitExpiresAt = toMs(record.expiresAt);
  if (explicitExpiresAt !== null) {
    return new Date(explicitExpiresAt).toISOString();
  }

  const freshnessWindow = FRESHNESS_WINDOWS_MS[record.verificationKind] ?? null;
  const anchorMs =
    toMs(record.lastRefreshedAt) ??
    toMs(record.verifiedAt) ??
    toMs(record.completedAt) ??
    toMs(record.updatedAt) ??
    null;

  if (freshnessWindow === null || anchorMs === null) {
    return null;
  }

  const expiresAtMs = anchorMs + freshnessWindow;
  if (expiresAtMs <= nowMs) {
    return new Date(expiresAtMs).toISOString();
  }

  return new Date(expiresAtMs).toISOString();
}

function resolveEffectiveState(record: VerificationRecordRow, nowMs: number): VerificationStatus {
  if (record.disputeState === 'open' || record.disputeState === 'under_review') {
    return 'disputed';
  }

  if (record.integrityStatus === 'contradicted') {
    return 'contradicted';
  }

  if (
    record.status === 'pending' ||
    record.status === 'verified' ||
    record.status === 'expired' ||
    record.status === 'superseded' ||
    record.status === 'downgraded' ||
    record.status === 'contradicted' ||
    record.status === 'disputed' ||
    record.status === 'revoked' ||
    record.status === 'declined' ||
    record.status === 'cancelled' ||
    record.status === 'failed'
  ) {
    if (record.status === 'verified') {
      const explicitExpiryMs = toMs(record.expiresAt);
      if (explicitExpiryMs !== null && explicitExpiryMs <= nowMs) {
        return 'expired';
      }

      const freshnessWindow = FRESHNESS_WINDOWS_MS[record.verificationKind] ?? null;
      const anchorMs =
        toMs(record.lastRefreshedAt) ??
        toMs(record.verifiedAt) ??
        toMs(record.completedAt) ??
        toMs(record.updatedAt) ??
        null;

      if (freshnessWindow !== null && anchorMs !== null && anchorMs + freshnessWindow <= nowMs) {
        return 'expired';
      }
    }

    return record.status;
  }

  return 'pending';
}

function hasStaleAttestation(record: VerificationRecordRow, nowMs: number) {
  const staleWindow = STALE_AFTER_MS[record.verificationKind] ?? null;
  const anchorMs =
    toMs(record.lastRefreshedAt) ??
    toMs(record.verifiedAt) ??
    toMs(record.completedAt) ??
    toMs(record.updatedAt) ??
    null;
  return staleWindow !== null && anchorMs !== null && anchorMs + staleWindow <= nowMs;
}

function issueKeyForState(state: VerificationStatus): VerificationIssueKey | null {
  switch (state) {
    case 'expired':
      return 'expired';
    case 'disputed':
      return 'under_review';
    case 'downgraded':
    case 'contradicted':
      return 'changed';
    case 'revoked':
      return 'revoked';
    case 'pending':
      return 'pending';
    default:
      return null;
  }
}

function buildEmptySlotSummary(slot: VerificationSlot): VerificationSlotSummary {
  return {
    slot,
    kind: null,
    state: 'none',
    publicLabel: null,
    viewerLabel: null,
    meaning: null,
    doesNotMean: null,
    verifierClass: null,
    integrityStatus: 'unknown',
    disputeState: 'none',
    verifiedAt: null,
    expiresAt: null,
    updatedAt: null,
    badgeSemanticsVersion: BADGE_SEMANTICS_VERSION,
    issueKey: null,
    activeTrust: false,
  };
}

function labelContract(
  slot: VerificationSlot,
  state: VerificationStatus | 'none'
): Pick<VerificationSlotSummary, 'publicLabel' | 'viewerLabel' | 'meaning' | 'doesNotMean'> {
  if (slot === 'individual.identity' && state === 'verified') {
    return {
      publicLabel: 'Identity checked',
      viewerLabel: 'Identity checked',
      meaning: 'Identity evidence was reviewed by Proofound or an approved provider.',
      doesNotMean: 'It does not guarantee skills, employment, conduct, or fit.',
    };
  }

  if (slot === 'individual.workplace' && state === 'verified') {
    return {
      publicLabel: 'Workplace confirmed',
      viewerLabel: 'Workplace confirmed',
      meaning:
        'The person controlled a work email or LinkedIn workplace signal tied to an organization when checked.',
      doesNotMean: 'It does not prove current employment beyond the freshness window.',
    };
  }

  if (slot === 'organization.domain' && state === 'verified') {
    return {
      publicLabel: 'Domain confirmed',
      viewerLabel: 'Domain confirmed',
      meaning: 'Proofound confirmed organization domain control or an equivalent domain signal.',
      doesNotMean: 'It does not certify legal, financial, security, or hiring quality.',
    };
  }

  if (slot === 'organization.platform_review' && state === 'verified') {
    return {
      publicLabel: 'Platform reviewed',
      viewerLabel: 'Platform reviewed',
      meaning: 'Proofound reviewed defined trust basics for this organization.',
      doesNotMean: 'It does not certify legal, financial, security, or compliance status.',
    };
  }

  if (state === 'pending') {
    return {
      publicLabel:
        slot === 'organization.platform_review' ? 'Trust review pending' : 'Verification pending',
      viewerLabel:
        slot === 'organization.platform_review' ? 'Trust review pending' : 'Verification pending',
      meaning: 'Evidence has been requested or collected but is not complete yet.',
      doesNotMean: 'It does not provide an active trust guarantee yet.',
    };
  }

  if (state === 'expired') {
    return {
      publicLabel: 'Verification expired',
      viewerLabel: 'Verification expired',
      meaning: 'The prior check is kept in history, but its freshness window has passed.',
      doesNotMean: 'It does not mean the underlying claim is false.',
    };
  }

  if (state === 'disputed') {
    return {
      publicLabel: 'Verification under review',
      viewerLabel: 'Verification under review',
      meaning:
        'The record has an open dispute or review, so Proofound is showing a conservative state.',
      doesNotMean: 'It does not confirm that the record is wrong.',
    };
  }

  if (state === 'downgraded' || state === 'contradicted') {
    return {
      publicLabel: slot.startsWith('organization.')
        ? 'Trust review changed'
        : 'Verification changed since issue',
      viewerLabel: slot.startsWith('organization.')
        ? 'Trust review changed'
        : 'Verification changed since issue',
      meaning: 'Later evidence conflicts with or weakens the earlier verification.',
      doesNotMean: 'It does not erase the historical record.',
    };
  }

  if (state === 'revoked') {
    return {
      publicLabel: slot.startsWith('organization.')
        ? 'Trust review revoked'
        : 'Verification revoked',
      viewerLabel: slot.startsWith('organization.')
        ? 'Trust review revoked'
        : 'Verification revoked',
      meaning: 'Proofound invalidated the prior verification after review.',
      doesNotMean: 'It does not remove the audit history of what happened.',
    };
  }

  return {
    publicLabel: null,
    viewerLabel: null,
    meaning: null,
    doesNotMean: null,
  };
}

function buildSlotSummary(
  slot: VerificationSlot,
  record: VerificationRecordRow | null,
  nowMs: number
): VerificationSlotSummary {
  if (!record) {
    return buildEmptySlotSummary(slot);
  }

  const state = resolveEffectiveState(record, nowMs);
  const label = labelContract(slot, state);

  return {
    slot,
    kind: record.verificationKind,
    state,
    publicLabel: label.publicLabel,
    viewerLabel: label.viewerLabel,
    meaning: label.meaning,
    doesNotMean: label.doesNotMean,
    verifierClass: inferVerifierClass(record.verificationKind, record.verifierClass),
    integrityStatus:
      record.integrityStatus === 'clear' ||
      record.integrityStatus === 'warning' ||
      record.integrityStatus === 'contradicted'
        ? record.integrityStatus
        : 'unknown',
    disputeState:
      record.disputeState === 'open' ||
      record.disputeState === 'under_review' ||
      record.disputeState === 'resolved_upheld' ||
      record.disputeState === 'resolved_downgraded' ||
      record.disputeState === 'resolved_revoked'
        ? record.disputeState
        : 'none',
    verifiedAt: toIso(record.verifiedAt),
    expiresAt: resolveExpiry(record, nowMs),
    updatedAt: toIso(record.updatedAt),
    badgeSemanticsVersion: record.badgeSemanticsVersion ?? BADGE_SEMANTICS_VERSION,
    issueKey: issueKeyForState(state),
    activeTrust: state === 'verified',
  };
}

function pickLatestRecordForSlot(
  records: VerificationRecordRow[],
  slot: VerificationSlot
): VerificationRecordRow | null {
  const matching = records
    .filter(
      (record) => (record.verificationSlot || mapKindToSlot(record.verificationKind)) === slot
    )
    .sort((left, right) => {
      const rightUpdated = toMs(right.updatedAt) ?? 0;
      const leftUpdated = toMs(left.updatedAt) ?? 0;
      return rightUpdated - leftUpdated;
    });

  return matching[0] ?? null;
}

function methodFromKind(
  kind: VerificationKind | null
): 'veriff' | 'work_email' | 'linkedin' | null {
  switch (kind) {
    case 'veriff_identity':
      return 'veriff';
    case 'linkedin_identity':
    case 'linkedin_workplace':
      return 'linkedin';
    case 'work_email':
      return 'work_email';
    default:
      return null;
  }
}

function tierSourceFromKind(
  kind: VerificationKind | null
): 'linkedin_identity' | 'linkedin_workplace' | 'work_email' | 'veriff' | 'unknown' {
  switch (kind) {
    case 'veriff_identity':
      return 'veriff';
    case 'linkedin_identity':
      return 'linkedin_identity';
    case 'linkedin_workplace':
      return 'linkedin_workplace';
    case 'work_email':
      return 'work_email';
    default:
      return 'unknown';
  }
}

function buildBadge(
  summary: VerificationSlotSummary,
  surface: VerificationSurface
): VerificationBadgeSummary | null {
  if (!summary.publicLabel || !summary.kind) {
    return null;
  }

  const keyMap: Record<string, VerificationBadgeSummary['key']> = {
    'Identity checked': 'identity_checked',
    'Workplace confirmed': 'workplace_confirmed',
    'Domain confirmed': 'domain_confirmed',
    'Platform reviewed': 'platform_reviewed',
    'Verification expired': 'verification_expired',
    'Verification under review': 'verification_under_review',
    'Verification changed since issue': 'verification_changed',
    'Verification revoked': 'verification_revoked',
    'Trust review pending': 'trust_review_pending',
    'Trust review changed': 'trust_review_changed',
    'Trust review revoked': 'trust_review_revoked',
    'Verification pending': 'trust_review_pending',
  };

  return {
    key: keyMap[summary.publicLabel] ?? 'verification_under_review',
    label: summary.publicLabel,
    meaning: summary.meaning ?? '',
    doesNotMean: summary.doesNotMean ?? '',
    state: summary.state === 'none' ? 'pending' : summary.state,
    surface,
    slot: summary.slot,
    kind: summary.kind,
    verifierClass: summary.verifierClass,
    verifiedAt: summary.verifiedAt,
    expiresAt: summary.expiresAt,
    issueReason: summary.issueKey,
  };
}

function buildEvidenceBadge(
  verifiedCount: number,
  latestVerifiedAt: string | null,
  surface: VerificationSurface
): VerificationBadgeSummary | null {
  if (verifiedCount < 1) {
    return null;
  }

  return {
    key: 'evidence_attested',
    label: 'Evidence attested',
    meaning: 'A named claim or artifact was confirmed by an eligible verifier.',
    doesNotMean: 'It does not make every profile claim true.',
    state: 'verified',
    surface,
    slot: 'evidence.attestation',
    kind: 'mixed',
    verifierClass: null,
    verifiedAt: latestVerifiedAt,
    expiresAt: null,
    issueReason: null,
  };
}

export function summarizeVerificationPolicy(input: {
  records: VerificationRecordRow[];
  legacyProfile?: LegacyProfileCompatInput | null;
  legacyOrganization?: LegacyOrgCompatInput | null;
  now?: Date;
}): VerificationPolicySummary {
  const nowMs = (input.now ?? new Date()).getTime();
  const identity = buildSlotSummary(
    'individual.identity',
    pickLatestRecordForSlot(input.records, 'individual.identity'),
    nowMs
  );
  const workplace = buildSlotSummary(
    'individual.workplace',
    pickLatestRecordForSlot(input.records, 'individual.workplace'),
    nowMs
  );
  const organizationDomain = buildSlotSummary(
    'organization.domain',
    pickLatestRecordForSlot(input.records, 'organization.domain'),
    nowMs
  );
  const organizationPlatformReview = buildSlotSummary(
    'organization.platform_review',
    pickLatestRecordForSlot(input.records, 'organization.platform_review'),
    nowMs
  );

  const evidenceRecords = input.records.filter((record) => {
    const slot = record.verificationSlot || mapKindToSlot(record.verificationKind);
    return (
      slot === 'skill.attestation' ||
      slot === 'impact_story.attestation' ||
      slot === 'artifact.attestation'
    );
  });

  const verifiedEvidence = evidenceRecords
    .filter(
      (record) =>
        resolveEffectiveState(record, nowMs) === 'verified' && !hasStaleAttestation(record, nowMs)
    )
    .sort((left, right) => (toMs(right.verifiedAt) ?? 0) - (toMs(left.verifiedAt) ?? 0));

  const activeIssues = [identity, workplace, organizationDomain, organizationPlatformReview]
    .filter((summary) => summary.issueKey && summary.state !== 'none')
    .map((summary) => ({
      slot: summary.slot,
      state: summary.state as VerificationStatus,
      issueKey: summary.issueKey as VerificationIssueKey,
      label: summary.publicLabel ?? 'Verification update',
    }));

  const publicBadges = [identity, workplace, organizationDomain, organizationPlatformReview]
    .map((summary) => buildBadge(summary, 'public_portfolio'))
    .filter((badge): badge is VerificationBadgeSummary => Boolean(badge));
  const orgReviewBadges = [identity, workplace, organizationDomain, organizationPlatformReview]
    .map((summary) => buildBadge(summary, 'org_review'))
    .filter((badge): badge is VerificationBadgeSummary => Boolean(badge));
  const internalBadges = [identity, workplace, organizationDomain, organizationPlatformReview]
    .map((summary) => buildBadge(summary, 'internal'))
    .filter((badge): badge is VerificationBadgeSummary => Boolean(badge));

  const evidenceBadge = buildEvidenceBadge(
    verifiedEvidence.length,
    toIso(verifiedEvidence[0]?.verifiedAt ?? null),
    'public_portfolio'
  );
  const evidenceOrgReviewBadge = buildEvidenceBadge(
    verifiedEvidence.length,
    toIso(verifiedEvidence[0]?.verifiedAt ?? null),
    'org_review'
  );
  const evidenceInternalBadge = buildEvidenceBadge(
    verifiedEvidence.length,
    toIso(verifiedEvidence[0]?.verifiedAt ?? null),
    'internal'
  );

  if (evidenceBadge) publicBadges.push(evidenceBadge);
  if (evidenceOrgReviewBadge) orgReviewBadges.push(evidenceOrgReviewBadge);
  if (evidenceInternalBadge) internalBadges.push(evidenceInternalBadge);

  const legacyIdentityVerified =
    Boolean(input.legacyProfile?.linkedinHasIdentityVerification) ||
    Boolean(
      input.legacyProfile?.verificationMethod === 'veriff' &&
        (input.legacyProfile?.verificationStatus === 'verified' || input.legacyProfile?.verified)
    );
  const legacyWorkplaceVerified =
    Boolean(input.legacyProfile?.workEmailCurrentlyVerified) ||
    Boolean(
      input.legacyProfile?.verificationMethod === 'linkedin' &&
        input.legacyProfile?.linkedinVerificationStatus === 'verified'
    );

  const verificationTier =
    identity.activeTrust || legacyIdentityVerified
      ? 'identity_verified'
      : workplace.activeTrust || legacyWorkplaceVerified
        ? 'workplace_verified'
        : (input.legacyProfile?.verificationTier ?? 'unverified');

  const verificationTierSource =
    identity.activeTrust || workplace.activeTrust
      ? tierSourceFromKind(identity.activeTrust ? identity.kind : workplace.kind)
      : legacyIdentityVerified
        ? input.legacyProfile?.verificationMethod === 'veriff'
          ? 'veriff'
          : 'linkedin_identity'
        : legacyWorkplaceVerified
          ? input.legacyProfile?.workEmailCurrentlyVerified
            ? 'work_email'
            : 'linkedin_workplace'
          : (input.legacyProfile?.verificationTierSource ?? 'unknown');

  const verificationMethod =
    identity.activeTrust || workplace.activeTrust
      ? methodFromKind(identity.activeTrust ? identity.kind : workplace.kind)
      : (input.legacyProfile?.verificationMethod ?? null);

  let verificationStatus: 'unverified' | 'pending' | 'verified' | 'failed' = 'unverified';
  if (identity.activeTrust) {
    verificationStatus = 'verified';
  } else if (
    identity.state === 'pending' ||
    workplace.state === 'pending' ||
    identity.state === 'disputed' ||
    workplace.state === 'disputed'
  ) {
    verificationStatus = 'pending';
  } else if (identity.state === 'failed' || workplace.state === 'failed') {
    verificationStatus = 'failed';
  } else if (input.legacyProfile?.verificationStatus === 'failed') {
    verificationStatus = 'failed';
  } else if (input.legacyProfile?.verificationStatus === 'pending') {
    verificationStatus = 'pending';
  }

  let orgTrustStatus: 'unverified' | 'pending' | 'domain_verified' | 'platform_reviewed' =
    input.legacyOrganization?.trustStatus ?? 'unverified';
  if (organizationPlatformReview.activeTrust) {
    orgTrustStatus = 'platform_reviewed';
  } else if (organizationDomain.activeTrust) {
    orgTrustStatus = 'domain_verified';
  } else if (
    organizationPlatformReview.state === 'pending' ||
    organizationDomain.state === 'pending' ||
    organizationPlatformReview.state === 'disputed'
  ) {
    orgTrustStatus = 'pending';
  }

  const workEmailVerified = workplace.activeTrust && workplace.kind === 'work_email';
  const workEmailNeedsReverify = workplace.state === 'expired' && workplace.kind === 'work_email';

  return {
    badgeSemanticsVersion: BADGE_SEMANTICS_VERSION,
    recordsEvaluated: input.records.length,
    slots: {
      identity,
      workplace,
      organizationDomain,
      organizationPlatformReview,
    },
    evidence: {
      verifiedCount: verifiedEvidence.length,
      latestVerifiedAt: toIso(verifiedEvidence[0]?.verifiedAt ?? null),
      publicLabel: verifiedEvidence.length > 0 ? 'Evidence attested' : null,
    },
    activeIssues,
    publicBadges,
    orgReviewBadges,
    internalBadges,
    compatibility: {
      verificationTier,
      verificationTierSource,
      verificationStatus,
      verificationMethod,
      verified: identity.activeTrust,
      workEmailVerified,
      workEmailNeedsReverify,
      orgTrustStatus,
      orgVerified: organizationPlatformReview.activeTrust,
    },
  };
}

export async function listVerificationRecordsForOwner(
  ownerType: 'individual_profile' | 'organization',
  ownerId: string
) {
  return db.query.verificationRecords.findMany({
    where: and(
      eq(verificationRecords.ownerType, ownerType),
      eq(verificationRecords.ownerId, ownerId)
    ),
    orderBy: [desc(verificationRecords.updatedAt)],
  });
}

export function slotForVerificationKind(kind: VerificationKind) {
  return mapKindToSlot(kind);
}

export function getPolicyFreshnessWindowMs(kind: VerificationKind) {
  return FRESHNESS_WINDOWS_MS[kind] ?? null;
}

export function getTrackedVerificationSlots() {
  return [...SLOT_ORDER];
}
