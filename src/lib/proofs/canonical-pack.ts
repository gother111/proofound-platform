import { and, eq, inArray, isNull } from 'drizzle-orm';

import { db } from '@/db';
import {
  proofArtifacts,
  proofPackItems,
  proofPacks,
  proofFreshnessStates,
  uploadedFiles,
  verificationRecords,
} from '@/db/schema';
import {
  type ProofPackItemClass,
  type ProofFreshnessState,
  type ProofPackPrimaryClaimType,
  type ProofPackVerificationStatus,
  stableHashPayload,
} from '@/lib/contracts/canonical-domain';
import {
  computeEffectiveVisibility,
  isPublicSafeVisibility,
  type EffectiveVisibility,
} from '@/lib/privacy/effective-visibility';
import { toDateOrNull, toIsoOrNull } from '@/lib/datetime/normalize';
import {
  revalidatePublicOrganizationPortfolioById,
  revalidatePublicPortfolioByProfileId,
} from '@/lib/portfolio/public-invalidation';
import {
  hasPrimaryAnchorContext,
  isPrimaryAnchorContextSubjectType,
  PRIMARY_ANCHOR_CONTEXT_SUBJECT_TYPES,
  type PrimaryAnchorContextSubjectType,
} from '@/lib/proofs/pack-anchor';
import {
  isUploadHeldForPrivacyReview,
  isUploadDerivedTitle,
  resolveArtifactDisplayName,
  resolveArtifactDisplayNameForSurface,
} from '@/lib/uploads/privacy';

export {
  hasPrimaryAnchorContext,
  isPrimaryAnchorContextSubjectType,
  PRIMARY_ANCHOR_CONTEXT_SUBJECT_TYPES,
  type PrimaryAnchorContextSubjectType,
} from '@/lib/proofs/pack-anchor';

type ProofPackRow = typeof proofPacks.$inferSelect;
type ProofPackItemRow = typeof proofPackItems.$inferSelect;
type ProofArtifactRow = typeof proofArtifacts.$inferSelect;
type UploadedFileRow = typeof uploadedFiles.$inferSelect;
type VerificationRecordRow = typeof verificationRecords.$inferSelect;

export type CanonicalProofItemAggregate = {
  item: ProofPackItemRow;
  artifact: ProofArtifactRow;
  effectiveVisibility: EffectiveVisibility;
  uploadedFile: Pick<
    UploadedFileRow,
    | 'id'
    | 'uploadKind'
    | 'originalFilename'
    | 'sanitizedFilename'
    | 'detectedMime'
    | 'lifecycleState'
    | 'safetyStatus'
    | 'safetyReason'
    | 'attachStatus'
    | 'safeForPublic'
    | 'metadata'
  > | null;
};

export type CanonicalOwnerProofPackProjection = {
  id: string;
  ownerType: ProofPackRow['ownerType'];
  ownerId: string;
  packKind: ProofPackRow['packKind'];
  primarySubjectType: ProofPackRow['primarySubjectType'];
  primarySubjectId: string | null;
  lifecycleState: ProofPackRow['lifecycleState'];
  title: string;
  summary: string | null;
  contextJson: Record<string, unknown>;
  evidenceSummary: string | null;
  outcomesSummary: string | null;
  visibility: ProofPackRow['visibility'];
  revealGate: ProofPackRow['revealGate'];
  verificationStatus: ProofPackVerificationStatus;
  freshnessState: ProofFreshnessState;
  freshnessEvaluatedAt: string | null;
  lastVerifiedAt: string | null;
  lastRefreshedAt: string | null;
  portabilityMeta: Record<string, unknown>;
  contract: CanonicalProofPackContract;
  items: Array<{
    artifactId: string;
    position: number;
    itemClass: ProofPackItemClass;
    subtypeMetadata: Record<string, unknown>;
    includedFields: string[];
    effectiveVisibility: EffectiveVisibility;
    artifact: {
      id: string;
      subjectType: ProofArtifactRow['subjectType'];
      subjectId: string | null;
      artifactKind: ProofArtifactRow['artifactKind'];
      lifecycleState: ProofArtifactRow['lifecycleState'];
      title: string;
      artifactDisplayName: string | null;
      description: string | null;
      sourceUrl: string | null;
      storagePath: string | null;
      mimeType: string | null;
      issuedAt: string | null;
      expiresAt: string | null;
      visibility: ProofArtifactRow['visibility'];
      revealGate: ProofArtifactRow['revealGate'];
      metadata: Record<string, unknown>;
    };
  }>;
  verificationReferences: Array<{
    id: string;
    subjectType: VerificationRecordRow['subjectType'];
    subjectId: string;
    proofArtifactId: string | null;
    verificationKind: VerificationRecordRow['verificationKind'];
    verificationSlot: VerificationRecordRow['verificationSlot'];
    status: VerificationRecordRow['status'];
    integrityStatus: VerificationRecordRow['integrityStatus'];
    disputeState: VerificationRecordRow['disputeState'];
    verifiedAt: string | null;
    expiresAt: string | null;
    lastRefreshedAt: string | null;
    metadata: Record<string, unknown>;
  }>;
};

export type CanonicalPublicSafeProofPackProjection = {
  id: string;
  packKind: ProofPackRow['packKind'];
  primarySubjectType: ProofPackRow['primarySubjectType'];
  primarySubjectId: string | null;
  lifecycleState: ProofPackRow['lifecycleState'];
  title: string;
  summary: string | null;
  evidenceSummary: string | null;
  outcomesSummary: string | null;
  verificationStatus: Extract<
    ProofPackVerificationStatus,
    'unverified' | 'partially_verified' | 'verified'
  >;
  freshnessState: ProofFreshnessState;
  lastVerifiedAt: string | null;
  lastRefreshedAt: string | null;
  provenanceSummary: string | null;
  portabilityMeta: Record<string, unknown>;
  contract: CanonicalProofPackContract;
  items: Array<{
    artifactId: string;
    position: number;
    itemClass: ProofPackItemClass;
    subtypeMetadata: Record<string, unknown>;
    semanticsNote: string;
    artifactKind: ProofArtifactRow['artifactKind'];
    title: string;
    artifactDisplayName: string | null;
    description: string | null;
    sourceUrl: string | null;
    issuedAt: string | null;
    expiresAt: string | null;
  }>;
};

export type CanonicalProofPackAggregate = {
  pack: ProofPackRow;
  items: CanonicalProofItemAggregate[];
  verificationReferences: VerificationRecordRow[];
  verificationStatus: ProofPackVerificationStatus;
  freshnessState: ProofFreshnessState;
  latestEvidenceAt: Date | null;
  portabilityHashByScope: {
    owner_full: string;
    public_safe: string;
  };
  ownerFull: CanonicalOwnerProofPackProjection;
  publicSafe: CanonicalPublicSafeProofPackProjection | null;
};

export type CanonicalProofSubjectSummary = {
  subjectType: ProofArtifactRow['subjectType'];
  subjectId: string;
  packCount: number;
  publicPackCount: number;
  artifactCount: number;
  publicArtifactCount: number;
  freshnessState: ProofFreshnessState;
  verificationStatus: ProofPackVerificationStatus;
  latestEvidenceAt: string | null;
  hasPublicSignal: boolean;
  hasVerifiedSignal: boolean;
  hasTrustedSignal: boolean;
};

export type CanonicalProofOwnerSummary = {
  packCount: number;
  publicPackCount: number;
  artifactCount: number;
  publicArtifactCount: number;
  publicProofSignalCount: number;
  verificationReferenceCount: number;
  activeVerificationCount: number;
  verifiedVerificationCount: number;
  subjectSummaries: CanonicalProofSubjectSummary[];
};

export type CanonicalSkillVerificationSource = 'self' | 'peer' | 'manager' | 'external';
export type CanonicalProofPackSkillEvidenceClass =
  | 'artifact_backed'
  | 'credential_backed'
  | 'human_observed'
  | 'context_backed';

export type CanonicalProofPackContractEvidenceItem = {
  artifactId: string;
  itemClass: ProofPackItemClass;
  subtypeMetadata: Record<string, unknown>;
  artifactKind: ProofArtifactRow['artifactKind'] | null;
  title: string;
  artifactDisplayName: string | null;
  description: string | null;
  sourceUrl: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  skillId: string | null;
  semanticsNote: string;
};

export type CanonicalProofPackContract = {
  id: string;
  packKind: ProofPackRow['packKind'];
  status: ProofPackRow['lifecycleState'];
  title: string;
  primaryClaim: {
    type: ProofPackPrimaryClaimType;
    statement: string;
  };
  primaryAnchor: {
    subjectType: ProofPackRow['primarySubjectType'];
    subjectId: string | null;
    label: string | null;
  };
  roleContext: string | null;
  ownershipStatement: string | null;
  timeframe: {
    start: string | null;
    end: string | null;
    label: string | null;
  };
  outcomeSummary: string | null;
  linkedSkills: Array<{
    skillId: string;
    evidenceClasses: CanonicalProofPackSkillEvidenceClass[];
  }>;
  linkedEvidenceItems: CanonicalProofPackContractEvidenceItem[];
  visibilityState: ProofPackRow['visibility'];
  freshnessState: ProofFreshnessState;
  verificationSummary: {
    status: ProofPackVerificationStatus;
    summary: string;
    lastVerifiedAt: string | null;
  };
  proofQualityScore: number | null;
  schemaVersion: string;
};

export type CanonicalLegacySkillProofRow = {
  id: string;
  skill_id: string | null;
  profile_id: string;
  proof_type: 'project' | 'certification' | 'media' | 'reference' | 'link' | 'document';
  title: string;
  description: string | null;
  url: string | null;
  file_path: string | null;
  issued_date: string | null;
  expires_date: string | null;
  created_at: string | null;
  updated_at: string | null;
  metadata: Record<string, unknown>;
  canonical_artifact_id: string;
};

export type CanonicalSkillProofSummary = {
  skillId: string;
  proofCount: number;
  publicProofCount: number;
  verificationCount: number;
  verificationSources: Array<{ source: CanonicalSkillVerificationSource }>;
  verificationStatus: ProofPackVerificationStatus;
  freshnessState: ProofFreshnessState;
  latestEvidenceAt: string | null;
  hasPublicSignal: boolean;
  hasTrustedSignal: boolean;
  proofs: CanonicalLegacySkillProofRow[];
};

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === 'string');
}

const toIsoString = toIsoOrNull;
const toDate = toDateOrNull;

function toNullableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function inferSubtypeFromArtifact(input: {
  artifactKind: ProofArtifactRow['artifactKind'] | null;
  sourceUrl: string | null | undefined;
  metadata: Record<string, unknown>;
}) {
  const explicitSubtype =
    typeof input.metadata.artifactSubtype === 'string' ? input.metadata.artifactSubtype : null;
  if (explicitSubtype) {
    return explicitSubtype;
  }

  const url = input.sourceUrl ?? '';
  if (/github\.com\/.+\/pull\//i.test(url)) return 'pr';
  if (/github\.com\/.+\/commit\//i.test(url)) return 'commit';
  if (/github\.com\//i.test(url)) return 'repo';

  switch (input.artifactKind) {
    case 'image':
      return 'photo';
    case 'video':
      return 'video';
    case 'document':
      return 'doc';
    case 'credential':
      return 'certificate';
    default:
      return null;
  }
}

export function resolveProofPackItemClass(input: {
  itemClass?: ProofPackItemRow['itemClass'] | null;
  artifact: Pick<ProofArtifactRow, 'artifactKind' | 'title' | 'sourceUrl' | 'metadata'>;
}): ProofPackItemClass {
  if (typeof input.itemClass === 'string' && input.itemClass.length > 0) {
    return input.itemClass as ProofPackItemClass;
  }

  const metadata = toRecord(input.artifact.metadata);
  const evidenceSubtype =
    typeof metadata.evidenceSubtype === 'string' ? metadata.evidenceSubtype : null;
  const title = input.artifact.title.toLowerCase();
  const url = input.artifact.sourceUrl ?? '';

  if (input.artifact.artifactKind === 'credential') {
    return 'credential_evidence';
  }
  if (
    evidenceSubtype === 'engagement' ||
    /(invoice|contract|agreement|statement of work|sow|offer letter)/i.test(title)
  ) {
    return 'engagement_evidence';
  }
  if (
    evidenceSubtype === 'reviewer_note' ||
    evidenceSubtype === 'structured_reviewer_note' ||
    input.artifact.artifactKind === 'reference'
  ) {
    return 'reviewer_note';
  }
  if (evidenceSubtype === 'case_fragment' || evidenceSubtype === 'case_study_fragment') {
    return 'case_fragment';
  }
  if (/github\.com\/.+\/(pull|pulls|commit)\//i.test(url) || /github\.com\//i.test(url)) {
    return 'repo_activity';
  }
  if (input.artifact.sourceUrl) {
    return 'url_link';
  }
  return 'file_upload';
}

export function resolveProofPackItemSubtypeMetadata(input: {
  subtypeMetadata?: ProofPackItemRow['subtypeMetadata'] | null;
  artifact: Pick<ProofArtifactRow, 'artifactKind' | 'sourceUrl' | 'metadata'>;
}): Record<string, unknown> {
  const itemSubtypeMetadata = toRecord(input.subtypeMetadata);
  if (Object.keys(itemSubtypeMetadata).length > 0) {
    return itemSubtypeMetadata;
  }

  const artifactMetadata = toRecord(input.artifact.metadata);
  const inferredSubtype = inferSubtypeFromArtifact({
    artifactKind: input.artifact.artifactKind,
    sourceUrl: input.artifact.sourceUrl,
    metadata: artifactMetadata,
  });

  return Object.fromEntries(
    Object.entries({
      subtype: inferredSubtype,
      artifactKind: input.artifact.artifactKind,
    }).filter(([, value]) => value != null)
  );
}

export function resolveProofEvidenceSemanticsNote(item: {
  itemClass: ProofPackItemClass;
  subtypeMetadata: Record<string, unknown>;
}) {
  const subtype =
    typeof item.subtypeMetadata.subtype === 'string' ? item.subtypeMetadata.subtype : '';

  if (item.itemClass === 'repo_activity' || ['repo', 'commit', 'pr'].includes(subtype)) {
    return 'Shows activity and contribution cues, not full mastery.';
  }
  if (item.itemClass === 'credential_evidence') {
    return 'Shows credential facts, not job performance.';
  }
  if (item.itemClass === 'engagement_evidence') {
    return 'Shows engagement facts, not work quality.';
  }
  if (item.itemClass === 'reviewer_note') {
    return 'Scoped reviewer observation, not a global endorsement.';
  }
  return 'Supporting evidence only, not full verification.';
}

function resolvePrimaryClaimType(input: {
  pack: ProofPackRow;
  linkedEvidenceItems: CanonicalProofPackContractEvidenceItem[];
}): ProofPackPrimaryClaimType {
  if (typeof input.pack.primaryClaimType === 'string' && input.pack.primaryClaimType.length > 0) {
    return input.pack.primaryClaimType as ProofPackPrimaryClaimType;
  }
  if (input.linkedEvidenceItems.some((item) => item.itemClass === 'credential_evidence')) {
    return 'credential_fact';
  }
  if (input.linkedEvidenceItems.some((item) => item.itemClass === 'engagement_evidence')) {
    return 'engagement_fact';
  }
  if (
    typeof input.pack.outcomesSummary === 'string' &&
    input.pack.outcomesSummary.trim().length > 0
  ) {
    return 'outcome';
  }
  return 'contribution';
}

function resolvePrimaryClaimStatement(pack: ProofPackRow) {
  const contextJson = toRecord(pack.contextJson);
  const contextClaim =
    typeof contextJson.proofPackClaim === 'string' ? contextJson.proofPackClaim.trim() : '';
  const summary = typeof pack.summary === 'string' ? pack.summary.trim() : '';

  if (contextClaim.length > 0) {
    return contextClaim;
  }
  if (summary.length > 0) {
    return summary;
  }
  return pack.title;
}

function resolveOwnershipStatement(pack: ProofPackRow) {
  const contextJson = toRecord(pack.contextJson);
  const explicitOwnership =
    typeof pack.ownershipStatement === 'string' && pack.ownershipStatement.trim().length > 0
      ? pack.ownershipStatement.trim()
      : null;
  if (explicitOwnership) {
    return explicitOwnership;
  }

  const legacyOwnership =
    typeof contextJson.proofPackOwnership === 'string' &&
    contextJson.proofPackOwnership.trim().length > 0
      ? contextJson.proofPackOwnership.trim()
      : null;
  if (legacyOwnership) {
    return legacyOwnership;
  }

  const summary = typeof pack.summary === 'string' ? pack.summary.trim() : '';
  const primaryClaim = resolvePrimaryClaimStatement(pack);
  if (summary.length > 0 && summary !== primaryClaim) {
    return summary;
  }
  return null;
}

function resolveRoleContext(pack: ProofPackRow) {
  if (typeof pack.roleContext === 'string' && pack.roleContext.trim().length > 0) {
    return pack.roleContext.trim();
  }

  const contextJson = toRecord(pack.contextJson);
  if (typeof contextJson.contextTitle === 'string' && contextJson.contextTitle.trim().length > 0) {
    return contextJson.contextTitle.trim();
  }

  return null;
}

function resolveTimeframe(pack: ProofPackRow) {
  const contextJson = toRecord(pack.contextJson);
  const timeframeStart = pack.timeframeStart ? toIsoString(pack.timeframeStart) : null;
  const timeframeEnd = pack.timeframeEnd ? toIsoString(pack.timeframeEnd) : null;
  return {
    start: timeframeStart,
    end: timeframeEnd,
    label:
      typeof pack.timeframeLabel === 'string' && pack.timeframeLabel.trim().length > 0
        ? pack.timeframeLabel.trim()
        : typeof contextJson.contextDuration === 'string' &&
            contextJson.contextDuration.trim().length > 0
          ? contextJson.contextDuration.trim()
          : null,
  };
}

function resolvePrimaryAnchorLabel(pack: ProofPackRow) {
  switch (pack.primarySubjectType) {
    case 'experience':
      return 'Primary work context';
    case 'education':
      return 'Primary learning context';
    case 'volunteering':
      return 'Primary volunteering context';
    default:
      return null;
  }
}

function deriveProofQualityScore(input: {
  pack: ProofPackRow;
  linkedEvidenceItems: CanonicalProofPackContractEvidenceItem[];
  verificationStatus: ProofPackVerificationStatus;
  freshnessState: ProofFreshnessState;
}) {
  const storedScore = toNullableNumber(input.pack.proofQualityScore);
  if (storedScore != null) {
    return storedScore;
  }

  let score = 0;
  if (resolvePrimaryClaimStatement(input.pack).trim().length > 0) score += 0.2;
  if ((input.pack.outcomesSummary ?? '').trim().length > 0) score += 0.2;
  if (input.linkedEvidenceItems.length > 0) score += 0.2;
  if (input.verificationStatus === 'verified') score += 0.2;
  else if (input.verificationStatus === 'partially_verified') score += 0.1;
  if (input.freshnessState === 'fresh') score += 0.2;
  else if (input.freshnessState === 'review_soon') score += 0.1;

  return Number(score.toFixed(2));
}

function buildVerificationSummary(input: {
  pack: ProofPackRow;
  verificationStatus: ProofPackVerificationStatus;
  lastVerifiedAt: string | null;
}) {
  const storedSummary =
    typeof input.pack.verificationSummary === 'string' ? input.pack.verificationSummary.trim() : '';
  if (storedSummary.length > 0) {
    return {
      status: input.verificationStatus,
      summary: storedSummary,
      lastVerifiedAt: input.lastVerifiedAt,
    };
  }

  const summary =
    input.verificationStatus === 'verified'
      ? 'Scoped verification supports this proof record.'
      : input.verificationStatus === 'partially_verified'
        ? 'Some scoped verification supports parts of this proof record.'
        : input.verificationStatus === 'disputed'
          ? 'Verification is disputed or contradicted for this proof record.'
          : 'No scoped verification is recorded for this proof record yet.';

  return {
    status: input.verificationStatus,
    summary,
    lastVerifiedAt: input.lastVerifiedAt,
  };
}

function buildLinkedSkills(input: {
  pack: ProofPackRow;
  linkedEvidenceItems: CanonicalProofPackContractEvidenceItem[];
  verificationReferences: VerificationRecordRow[];
}) {
  const skills = new Map<string, Set<CanonicalProofPackSkillEvidenceClass>>();

  for (const item of input.linkedEvidenceItems) {
    if (!item.skillId) {
      continue;
    }

    const evidenceClasses =
      skills.get(item.skillId) ?? new Set<CanonicalProofPackSkillEvidenceClass>();
    evidenceClasses.add('artifact_backed');
    if (item.itemClass === 'credential_evidence') {
      evidenceClasses.add('credential_backed');
    }
    if (hasPrimaryAnchorContext(input.pack)) {
      evidenceClasses.add('context_backed');
    }
    skills.set(item.skillId, evidenceClasses);
  }

  for (const record of input.verificationReferences) {
    if (
      record.status !== 'verified' ||
      record.integrityStatus !== 'clear' ||
      (record.verificationKind !== 'skill_attestation_manager' &&
        record.verificationKind !== 'skill_attestation_peer' &&
        record.verificationKind !== 'impact_attestation')
    ) {
      continue;
    }

    if (record.subjectType !== 'skill' || typeof record.subjectId !== 'string') {
      continue;
    }

    const evidenceClasses =
      skills.get(record.subjectId) ?? new Set<CanonicalProofPackSkillEvidenceClass>();
    evidenceClasses.add('human_observed');
    if (hasPrimaryAnchorContext(input.pack)) {
      evidenceClasses.add('context_backed');
    }
    skills.set(record.subjectId, evidenceClasses);
  }

  return [...skills.entries()]
    .map(([skillId, evidenceClassSet]) => ({
      skillId,
      evidenceClasses: [...evidenceClassSet].sort(),
    }))
    .sort((left, right) => left.skillId.localeCompare(right.skillId));
}

export function buildCanonicalProofPackContract(input: {
  pack: ProofPackRow;
  linkedEvidenceItems: CanonicalProofPackContractEvidenceItem[];
  verificationReferences: VerificationRecordRow[];
  verificationStatus: ProofPackVerificationStatus;
  freshnessState: ProofFreshnessState;
  visibilityState: ProofPackRow['visibility'];
  lastVerifiedAt: string | null;
}): CanonicalProofPackContract {
  const primaryClaimType = resolvePrimaryClaimType(input);
  const primaryClaimStatement = resolvePrimaryClaimStatement(input.pack);

  return {
    id: input.pack.id,
    packKind: input.pack.packKind,
    status: input.pack.lifecycleState,
    title: input.pack.title,
    primaryClaim: {
      type: primaryClaimType,
      statement: primaryClaimStatement,
    },
    primaryAnchor: {
      subjectType: input.pack.primarySubjectType,
      subjectId: input.pack.primarySubjectId,
      label: resolvePrimaryAnchorLabel(input.pack),
    },
    roleContext: resolveRoleContext(input.pack),
    ownershipStatement: resolveOwnershipStatement(input.pack),
    timeframe: resolveTimeframe(input.pack),
    outcomeSummary: input.pack.outcomesSummary,
    linkedSkills: buildLinkedSkills(input),
    linkedEvidenceItems: input.linkedEvidenceItems,
    visibilityState: input.visibilityState,
    freshnessState: input.freshnessState,
    verificationSummary: buildVerificationSummary({
      pack: input.pack,
      verificationStatus: input.verificationStatus,
      lastVerifiedAt: input.lastVerifiedAt,
    }),
    proofQualityScore: deriveProofQualityScore(input),
    schemaVersion: input.pack.schemaVersion || 'proof_pack/v2',
  };
}

function maxDate(values: Array<Date | null>): Date | null {
  return values.reduce<Date | null>((current, value) => {
    if (!value) {
      return current;
    }
    if (!current || value.getTime() > current.getTime()) {
      return value;
    }
    return current;
  }, null);
}

function statusRank(status: ProofPackVerificationStatus) {
  switch (status) {
    case 'disputed':
      return 3;
    case 'verified':
      return 2;
    case 'partially_verified':
      return 1;
    case 'unverified':
    default:
      return 0;
  }
}

function mapArtifactKindToLegacyProofType(
  artifactKind: ProofArtifactRow['artifactKind']
): CanonicalLegacySkillProofRow['proof_type'] {
  switch (artifactKind) {
    case 'credential':
      return 'certification';
    case 'document':
      return 'document';
    case 'image':
    case 'video':
      return 'media';
    case 'reference':
      return 'reference';
    case 'link':
      return 'link';
    case 'assessment':
    case 'other':
    default:
      return 'project';
  }
}

function toLegacyDateString(value: Date | string | null | undefined) {
  const isoValue = toIsoString(value);
  return isoValue ? isoValue.slice(0, 10) : null;
}

function isActiveArtifactRow(artifact: ProofArtifactRow) {
  return !artifact.deletedAt && !artifact.revokedAt && artifact.lifecycleState !== 'deleted';
}

function mapVerificationSource(
  ownerId: string,
  record: VerificationRecordRow
): CanonicalSkillVerificationSource {
  const metadata = toRecord(record.metadata);
  const explicitSource =
    typeof metadata.verifierSource === 'string'
      ? metadata.verifierSource
      : typeof metadata.source === 'string'
        ? metadata.source
        : null;
  const normalizedExplicitSource = explicitSource?.trim().toLowerCase() ?? null;

  if (
    normalizedExplicitSource === 'self' ||
    normalizedExplicitSource === 'peer' ||
    normalizedExplicitSource === 'manager' ||
    normalizedExplicitSource === 'external'
  ) {
    return normalizedExplicitSource;
  }

  if (record.verifierProfileId && record.verifierProfileId === ownerId) {
    return 'self';
  }

  switch (record.verificationKind) {
    case 'skill_attestation_manager':
      return 'manager';
    case 'skill_attestation_peer':
      return 'peer';
    default:
      return 'external';
  }
}

function mapArtifactToLegacySkillProofRow(
  ownerId: string,
  artifact: ProofArtifactRow
): CanonicalLegacySkillProofRow {
  return {
    id: artifact.legacySourceId || artifact.id,
    skill_id: artifact.subjectId,
    profile_id: ownerId,
    proof_type: mapArtifactKindToLegacyProofType(artifact.artifactKind),
    title: artifact.title,
    description: artifact.description,
    url: artifact.sourceUrl,
    file_path: artifact.storagePath,
    issued_date: toLegacyDateString(artifact.issuedAt),
    expires_date: toLegacyDateString(artifact.expiresAt),
    created_at: toIsoString(artifact.createdAt),
    updated_at: toIsoString(artifact.updatedAt),
    metadata: toRecord(artifact.metadata),
    canonical_artifact_id: artifact.id,
  };
}

export function getProofFreshnessState(input: {
  issuedAt?: Date | string | null;
  expiresAt?: Date | string | null;
  updatedAt?: Date | string | null;
}): ProofFreshnessState {
  const now = new Date();
  const expiresAt = toDate(input.expiresAt);
  if (expiresAt && expiresAt.getTime() <= now.getTime()) {
    return 'expired';
  }

  const basis = toDate(input.updatedAt) || toDate(input.issuedAt);
  if (!basis) {
    return 'stale';
  }

  const ageDays = Math.floor((now.getTime() - basis.getTime()) / (24 * 60 * 60 * 1000));
  if (ageDays <= 90) return 'fresh';
  if (ageDays <= 180) return 'review_soon';
  if (ageDays <= 365) return 'stale';
  return 'expired';
}

export function summarizeProofFreshness(states: ProofFreshnessState[]): ProofFreshnessState {
  if (states.length === 0) {
    return 'stale';
  }
  if (states.includes('expired')) return 'expired';
  if (states.includes('stale')) return 'stale';
  if (states.includes('review_soon')) return 'review_soon';
  return 'fresh';
}

export function computeProofPackVerificationStatus(input: {
  pack: Pick<ProofPackRow, 'primarySubjectType' | 'primarySubjectId'>;
  items: CanonicalProofItemAggregate[];
  verificationReferences: VerificationRecordRow[];
}): ProofPackVerificationStatus {
  const active = input.verificationReferences.filter(
    (record) =>
      !['expired', 'superseded', 'cancelled', 'failed', 'declined'].includes(record.status)
  );

  if (
    active.some((record) =>
      ['disputed', 'contradicted', 'revoked', 'downgraded'].includes(record.status)
    )
  ) {
    return 'disputed';
  }

  const coverageTargets = new Set<string>();
  if (input.pack.primarySubjectType && input.pack.primarySubjectId) {
    coverageTargets.add(`subject:${input.pack.primarySubjectType}:${input.pack.primarySubjectId}`);
  }
  for (const item of input.items) {
    coverageTargets.add(`artifact:${item.artifact.id}`);
  }

  if (coverageTargets.size === 0) {
    return 'unverified';
  }

  const verifiedTargets = new Set<string>();
  for (const record of active) {
    if (record.status !== 'verified') {
      continue;
    }
    if (record.proofArtifactId) {
      verifiedTargets.add(`artifact:${record.proofArtifactId}`);
    } else {
      verifiedTargets.add(`subject:${record.subjectType}:${record.subjectId}`);
    }
  }

  if (verifiedTargets.size === 0) {
    return 'unverified';
  }

  const coveredCount = [...coverageTargets].filter((target) => verifiedTargets.has(target)).length;
  if (coveredCount === coverageTargets.size) {
    return 'verified';
  }

  return 'partially_verified';
}

function computePackEffectiveVisibility(
  pack: Pick<ProofPackRow, 'visibility' | 'revealGate'>,
  artifact: Pick<
    ProofArtifactRow,
    'visibility' | 'revealGate' | 'title' | 'artifactKind' | 'metadata' | 'sourceUrl'
  >,
  uploadedFile: CanonicalProofItemAggregate['uploadedFile']
) {
  const workflowRevealCeiling = resolveEffectiveRevealCeiling(pack.revealGate, artifact.revealGate);
  const policyCeiling = resolveEffectivePolicyCeiling({ artifact, uploadedFile });

  return computeEffectiveVisibility({
    parentMaxVisibility: pack.visibility,
    childVisibility: artifact.visibility,
    workflowRevealCeiling,
    policyCeiling,
    source: 'proof',
  });
}

function resolveRevealGateCeiling(
  revealGate: ProofArtifactRow['revealGate'] | ProofPackRow['revealGate']
) {
  switch (revealGate) {
    case 'match_exists':
      return 'matched_org' as const;
    case 'conversation_started':
      return 'owner_only' as const;
    case 'none':
    default:
      return 'public' as const;
  }
}

function resolveEffectiveRevealCeiling(
  packRevealGate: ProofPackRow['revealGate'],
  artifactRevealGate: ProofArtifactRow['revealGate']
) {
  const packCeiling = resolveRevealGateCeiling(packRevealGate);
  const artifactCeiling = resolveRevealGateCeiling(artifactRevealGate);

  return computeEffectiveVisibility({
    parentMaxVisibility: packCeiling,
    childVisibility: artifactCeiling,
    workflowRevealCeiling: 'public',
    policyCeiling: 'public',
    source: 'proof',
  });
}

function resolveEffectivePolicyCeiling(input: {
  artifact: Pick<ProofArtifactRow, 'title' | 'artifactKind' | 'metadata' | 'sourceUrl'>;
  uploadedFile: CanonicalProofItemAggregate['uploadedFile'];
}) {
  if (input.uploadedFile && isUploadHeldForPrivacyReview(input.uploadedFile)) {
    return 'owner_only' as const;
  }

  if (input.uploadedFile && input.uploadedFile.safeForPublic !== true) {
    return 'matched_org' as const;
  }

  const uploadMetadata = toRecord(input.uploadedFile?.metadata);
  const sensitivity = toRecord(uploadMetadata.sensitivity);
  if (sensitivity.sensitiveDocument === true) {
    return 'owner_only' as const;
  }

  const itemClass = resolveProofPackItemClass({
    artifact: input.artifact,
  });
  if (itemClass === 'engagement_evidence') {
    return 'owner_only' as const;
  }

  return 'public' as const;
}

function normalizeUploadDerivedLabel(value: string | null | undefined) {
  return value?.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
}

function deriveArtifactDisplayName(input: {
  artifact: Pick<ProofArtifactRow, 'title' | 'storagePath' | 'uploadedFileId'>;
  uploadedFile: CanonicalProofItemAggregate['uploadedFile'];
}) {
  if (!input.artifact.uploadedFileId || !input.uploadedFile) {
    return null;
  }

  return resolveArtifactDisplayName({
    sanitizedFilename: input.uploadedFile.sanitizedFilename ?? null,
    originalFilename: input.uploadedFile.originalFilename ?? null,
    detectedMime: input.uploadedFile.detectedMime ?? null,
    uploadKind: input.uploadedFile.uploadKind ?? null,
  });
}

function deriveSurfaceArtifactDisplayName(input: {
  artifact: Pick<ProofArtifactRow, 'uploadedFileId'>;
  uploadedFile: CanonicalProofItemAggregate['uploadedFile'];
  surface: 'owner' | 'review' | 'public';
}) {
  if (!input.artifact.uploadedFileId || !input.uploadedFile) {
    return null;
  }

  const uploadMetadata = toRecord(input.uploadedFile.metadata);
  const surfaceLabels = toRecord(uploadMetadata.surfaceLabels);
  const storedLabel = surfaceLabels[input.surface];

  if (typeof storedLabel === 'string' && storedLabel.trim()) {
    return storedLabel.trim();
  }

  return resolveArtifactDisplayNameForSurface(
    {
      sanitizedFilename: input.uploadedFile.sanitizedFilename ?? null,
      originalFilename: input.uploadedFile.originalFilename ?? null,
      detectedMime: input.uploadedFile.detectedMime ?? null,
      uploadKind: input.uploadedFile.uploadKind ?? null,
    },
    input.surface
  );
}

function shouldPreferUploadedArtifactDisplayName(input: {
  title: string | null | undefined;
  artifactDisplayName: string | null;
  storagePath: string | null | undefined;
}) {
  if (!input.artifactDisplayName) {
    return false;
  }

  const normalizedTitle = normalizeUploadDerivedLabel(input.title);
  if (!normalizedTitle) {
    return true;
  }

  if (normalizedTitle === normalizeUploadDerivedLabel(input.artifactDisplayName)) {
    return true;
  }

  if (normalizedTitle.startsWith('uploaded ')) {
    return true;
  }

  if (!input.storagePath) {
    return false;
  }

  const lastSegment = input.storagePath.split('/').filter(Boolean).pop() ?? null;
  if (!lastSegment) {
    return false;
  }

  return normalizedTitle === normalizeUploadDerivedLabel(lastSegment);
}

function resolvePublicSafePackTitle(input: {
  packTitle: string;
  items: CanonicalProofItemAggregate[];
  safeItems: Array<{ title: string }>;
}) {
  const replacementTitle = input.safeItems[0]?.title || 'Proof record';

  if (
    input.items.some(({ artifact, uploadedFile }) => {
      if (!uploadedFile) {
        return false;
      }

      return isUploadDerivedTitle(input.packTitle, {
        sanitizedFilename: uploadedFile.sanitizedFilename ?? null,
        originalFilename: uploadedFile.originalFilename ?? null,
        detectedMime: uploadedFile.detectedMime ?? null,
        uploadKind: uploadedFile.uploadKind ?? null,
      });
    })
  ) {
    return replacementTitle;
  }

  return input.packTitle;
}

export function buildCanonicalOwnerProofPackProjection(input: {
  pack: ProofPackRow;
  items: CanonicalProofItemAggregate[];
  verificationReferences: VerificationRecordRow[];
  verificationStatus: ProofPackVerificationStatus;
  freshnessState: ProofFreshnessState;
  latestEvidenceAt: Date | null;
}): CanonicalOwnerProofPackProjection {
  const portabilityMeta = toRecord(input.pack.portabilityMeta);
  const ownerItems = input.items.map(({ item, artifact, effectiveVisibility, uploadedFile }) => {
    const itemClass = resolveProofPackItemClass({ itemClass: item.itemClass, artifact });
    const subtypeMetadata = resolveProofPackItemSubtypeMetadata({
      subtypeMetadata: item.subtypeMetadata,
      artifact,
    });

    return {
      artifactId: artifact.id,
      position: item.position,
      itemClass,
      subtypeMetadata,
      includedFields: toStringArray(item.includedFields),
      effectiveVisibility,
      artifact: {
        id: artifact.id,
        subjectType: artifact.subjectType,
        subjectId: artifact.subjectId,
        artifactKind: artifact.artifactKind,
        lifecycleState: artifact.lifecycleState,
        title: artifact.title,
        artifactDisplayName: deriveArtifactDisplayName({ artifact, uploadedFile }),
        description: artifact.description,
        sourceUrl: artifact.sourceUrl,
        storagePath: artifact.storagePath,
        mimeType: artifact.mimeType,
        issuedAt: toIsoString(artifact.issuedAt),
        expiresAt: toIsoString(artifact.expiresAt),
        visibility: artifact.visibility,
        revealGate: artifact.revealGate,
        metadata: toRecord(artifact.metadata),
      },
    };
  });
  const contract = buildCanonicalProofPackContract({
    pack: input.pack,
    linkedEvidenceItems: ownerItems.map((item) => ({
      artifactId: item.artifactId,
      itemClass: item.itemClass,
      subtypeMetadata: item.subtypeMetadata,
      artifactKind: item.artifact.artifactKind,
      title: item.artifact.title,
      artifactDisplayName: item.artifact.artifactDisplayName,
      description: item.artifact.description,
      sourceUrl: item.artifact.sourceUrl,
      issuedAt: item.artifact.issuedAt,
      expiresAt: item.artifact.expiresAt,
      skillId: item.artifact.subjectType === 'skill' ? item.artifact.subjectId : null,
      semanticsNote: resolveProofEvidenceSemanticsNote({
        itemClass: item.itemClass,
        subtypeMetadata: item.subtypeMetadata,
      }),
    })),
    verificationReferences: input.verificationReferences,
    verificationStatus: input.verificationStatus,
    freshnessState: input.freshnessState,
    visibilityState: input.pack.visibility,
    lastVerifiedAt: toIsoString(input.pack.lastVerifiedAt),
  });

  return {
    id: input.pack.id,
    ownerType: input.pack.ownerType,
    ownerId: input.pack.ownerId,
    packKind: input.pack.packKind,
    primarySubjectType: input.pack.primarySubjectType,
    primarySubjectId: input.pack.primarySubjectId,
    lifecycleState: input.pack.lifecycleState,
    title: input.pack.title,
    summary: input.pack.summary,
    contextJson: toRecord(input.pack.contextJson),
    evidenceSummary: input.pack.evidenceSummary,
    outcomesSummary: input.pack.outcomesSummary,
    visibility: input.pack.visibility,
    revealGate: input.pack.revealGate,
    verificationStatus: input.verificationStatus,
    freshnessState: input.freshnessState,
    freshnessEvaluatedAt: toIsoString(input.pack.freshnessEvaluatedAt),
    lastVerifiedAt: toIsoString(input.pack.lastVerifiedAt),
    lastRefreshedAt: toIsoString(input.pack.lastRefreshedAt || input.latestEvidenceAt),
    portabilityMeta,
    contract,
    items: ownerItems,
    verificationReferences: input.verificationReferences.map((record) => ({
      id: record.id,
      subjectType: record.subjectType,
      subjectId: record.subjectId,
      proofArtifactId: record.proofArtifactId,
      verificationKind: record.verificationKind,
      verificationSlot: record.verificationSlot,
      status: record.status,
      integrityStatus: record.integrityStatus,
      disputeState: record.disputeState,
      verifiedAt: toIsoString(record.verifiedAt),
      expiresAt: toIsoString(record.expiresAt),
      lastRefreshedAt: toIsoString(record.lastRefreshedAt),
      metadata: toRecord(record.metadata),
    })),
  };
}

export function buildCanonicalPublicProofPackProjection(input: {
  pack: ProofPackRow;
  items: CanonicalProofItemAggregate[];
  verificationReferences: VerificationRecordRow[];
  verificationStatus: ProofPackVerificationStatus;
  freshnessState: ProofFreshnessState;
  latestEvidenceAt: Date | null;
}): CanonicalPublicSafeProofPackProjection | null {
  if (input.pack.visibility !== 'public') {
    return null;
  }

  const heldUploadArtifactTitles = new Set(
    input.items
      .filter(({ uploadedFile }) => uploadedFile && isUploadHeldForPrivacyReview(uploadedFile))
      .map(({ artifact }) => artifact.title)
  );

  const safeItems = input.items
    .filter(({ effectiveVisibility, artifact, uploadedFile }) => {
      if (!isPublicSafeVisibility(effectiveVisibility)) {
        return false;
      }
      if (artifact.deletedAt || artifact.revokedAt || artifact.lifecycleState === 'deleted') {
        return false;
      }
      if (uploadedFile && isUploadHeldForPrivacyReview(uploadedFile)) {
        return false;
      }
      if (uploadedFile && uploadedFile.safeForPublic !== true) {
        return false;
      }
      return true;
    })
    .map(({ item, artifact, uploadedFile }) => {
      const artifactDisplayName = deriveSurfaceArtifactDisplayName({
        artifact,
        uploadedFile,
        surface: 'public',
      });
      const title =
        artifactDisplayName &&
        uploadedFile &&
        isUploadDerivedTitle(artifact.title, {
          sanitizedFilename: uploadedFile.sanitizedFilename ?? null,
          originalFilename: uploadedFile.originalFilename ?? null,
          detectedMime: uploadedFile.detectedMime ?? null,
          uploadKind: uploadedFile.uploadKind ?? null,
        })
          ? artifactDisplayName
          : shouldPreferUploadedArtifactDisplayName({
                title: artifact.title,
                artifactDisplayName,
                storagePath: artifact.storagePath,
              })
            ? artifactDisplayName || artifact.title
            : artifact.title;
      const itemClass = resolveProofPackItemClass({ itemClass: item.itemClass, artifact });
      const subtypeMetadata = resolveProofPackItemSubtypeMetadata({
        subtypeMetadata: item.subtypeMetadata,
        artifact,
      });

      return {
        artifactId: artifact.id,
        position: item.position,
        itemClass,
        subtypeMetadata,
        semanticsNote: resolveProofEvidenceSemanticsNote({ itemClass, subtypeMetadata }),
        artifactKind: artifact.artifactKind,
        title,
        artifactDisplayName,
        description: artifact.description,
        sourceUrl: artifact.sourceUrl,
        issuedAt: toIsoString(artifact.issuedAt),
        expiresAt: toIsoString(artifact.expiresAt),
        skillId: artifact.subjectType === 'skill' ? artifact.subjectId : null,
      };
    });

  if (safeItems.length === 0) {
    return null;
  }

  const publicPackTitle = heldUploadArtifactTitles.has(input.pack.title)
    ? safeItems[0]?.title || 'Proof record'
    : resolvePublicSafePackTitle({
        packTitle: input.pack.title,
        items: input.items,
        safeItems,
      });

  const provenanceSummaryRaw =
    typeof toRecord(input.pack.portabilityMeta).provenanceSummary === 'string'
      ? (toRecord(input.pack.portabilityMeta).provenanceSummary as string)
      : null;
  const contract = buildCanonicalProofPackContract({
    pack: {
      ...input.pack,
      title: publicPackTitle,
    },
    linkedEvidenceItems: safeItems.map((item) => ({
      artifactId: item.artifactId,
      itemClass: item.itemClass,
      subtypeMetadata: item.subtypeMetadata,
      artifactKind: item.artifactKind,
      title: item.title,
      artifactDisplayName: item.artifactDisplayName,
      description: item.description,
      sourceUrl: item.sourceUrl,
      issuedAt: item.issuedAt,
      expiresAt: item.expiresAt,
      skillId: item.skillId,
      semanticsNote: item.semanticsNote,
    })),
    verificationReferences: input.verificationReferences,
    verificationStatus:
      input.verificationStatus === 'disputed' ? 'unverified' : input.verificationStatus,
    freshnessState: input.freshnessState,
    visibilityState: input.pack.visibility,
    lastVerifiedAt: toIsoString(input.pack.lastVerifiedAt),
  });

  return {
    id: input.pack.id,
    packKind: input.pack.packKind,
    primarySubjectType: input.pack.primarySubjectType,
    primarySubjectId: input.pack.primarySubjectId,
    lifecycleState: input.pack.lifecycleState,
    title: publicPackTitle,
    summary: input.pack.summary,
    evidenceSummary: input.pack.evidenceSummary,
    outcomesSummary: input.pack.outcomesSummary,
    verificationStatus:
      input.verificationStatus === 'disputed' ? 'unverified' : input.verificationStatus,
    freshnessState: input.freshnessState,
    lastVerifiedAt: toIsoString(input.pack.lastVerifiedAt),
    lastRefreshedAt: toIsoString(input.pack.lastRefreshedAt || input.latestEvidenceAt),
    provenanceSummary: provenanceSummaryRaw,
    portabilityMeta: toRecord(input.pack.portabilityMeta),
    contract,
    items: safeItems.map(({ skillId: _skillId, ...item }) => item),
  };
}

export function buildCanonicalProofPackPortabilityHash(
  scope: 'owner_full' | 'public_safe',
  projection: CanonicalOwnerProofPackProjection | CanonicalPublicSafeProofPackProjection | null
) {
  return stableHashPayload({
    exportScope: scope,
    proofPack: projection,
  });
}

function matchesVerificationRecordToPack(pack: ProofPackRow, record: VerificationRecordRow) {
  if (pack.primarySubjectType && pack.primarySubjectId) {
    return (
      record.subjectType === pack.primarySubjectType && record.subjectId === pack.primarySubjectId
    );
  }

  return false;
}

export async function getCanonicalProofPackAggregate(
  packId: string
): Promise<CanonicalProofPackAggregate | null> {
  const [pack] = await db.select().from(proofPacks).where(eq(proofPacks.id, packId)).limit(1);
  if (!pack || pack.deletedAt) {
    return null;
  }

  const aggregates = await listCanonicalProofPackAggregatesForOwner(pack.ownerType, pack.ownerId, {
    packIds: [packId],
  });

  return aggregates[0] ?? null;
}

export async function listCanonicalProofPackAggregatesForOwner(
  ownerType: ProofPackRow['ownerType'],
  ownerId: string,
  options?: {
    packIds?: string[];
    includeDeleted?: boolean;
  }
): Promise<CanonicalProofPackAggregate[]> {
  const whereClauses = [eq(proofPacks.ownerType, ownerType), eq(proofPacks.ownerId, ownerId)];

  if (options?.packIds?.length) {
    whereClauses.push(inArray(proofPacks.id, options.packIds));
  }
  if (!options?.includeDeleted) {
    whereClauses.push(isNull(proofPacks.deletedAt));
  }

  const packRows = await db
    .select()
    .from(proofPacks)
    .where(and(...whereClauses));

  if (packRows.length === 0) {
    return [];
  }

  const packById = new Map(packRows.map((pack) => [pack.id, pack]));
  const packIds = packRows.map((pack) => pack.id);
  const itemRows = await db
    .select()
    .from(proofPackItems)
    .where(inArray(proofPackItems.packId, packIds));
  const artifactIds = itemRows.map((item) => item.artifactId);
  const artifactRows =
    artifactIds.length > 0
      ? await db.select().from(proofArtifacts).where(inArray(proofArtifacts.id, artifactIds))
      : [];
  const uploadedFileIds = artifactRows
    .map((artifact) => artifact.uploadedFileId)
    .filter((value): value is string => typeof value === 'string' && value.length > 0);
  const uploadedFileRows =
    uploadedFileIds.length > 0
      ? await db
          .select({
            id: uploadedFiles.id,
            uploadKind: uploadedFiles.uploadKind,
            originalFilename: uploadedFiles.originalFilename,
            sanitizedFilename: uploadedFiles.sanitizedFilename,
            detectedMime: uploadedFiles.detectedMime,
            lifecycleState: uploadedFiles.lifecycleState,
            safetyStatus: uploadedFiles.safetyStatus,
            safetyReason: uploadedFiles.safetyReason,
            attachStatus: uploadedFiles.attachStatus,
            safeForPublic: uploadedFiles.safeForPublic,
            metadata: uploadedFiles.metadata,
          })
          .from(uploadedFiles)
          .where(inArray(uploadedFiles.id, uploadedFileIds))
      : [];

  const artifactById = new Map(artifactRows.map((artifact) => [artifact.id, artifact]));
  const uploadedFileById = new Map(uploadedFileRows.map((file) => [file.id, file]));
  const verificationRows = await db
    .select()
    .from(verificationRecords)
    .where(
      and(eq(verificationRecords.ownerType, ownerType), eq(verificationRecords.ownerId, ownerId))
    );

  const itemsByPackId = new Map<string, CanonicalProofItemAggregate[]>();
  for (const item of itemRows) {
    const artifact = artifactById.get(item.artifactId);
    if (!artifact) {
      continue;
    }

    const pack = packById.get(item.packId);
    if (!pack) {
      continue;
    }

    const aggregateItem: CanonicalProofItemAggregate = {
      item,
      artifact,
      effectiveVisibility: computePackEffectiveVisibility(
        pack,
        artifact,
        artifact.uploadedFileId ? (uploadedFileById.get(artifact.uploadedFileId) ?? null) : null
      ),
      uploadedFile: artifact.uploadedFileId
        ? (uploadedFileById.get(artifact.uploadedFileId) ?? null)
        : null,
    };

    const list = itemsByPackId.get(item.packId) ?? [];
    list.push(aggregateItem);
    itemsByPackId.set(item.packId, list);
  }

  return packRows.map((pack) => {
    const items = (itemsByPackId.get(pack.id) ?? []).sort((left, right) => {
      if (left.item.position !== right.item.position) {
        return left.item.position - right.item.position;
      }
      return left.artifact.title.localeCompare(right.artifact.title);
    });
    const artifactIdSet = new Set(items.map(({ artifact }) => artifact.id));
    const linkedVerificationReferences = verificationRows.filter(
      (record) =>
        (record.proofArtifactId && artifactIdSet.has(record.proofArtifactId)) ||
        matchesVerificationRecordToPack(pack, record)
    );
    const freshnessState = summarizeProofFreshness(
      items.map(({ artifact }) =>
        getProofFreshnessState({
          issuedAt: artifact.issuedAt,
          expiresAt: artifact.expiresAt,
          updatedAt: artifact.updatedAt,
        })
      )
    );
    const latestEvidenceAt = maxDate(
      items.map(({ artifact }) => toDate(artifact.updatedAt) || toDate(artifact.issuedAt))
    );
    const verificationStatus = computeProofPackVerificationStatus({
      pack,
      items,
      verificationReferences: linkedVerificationReferences,
    });
    const ownerFull = buildCanonicalOwnerProofPackProjection({
      pack,
      items,
      verificationReferences: linkedVerificationReferences,
      verificationStatus,
      freshnessState,
      latestEvidenceAt,
    });
    const publicSafe = buildCanonicalPublicProofPackProjection({
      pack,
      items,
      verificationReferences: linkedVerificationReferences,
      verificationStatus,
      freshnessState,
      latestEvidenceAt,
    });

    return {
      pack,
      items,
      verificationReferences: linkedVerificationReferences,
      verificationStatus,
      freshnessState,
      latestEvidenceAt,
      portabilityHashByScope: {
        owner_full: buildCanonicalProofPackPortabilityHash('owner_full', ownerFull),
        public_safe: buildCanonicalProofPackPortabilityHash('public_safe', publicSafe),
      },
      ownerFull,
      publicSafe,
    };
  });
}

export function summarizeCanonicalProofOwnerAggregates(
  aggregates: CanonicalProofPackAggregate[]
): CanonicalProofOwnerSummary {
  const verificationReferenceIds = new Set<string>();
  let activeVerificationCount = 0;
  let verifiedVerificationCount = 0;
  const artifactIds = new Set<string>();
  const publicArtifactIds = new Set<string>();
  const subjectSummaryByKey = new Map<
    string,
    CanonicalProofSubjectSummary & { artifactIds: Set<string>; publicArtifactIds: Set<string> }
  >();

  for (const aggregate of aggregates) {
    for (const record of aggregate.verificationReferences) {
      if (verificationReferenceIds.has(record.id)) {
        continue;
      }

      verificationReferenceIds.add(record.id);
      if (!['expired', 'superseded', 'cancelled', 'failed', 'declined'].includes(record.status)) {
        activeVerificationCount += 1;
      }
      if (record.status === 'verified' && record.integrityStatus === 'clear') {
        verifiedVerificationCount += 1;
      }
    }

    const subjectType = aggregate.pack.primarySubjectType ?? null;
    const subjectId = aggregate.pack.primarySubjectId ?? null;
    if (!subjectType || !subjectId) {
      continue;
    }

    const subjectKey = `${subjectType}:${subjectId}`;
    const existing = subjectSummaryByKey.get(subjectKey);
    const aggregateArtifactIds = aggregate.items.map(({ artifact }) => artifact.id);
    const aggregatePublicArtifactIds = aggregate.items
      .filter(
        ({ effectiveVisibility, artifact }) =>
          isPublicSafeVisibility(effectiveVisibility) &&
          !artifact.deletedAt &&
          !artifact.revokedAt &&
          artifact.lifecycleState !== 'deleted'
      )
      .map(({ artifact }) => artifact.id);
    aggregateArtifactIds.forEach((id) => artifactIds.add(id));
    aggregatePublicArtifactIds.forEach((id) => publicArtifactIds.add(id));

    const subjectArtifactIds = existing?.artifactIds ?? new Set<string>();
    const subjectPublicArtifactIds = existing?.publicArtifactIds ?? new Set<string>();
    aggregateArtifactIds.forEach((id) => subjectArtifactIds.add(id));
    aggregatePublicArtifactIds.forEach((id) => subjectPublicArtifactIds.add(id));

    const latestEvidenceAt = maxDate([
      existing?.latestEvidenceAt ? new Date(existing.latestEvidenceAt) : null,
      aggregate.latestEvidenceAt,
    ]);

    subjectSummaryByKey.set(subjectKey, {
      subjectType,
      subjectId,
      packCount: (existing?.packCount ?? 0) + 1,
      publicPackCount: (existing?.publicPackCount ?? 0) + (aggregate.publicSafe ? 1 : 0),
      artifactCount: subjectArtifactIds.size,
      publicArtifactCount: subjectPublicArtifactIds.size,
      freshnessState: summarizeProofFreshness([
        ...(existing ? [existing.freshnessState] : []),
        aggregate.freshnessState,
      ]),
      verificationStatus:
        existing &&
        statusRank(existing.verificationStatus) > statusRank(aggregate.verificationStatus)
          ? existing.verificationStatus
          : aggregate.verificationStatus,
      latestEvidenceAt: latestEvidenceAt?.toISOString() ?? null,
      hasPublicSignal: (existing?.hasPublicSignal ?? false) || Boolean(aggregate.publicSafe),
      hasVerifiedSignal:
        (existing?.hasVerifiedSignal ?? false) || aggregate.verificationStatus === 'verified',
      hasTrustedSignal:
        (existing?.hasTrustedSignal ?? false) ||
        aggregate.verificationStatus === 'verified' ||
        aggregate.verificationStatus === 'partially_verified',
      artifactIds: subjectArtifactIds,
      publicArtifactIds: subjectPublicArtifactIds,
    });
  }

  const subjectSummaries = [...subjectSummaryByKey.values()]
    .map(
      ({ artifactIds: _artifactIds, publicArtifactIds: _publicArtifactIds, ...summary }) => summary
    )
    .sort((left, right) =>
      `${left.subjectType}:${left.subjectId}`.localeCompare(
        `${right.subjectType}:${right.subjectId}`
      )
    );

  return {
    packCount: aggregates.length,
    publicPackCount: aggregates.filter((aggregate) => aggregate.publicSafe !== null).length,
    artifactCount: artifactIds.size,
    publicArtifactCount: publicArtifactIds.size,
    publicProofSignalCount: subjectSummaries.filter((summary) => summary.hasPublicSignal).length,
    verificationReferenceCount: verificationReferenceIds.size,
    activeVerificationCount,
    verifiedVerificationCount,
    subjectSummaries,
  };
}

export function summarizeCanonicalSkillProofSummaries(
  aggregates: CanonicalProofPackAggregate[]
): CanonicalSkillProofSummary[] {
  const skillSummaryById = new Map<
    string,
    CanonicalSkillProofSummary & {
      verificationRecordIds: Set<string>;
      artifactIds: Set<string>;
      publicArtifactIds: Set<string>;
    }
  >();

  for (const aggregate of aggregates) {
    if (aggregate.pack.primarySubjectType !== 'skill' || !aggregate.pack.primarySubjectId) {
      continue;
    }

    const skillId = aggregate.pack.primarySubjectId;
    const existing = skillSummaryById.get(skillId) ?? {
      skillId,
      proofCount: 0,
      publicProofCount: 0,
      verificationCount: 0,
      verificationSources: [],
      verificationStatus: 'unverified' as ProofPackVerificationStatus,
      freshnessState: aggregate.freshnessState,
      latestEvidenceAt: null,
      hasPublicSignal: false,
      hasTrustedSignal: false,
      proofs: [],
      verificationRecordIds: new Set<string>(),
      artifactIds: new Set<string>(),
      publicArtifactIds: new Set<string>(),
    };

    const activeItems = aggregate.items.filter(({ artifact }) => isActiveArtifactRow(artifact));
    const activeArtifactIds = new Set(activeItems.map(({ artifact }) => artifact.id));

    for (const { artifact } of activeItems) {
      if (existing.artifactIds.has(artifact.id)) {
        continue;
      }
      existing.artifactIds.add(artifact.id);
      existing.proofs.push(mapArtifactToLegacySkillProofRow(aggregate.pack.ownerId, artifact));
    }
    existing.proofCount = existing.artifactIds.size;

    for (const item of aggregate.publicSafe?.items ?? []) {
      existing.publicArtifactIds.add(item.artifactId);
    }
    existing.publicProofCount = existing.publicArtifactIds.size;

    if (skillSummaryById.has(skillId)) {
      existing.freshnessState = summarizeProofFreshness([
        existing.freshnessState,
        aggregate.freshnessState,
      ]);
    }
    if (statusRank(aggregate.verificationStatus) > statusRank(existing.verificationStatus)) {
      existing.verificationStatus = aggregate.verificationStatus;
    }

    const latestEvidenceAt = maxDate([
      existing.latestEvidenceAt ? new Date(existing.latestEvidenceAt) : null,
      aggregate.latestEvidenceAt,
    ]);
    existing.latestEvidenceAt = latestEvidenceAt?.toISOString() ?? null;
    existing.hasPublicSignal =
      existing.hasPublicSignal || Boolean((aggregate.publicSafe?.items.length ?? 0) > 0);
    existing.hasTrustedSignal =
      existing.hasTrustedSignal ||
      aggregate.verificationStatus === 'verified' ||
      aggregate.verificationStatus === 'partially_verified';

    for (const record of aggregate.verificationReferences) {
      const matchesSkillSubject =
        record.subjectType === 'skill' && record.subjectId === aggregate.pack.primarySubjectId;
      const matchesSkillArtifact = Boolean(
        record.proofArtifactId && activeArtifactIds.has(record.proofArtifactId)
      );

      if (!matchesSkillSubject && !matchesSkillArtifact) {
        continue;
      }
      if (record.status !== 'verified' || record.integrityStatus !== 'clear') {
        continue;
      }
      if (existing.verificationRecordIds.has(record.id)) {
        continue;
      }

      existing.verificationRecordIds.add(record.id);
      existing.verificationCount += 1;
      existing.verificationSources.push({
        source: mapVerificationSource(aggregate.pack.ownerId, record),
      });
    }

    skillSummaryById.set(skillId, existing);
  }

  return [...skillSummaryById.values()]
    .map(
      ({
        verificationRecordIds: _verificationRecordIds,
        artifactIds: _artifactIds,
        publicArtifactIds: _publicArtifactIds,
        ...summary
      }) => ({
        ...summary,
        proofs: summary.proofs.sort((left, right) => {
          const leftDate = left.created_at || left.updated_at || left.issued_date || '';
          const rightDate = right.created_at || right.updated_at || right.issued_date || '';
          return rightDate.localeCompare(leftDate);
        }),
      })
    )
    .sort((left, right) => left.skillId.localeCompare(right.skillId));
}

export async function listCanonicalSkillProofSummariesForOwner(ownerId: string) {
  const aggregates = await listCanonicalProofPackAggregatesForOwner('individual_profile', ownerId);
  return summarizeCanonicalSkillProofSummaries(aggregates);
}

export async function listCanonicalSkillProofRowsForOwnerSkill(ownerId: string, skillId: string) {
  const summaries = await listCanonicalSkillProofSummariesForOwner(ownerId);
  return summaries.find((summary) => summary.skillId === skillId)?.proofs ?? [];
}

export async function syncCanonicalProofPackState(packId: string) {
  const aggregate = await getCanonicalProofPackAggregate(packId);
  if (!aggregate) {
    return null;
  }

  const portabilityMeta = {
    ...toRecord(aggregate.pack.portabilityMeta),
    exportSchemaVersion: 'owner_full/v1',
    portabilityHash: aggregate.portabilityHashByScope.owner_full,
    publicSafePortabilityHash: aggregate.portabilityHashByScope.public_safe,
    provenanceSummary:
      typeof toRecord(aggregate.pack.portabilityMeta).provenanceSummary === 'string'
        ? toRecord(aggregate.pack.portabilityMeta).provenanceSummary
        : aggregate.ownerFull.summary ||
          aggregate.ownerFull.evidenceSummary ||
          aggregate.ownerFull.title,
  };

  const latestVerificationAt = maxDate(
    aggregate.verificationReferences.map((record) => toDate(record.verifiedAt))
  );
  const contract = aggregate.ownerFull.contract;

  const [updated] = await db
    .update(proofPacks)
    .set({
      primaryClaimType: contract.primaryClaim.type,
      roleContext: contract.roleContext,
      ownershipStatement: contract.ownershipStatement,
      timeframeLabel: contract.timeframe.label,
      verificationSummary: contract.verificationSummary.summary,
      verificationStatus: aggregate.verificationStatus,
      freshnessState: aggregate.freshnessState,
      proofQualityScore:
        contract.proofQualityScore != null ? contract.proofQualityScore.toString() : null,
      schemaVersion: contract.schemaVersion,
      freshnessEvaluatedAt: new Date(),
      lastVerifiedAt: latestVerificationAt ?? aggregate.pack.lastVerifiedAt ?? null,
      lastRefreshedAt: aggregate.latestEvidenceAt ?? aggregate.pack.lastRefreshedAt ?? null,
      portabilityMeta,
      updatedAt: new Date(),
    })
    .where(eq(proofPacks.id, packId))
    .returning();

  if (updated?.ownerType === 'individual_profile') {
    await revalidatePublicPortfolioByProfileId(updated.ownerId);
  } else if (updated?.ownerType === 'organization') {
    await revalidatePublicOrganizationPortfolioById(updated.ownerId);
  }

  return updated ?? null;
}

export async function listPublicSafeCanonicalProofPacksForOwner(
  ownerType: ProofPackRow['ownerType'],
  ownerId: string
) {
  const aggregates = await listCanonicalProofPackAggregatesForOwner(ownerType, ownerId);
  return aggregates
    .filter((aggregate) => aggregate.publicSafe !== null)
    .map((aggregate) => aggregate.publicSafe as CanonicalPublicSafeProofPackProjection);
}

export const PROOF_FRESHNESS_STATE_VALUES = proofFreshnessStates;
