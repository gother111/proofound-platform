import { eq } from 'drizzle-orm';

import { db } from '@/db';
import {
  individualProfiles,
  matchingProfiles,
  profiles,
  skillProofs,
  skills,
  skillVerificationRequests,
} from '@/db/schema';
import type { ReadinessAction } from '@/lib/momentum/types';
import {
  listVerificationRecordsForOwner,
  summarizeVerificationPolicy,
} from '@/lib/verification/policy';
import { resolveWorkEmailValidity } from '@/lib/verification/work-email-validity';

export const READINESS_STATES = [
  'portfolio_ready',
  'browse_ready',
  'qualified_intro_ready',
] as const;

export type ReadinessState = (typeof READINESS_STATES)[number];
export type LegacyReadinessTier = 'none' | 'lite' | 'strong';
export const TRUST_LEVELS = [
  'discoverable',
  'match_visible',
  'intro_eligible',
  'strongly_trusted',
] as const;

export type TrustLevel = (typeof TRUST_LEVELS)[number];
export type TrustLevelOrNone = TrustLevel | 'none';

export const INTRO_ELIGIBILITY_REASON_CODES = [
  'discoverable_requirements_incomplete',
  'match_visibility_requirements_incomplete',
  'recent_skills_insufficient',
  'proof_linked_skills_insufficient',
  'role_relevant_proof_insufficient',
  'assignment_relevant_proof_insufficient',
  'trusted_or_attested_proof_missing',
  'proof_freshness_insufficient',
  'proof_recency_insufficient',
  'intro_preferences_incomplete',
  'purpose_signal_missing',
  'trust_anchor_missing',
  'trust_regressed',
] as const;

export type IntroEligibilityReasonCode = (typeof INTRO_ELIGIBILITY_REASON_CODES)[number];

export type IntroEligibilityStatus = 'eligible' | 'blocked_profile' | 'blocked_assignment';

export type ReadinessRequirement = {
  id: string;
  label: string;
  detail: string;
  met: boolean;
  actionUrl: string;
  current?: number | boolean | string;
  required?: number | boolean | string;
};

export type IndividualReadinessFlags = {
  portfolioReady: boolean;
  browseReady: boolean;
  qualifiedIntroReady: boolean;
  discoverable: boolean;
  matchVisible: boolean;
  introEligible: boolean;
  stronglyTrusted: boolean;
  hasDisplayName: boolean;
  hasHandle: boolean;
  hasHeadlineOrBio: boolean;
  hasPortfolioSkill: boolean;
  hasPublicProofSignal: boolean;
  hasMatchingProfile: boolean;
  hasIntentSignal: boolean;
  hasLogisticsSignal: boolean;
  hasPurposeBlock: boolean;
  hasIntroConstraints: boolean;
  hasTrustedSignal: boolean;
};

export type IntroEligibilitySummary = {
  status: IntroEligibilityStatus;
  profileEligible: boolean;
  assignmentEligible: boolean | null;
  reasonCodes: IntroEligibilityReasonCode[];
  missingRequirements: ReadinessRequirement[];
  nextActions: ReadinessAction[];
  qualifyingProofLinkedL4Count: number;
  roleRelevantProofLinkedL4Count: number;
  assignmentRelevantProofLinkedL4Count: number;
  activeTrustAnchorCount: number;
};

export type IndividualReadinessRequirementsByState = Record<ReadinessState, ReadinessRequirement[]>;

export type IndividualReadinessStateSnapshot = {
  states: ReadinessState[];
  highestState: ReadinessState | null;
  legacyTier: LegacyReadinessTier;
  trustLevel: TrustLevelOrNone;
  publicPortfolioUrl: string | null;
  flags: IndividualReadinessFlags;
  counts: {
    skillsCount: number;
    skillsWithRecency: number;
    proofCount: number;
    publicProofSignalCount: number;
    proofBackedSkillCount: number;
    qualifyingProofLinkedL4Count: number;
    roleRelevantProofLinkedL4Count: number;
    attestedProofLinkedSkillCount: number;
    freshProofLinkedL4Count24: number;
    freshProofLinkedL4Count12: number;
    acceptedVerificationCount: number;
    verifiedTrustSignalCount: number;
    activeTrustAnchorCount: number;
    providerTrustAnchorCount: number;
  };
  missingByState: IndividualReadinessRequirementsByState;
  introEligibility: IntroEligibilitySummary;
  nextBestActions: ReadinessAction[];
};

type MatchingProfileRow = typeof matchingProfiles.$inferSelect | null;
type IndividualProfileRow = typeof individualProfiles.$inferSelect | null;
type ProfileRow = typeof profiles.$inferSelect | null;
type UnknownRow = Record<string, unknown>;

const READINESS_EVENT_ACTIONS: Record<string, ReadinessAction> = {
  add_public_basics: {
    id: 'add-public-basics',
    title: 'Complete your public basics',
    description: 'Add your name, handle, and a short headline so your portfolio can be shared.',
    priority: 'high',
    category: 'profile',
    actionUrl: '/app/i/profile',
  },
  add_first_proof_link: {
    id: 'add-first-proof-link',
    title: 'Add one proof link',
    description: 'Publish one proof-backed signal so your public portfolio becomes credible.',
    priority: 'high',
    category: 'expertise',
    actionUrl: '/app/i/expertise',
  },
  preview_portfolio: {
    id: 'preview-portfolio',
    title: 'Preview your public portfolio',
    description: 'Open your public portfolio and confirm the proof you want to share.',
    priority: 'medium',
    category: 'profile',
    actionUrl: '/app/i/portfolio',
  },
  add_recent_skills: {
    id: 'add-recent-skills',
    title: 'Add recent skills',
    description: 'Add at least 3 skills with last-used dates so browsing can be personalized.',
    priority: 'high',
    category: 'expertise',
    actionUrl: '/app/i/expertise',
  },
  set_browse_preferences: {
    id: 'set-browse-preferences',
    title: 'Set browse preferences',
    description:
      'Add one practical preference so browse results stay relevant without overfitting.',
    priority: 'high',
    category: 'matching',
    actionUrl: '/app/i/matching/preferences',
  },
  add_purpose_signal: {
    id: 'add-purpose-signal',
    title: 'Add mission, values, or causes',
    description:
      'A light purpose signal improves explainable browsing without making onboarding heavy.',
    priority: 'medium',
    category: 'profile',
    actionUrl: '/app/i/profile',
  },
  strengthen_proof_coverage: {
    id: 'strengthen-proof-coverage',
    title: 'Add stronger proof coverage',
    description:
      'Qualified introductions need proof linked across more relevant skills, with at least one trusted or attested proof.',
    priority: 'high',
    category: 'expertise',
    actionUrl: '/app/i/expertise',
  },
  complete_intro_constraints: {
    id: 'complete-intro-constraints',
    title: 'Complete intro requirements',
    description:
      'Add role, availability, location, and compensation constraints before qualified introductions unlock.',
    priority: 'high',
    category: 'matching',
    actionUrl: '/app/i/matching/preferences',
  },
  add_verified_signal: {
    id: 'add-verified-signal',
    title: 'Add one verified trust signal',
    description:
      'Qualified introductions require at least one active trust anchor and one trusted or attested proof-backed skill.',
    priority: 'medium',
    category: 'verification',
    actionUrl: '/app/i/verifications',
  },
};

function hasContent(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasArrayContent(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
}

function isPublicProofVisibility(value: unknown): boolean {
  return value === 'public' || value === 'network' || value === 'network_only';
}

function buildRequirement(
  id: string,
  label: string,
  detail: string,
  actionUrl: string,
  met: boolean,
  current?: number | boolean | string,
  required?: number | boolean | string
): ReadinessRequirement {
  return {
    id,
    label,
    detail,
    actionUrl,
    met,
    current,
    required,
  };
}

async function safeFindFirst<T>(
  operation: () => Promise<T | null | undefined> | T | null | undefined
) {
  try {
    return (await operation()) ?? null;
  } catch {
    return null;
  }
}

async function safeSelectRows<T extends UnknownRow>(
  operation: () => Promise<T[] | undefined> | T[] | undefined
): Promise<T[]> {
  try {
    const rows = await operation();
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function resolveHighestState(states: ReadinessState[]): ReadinessState | null {
  if (states.includes('qualified_intro_ready')) return 'qualified_intro_ready';
  if (states.includes('browse_ready')) return 'browse_ready';
  if (states.includes('portfolio_ready')) return 'portfolio_ready';
  return null;
}

function buildNextBestActions(
  highestState: ReadinessState | null,
  missingByState: IndividualReadinessRequirementsByState
): ReadinessAction[] {
  const actionIds: string[] = [];

  if (highestState === null) {
    if (missingByState.portfolio_ready.some((item) => item.id === 'display_name')) {
      actionIds.push('add_public_basics');
    }
    if (missingByState.portfolio_ready.some((item) => item.id === 'public_proof_signal')) {
      actionIds.push('add_first_proof_link');
    }
  }

  if (highestState === 'portfolio_ready' || highestState === null) {
    if (
      missingByState.browse_ready.some((item) => item.id === 'skills_with_recency') ||
      missingByState.browse_ready.some((item) => item.id === 'matching_profile')
    ) {
      actionIds.push('add_recent_skills');
    }
    if (
      missingByState.browse_ready.some((item) => item.id === 'intent_signal') ||
      missingByState.browse_ready.some((item) => item.id === 'logistics_signal')
    ) {
      actionIds.push('set_browse_preferences');
      actionIds.push('add_purpose_signal');
    }
  }

  if (highestState === 'browse_ready' || highestState === 'portfolio_ready') {
    if (
      missingByState.qualified_intro_ready.some(
        (item) =>
          item.id === 'proof_coverage' ||
          item.id === 'role_relevant_proof' ||
          item.id === 'fresh_proof_24' ||
          item.id === 'fresh_proof_12'
      )
    ) {
      actionIds.push('strengthen_proof_coverage');
    }
    if (
      missingByState.qualified_intro_ready.some(
        (item) => item.id === 'work_mode' || item.id === 'location' || item.id === 'availability'
      ) ||
      missingByState.qualified_intro_ready.some(
        (item) =>
          item.id === 'compensation' || item.id === 'currency' || item.id === 'desired_roles'
      )
    ) {
      actionIds.push('complete_intro_constraints');
    }
    if (missingByState.qualified_intro_ready.some((item) => item.id === 'trusted_signal')) {
      actionIds.push('add_verified_signal');
    }
  }

  if (highestState === 'qualified_intro_ready') {
    actionIds.push('preview_portfolio');
  }

  const deduped = Array.from(new Set(actionIds))
    .map((id) => READINESS_EVENT_ACTIONS[id])
    .filter(Boolean);

  if (deduped.length === 0) {
    deduped.push(READINESS_EVENT_ACTIONS.preview_portfolio);
  }

  return deduped.slice(0, 3);
}

const DAYS_365 = 365 * 24 * 60 * 60 * 1000;
const RECENT_SKILL_WINDOW_MS = 3 * DAYS_365;
const FRESH_PROOF_WINDOW_MS = 2 * DAYS_365;
const VERY_FRESH_PROOF_WINDOW_MS = DAYS_365;

function toTimestamp(value: Date | string | null | undefined): number | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  const timestamp = date.getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function isWithinWindow(
  value: Date | string | null | undefined,
  windowMs: number,
  nowMs: number
): boolean {
  const timestamp = toTimestamp(value);
  return timestamp !== null && timestamp >= nowMs - windowMs;
}

function toIsoString(value: Date | string | null | undefined): string | null | undefined {
  if (!value) return value;
  return value instanceof Date ? value.toISOString() : value;
}

function normalizeProofFingerprint(proof: typeof skillProofs.$inferSelect): string {
  return [
    proof.url?.trim().toLowerCase() || '',
    proof.filePath?.trim().toLowerCase() || '',
    proof.title.trim().toLowerCase(),
    proof.proofType,
  ].join('|');
}

export async function getIndividualReadinessState(
  userId: string
): Promise<IndividualReadinessStateSnapshot> {
  const queryDb = db as any;
  const [profileRow, individualRow, matchingRow, skillRows, proofRows, verificationRows] =
    await Promise.all([
      safeFindFirst(() =>
        queryDb.query?.profiles?.findFirst?.({
          where: eq(profiles.id, userId),
        })
      ),
      safeFindFirst(() =>
        queryDb.query?.individualProfiles?.findFirst?.({
          where: eq(individualProfiles.userId, userId),
        })
      ),
      safeFindFirst(() =>
        queryDb.query?.matchingProfiles?.findFirst?.({
          where: eq(matchingProfiles.profileId, userId),
        })
      ),
      safeSelectRows(() =>
        queryDb.query?.skills?.findMany?.({
          where: eq(skills.profileId, userId),
        })
      ),
      safeSelectRows(() =>
        queryDb.query?.skillProofs?.findMany?.({
          where: eq(skillProofs.profileId, userId),
        })
      ),
      safeSelectRows(() =>
        queryDb.query?.skillVerificationRequests?.findMany?.({
          where: eq(skillVerificationRequests.requesterProfileId, userId),
        })
      ),
    ]);

  const profile = profileRow as ProfileRow;
  const individual = individualRow as IndividualProfileRow;
  const matching = matchingRow as MatchingProfileRow;
  const nowMs = Date.now();

  const skillRowsTyped = skillRows as Array<typeof skills.$inferSelect>;
  const proofRowsTyped = proofRows as Array<typeof skillProofs.$inferSelect>;
  const verificationRowsTyped = verificationRows as Array<
    typeof skillVerificationRequests.$inferSelect
  >;

  const skillsCount = skillRowsTyped.length;
  const proofCount = proofRowsTyped.length;

  const publicProofCount = proofRowsTyped.filter((proof) =>
    isPublicProofVisibility((proof.metadata as Record<string, unknown> | null)?.visibility)
  ).length;

  const activeAcceptedVerificationRows = verificationRowsTyped.filter(
    (row) =>
      row.status === 'accepted' &&
      row.integrityStatus === 'clear' &&
      !row.revokedAt &&
      !row.cancelledAt &&
      isWithinWindow(row.respondedAt || row.createdAt, FRESH_PROOF_WINDOW_MS, nowMs)
  );

  const acceptedVerificationCount = verificationRowsTyped.filter(
    (row) => row.status === 'accepted' && row.integrityStatus === 'clear'
  ).length;

  const recentSkillIds = new Set(
    skillRowsTyped
      .filter(
        (skill) =>
          isWithinWindow(skill.lastUsedAt, RECENT_SKILL_WINDOW_MS, nowMs) ||
          skill.relevance === 'current' ||
          skill.relevance === 'emerging'
      )
      .map((skill) => skill.id)
  );
  const recentActiveSkillCount = recentSkillIds.size;

  const uniqueProofs = new Map<string, typeof skillProofs.$inferSelect>();
  for (const proof of proofRowsTyped) {
    if (proof.expiresDate && new Date(proof.expiresDate).getTime() < nowMs) {
      continue;
    }

    const fingerprint = normalizeProofFingerprint(proof);
    if (!uniqueProofs.has(fingerprint)) {
      uniqueProofs.set(fingerprint, proof);
    }
  }

  const proofSummaryBySkillId = new Map<
    string,
    {
      proofCount: number;
      latestProofAtMs: number | null;
      hasFresh24: boolean;
      hasFresh12: boolean;
    }
  >();

  for (const proof of uniqueProofs.values()) {
    const latestProofAtMs = toTimestamp(proof.issuedDate || proof.createdAt);
    const existing = proofSummaryBySkillId.get(proof.skillId) || {
      proofCount: 0,
      latestProofAtMs: null,
      hasFresh24: false,
      hasFresh12: false,
    };

    proofSummaryBySkillId.set(proof.skillId, {
      proofCount: existing.proofCount + 1,
      latestProofAtMs:
        existing.latestProofAtMs === null || (latestProofAtMs ?? 0) > existing.latestProofAtMs
          ? latestProofAtMs
          : existing.latestProofAtMs,
      hasFresh24:
        existing.hasFresh24 ||
        isWithinWindow(proof.issuedDate || proof.createdAt, FRESH_PROOF_WINDOW_MS, nowMs),
      hasFresh12:
        existing.hasFresh12 ||
        isWithinWindow(proof.issuedDate || proof.createdAt, VERY_FRESH_PROOF_WINDOW_MS, nowMs),
    });
  }

  const proofBackedSkillIds = new Set(proofSummaryBySkillId.keys());
  const proofBackedSkillCount = proofBackedSkillIds.size;

  const roleRelevantProofSkillIds = new Set(
    [...proofBackedSkillIds].filter((skillId) => recentSkillIds.has(skillId))
  );
  const roleRelevantProofLinkedL4Count = roleRelevantProofSkillIds.size;

  const fresh24SkillIds = new Set(
    [...proofSummaryBySkillId.entries()]
      .filter(([, summary]) => summary.hasFresh24)
      .map(([skillId]) => skillId)
  );
  const fresh12SkillIds = new Set(
    [...proofSummaryBySkillId.entries()]
      .filter(([, summary]) => summary.hasFresh12)
      .map(([skillId]) => skillId)
  );

  const attestedSkillIds = new Set(activeAcceptedVerificationRows.map((row) => row.skillId));
  const verifiedProofSkillIds = new Set(
    proofRowsTyped.filter((proof) => proof.verified).map((proof) => proof.skillId)
  );
  const trustedProofSkillIds = new Set([...attestedSkillIds, ...verifiedProofSkillIds]);
  const attestedProofLinkedSkillCount = [...attestedSkillIds].filter((skillId) =>
    proofBackedSkillIds.has(skillId)
  ).length;
  const trustedProofLinkedSkillCount = [...trustedProofSkillIds].filter((skillId) =>
    proofBackedSkillIds.has(skillId)
  ).length;
  const qualifyingProofSkillIds = new Set(
    [...roleRelevantProofSkillIds].filter((skillId) => fresh24SkillIds.has(skillId))
  );
  const qualifyingProofLinkedL4Count = qualifyingProofSkillIds.size;
  const qualifyingTrustedProofLinkedSkillCount = [...trustedProofSkillIds].filter((skillId) =>
    qualifyingProofSkillIds.has(skillId)
  ).length;
  const fresh24RoleRelevantSkillIds = new Set(
    [...roleRelevantProofSkillIds].filter((skillId) => fresh24SkillIds.has(skillId))
  );
  const fresh12RoleRelevantSkillIds = new Set(
    [...roleRelevantProofSkillIds].filter((skillId) => fresh12SkillIds.has(skillId))
  );

  const workEmailValidity = resolveWorkEmailValidity({
    work_email_verified: individual?.workEmailVerified,
    work_email_verified_at: toIsoString(individual?.workEmailVerifiedAt),
    work_email_reverify_due_at: toIsoString(individual?.workEmailReverifyDueAt),
    verified_at: toIsoString(individual?.verifiedAt),
  });
  const verificationRecords = await listVerificationRecordsForOwner(
    'individual_profile',
    userId
  ).catch(() => []);
  const verificationPolicy = summarizeVerificationPolicy({
    records: verificationRecords,
    legacyProfile: {
      verified: individual?.verified,
      verificationMethod: individual?.verificationMethod,
      verificationStatus: individual?.verificationStatus,
      verificationTier: individual?.verificationTier,
      verificationTierSource: individual?.verificationTierSource,
      workEmailCurrentlyVerified: workEmailValidity.isCurrentlyVerified,
      linkedinVerificationStatus: individual?.linkedinVerificationStatus,
      linkedinHasIdentityVerification: individual?.linkedinVerificationLevel === 'identity',
    },
  });

  const providerTrustAnchorCount = [
    verificationPolicy.slots.identity.activeTrust,
    verificationPolicy.slots.workplace.activeTrust,
  ].filter(Boolean).length;
  const activeTrustAnchorCount = providerTrustAnchorCount + trustedProofLinkedSkillCount;
  const hasOpenTrustIssue = verificationPolicy.activeIssues.some(
    (issue) => issue.slot === 'individual.identity' || issue.slot === 'individual.workplace'
  );

  const hasDisplayName = hasContent(profile?.displayName);
  const hasHandle = hasContent(profile?.handle);
  const hasHeadlineOrBio = hasContent(individual?.headline) || hasContent(individual?.bio);
  const hasPortfolioSkill = skillsCount >= 1;
  const hasPublicProofSignal =
    publicProofCount >= 1 ||
    (Boolean(individual?.fieldVisibility) &&
      typeof individual?.fieldVisibility === 'object' &&
      (individual?.fieldVisibility as Record<string, unknown>).proofBar === true &&
      acceptedVerificationCount >= 1);

  const hasMatchingProfile = Boolean(matching);
  const hasDesiredRoles = hasArrayContent(matching?.desiredRoles);
  const hasPurposeBlock =
    hasContent(individual?.mission) ||
    hasArrayContent(individual?.values) ||
    hasArrayContent(individual?.causes);
  const hasIntentSignal = hasPurposeBlock || hasDesiredRoles;
  const hasLogisticsSignal =
    hasContent(matching?.workMode) || hasContent(matching?.country) || hasContent(matching?.city);

  const hasAvailabilityWindow =
    matching?.availabilityEarliest != null && matching?.availabilityLatest != null;
  const hasBasicAvailability =
    matching?.availabilityEarliest != null || matching?.availabilityLatest != null;
  const hasCompensationRange =
    matching?.compMin != null && matching?.compMax != null && hasContent(matching?.currency);
  const hasLocationConstraint = hasContent(matching?.country) || hasContent(matching?.city);
  const hasIntroConstraints =
    hasContent(matching?.workMode) &&
    hasLocationConstraint &&
    hasAvailabilityWindow &&
    hasCompensationRange &&
    hasDesiredRoles;
  const hasTrustedSignal = activeTrustAnchorCount >= 1;
  const verifiedTrustSignalCount = activeTrustAnchorCount;

  const discoverable =
    hasDisplayName &&
    hasHandle &&
    hasHeadlineOrBio &&
    hasDesiredRoles &&
    recentActiveSkillCount >= 1 &&
    proofBackedSkillCount >= 1 &&
    hasLogisticsSignal;
  const matchVisible =
    discoverable &&
    recentActiveSkillCount >= 3 &&
    roleRelevantProofLinkedL4Count >= 2 &&
    fresh24RoleRelevantSkillIds.size >= 1 &&
    hasBasicAvailability &&
    hasContent(matching?.workMode) &&
    hasLocationConstraint;
  const introEligible =
    matchVisible &&
    recentActiveSkillCount >= 5 &&
    proofBackedSkillCount >= 4 &&
    roleRelevantProofLinkedL4Count >= 3 &&
    fresh24RoleRelevantSkillIds.size >= 3 &&
    fresh12RoleRelevantSkillIds.size >= 1 &&
    hasTrustedSignal &&
    hasIntroConstraints &&
    hasPurposeBlock &&
    qualifyingTrustedProofLinkedSkillCount >= 1;
  const stronglyTrusted =
    introEligible &&
    recentActiveSkillCount >= 8 &&
    proofBackedSkillCount >= 5 &&
    trustedProofLinkedSkillCount >= 2 &&
    activeTrustAnchorCount >= 2 &&
    providerTrustAnchorCount >= 1 &&
    fresh12RoleRelevantSkillIds.size >= 2 &&
    fresh24RoleRelevantSkillIds.size >= 3 &&
    !hasOpenTrustIssue;

  const portfolioReady =
    hasDisplayName && hasHandle && hasHeadlineOrBio && hasPortfolioSkill && hasPublicProofSignal;
  const browseReady =
    recentActiveSkillCount >= 3 && hasMatchingProfile && hasIntentSignal && hasLogisticsSignal;
  const qualifiedIntroReady = introEligible;

  const missingByState: IndividualReadinessRequirementsByState = {
    portfolio_ready: [
      buildRequirement(
        'display_name',
        'Display name',
        'Add the public name you want to share on your portfolio.',
        '/app/i/profile',
        hasDisplayName
      ),
      buildRequirement(
        'handle',
        'Public handle',
        'Choose a handle so your portfolio gets a stable public URL.',
        '/app/i/profile',
        hasHandle
      ),
      buildRequirement(
        'headline_or_bio',
        'Headline or short bio',
        'Add a short summary so the portfolio says what you do before someone opens proof.',
        '/app/i/profile',
        hasHeadlineOrBio
      ),
      buildRequirement(
        'portfolio_skill',
        'At least one skill',
        'Add one skill so your first proof has clear context.',
        '/app/i/expertise',
        hasPortfolioSkill,
        skillsCount,
        1
      ),
      buildRequirement(
        'public_proof_signal',
        'One public proof-backed signal',
        'Add one proof link and include it on your public portfolio.',
        '/app/i/expertise',
        hasPublicProofSignal,
        publicProofCount,
        1
      ),
    ].filter((item) => !item.met),
    browse_ready: [
      buildRequirement(
        'skills_with_recency',
        'Three recent skills',
        'Browsing becomes useful once at least three skills include last-used dates.',
        '/app/i/expertise',
        recentActiveSkillCount >= 3,
        recentActiveSkillCount,
        3
      ),
      buildRequirement(
        'matching_profile',
        'Browse profile',
        'Create a matching profile row so browse preferences have a place to live.',
        '/app/i/matching/preferences',
        hasMatchingProfile
      ),
      buildRequirement(
        'intent_signal',
        'Intent signal',
        'Add mission, values, causes, or desired roles so browse results stay explainable.',
        '/app/i/profile',
        hasIntentSignal
      ),
      buildRequirement(
        'logistics_signal',
        'One practical preference',
        'Add work mode or a location preference so browse results stay relevant.',
        '/app/i/matching/preferences',
        hasLogisticsSignal
      ),
    ].filter((item) => !item.met),
    qualified_intro_ready: [
      buildRequirement(
        'skills_with_recency',
        'Five recent skills',
        'Qualified introductions require at least five recent L4 skills.',
        '/app/i/expertise',
        recentActiveSkillCount >= 5,
        recentActiveSkillCount,
        5
      ),
      buildRequirement(
        'proof_coverage',
        'Four proof-linked L4 skills',
        'Qualified introductions require proof linked across at least four skills.',
        '/app/i/expertise',
        proofBackedSkillCount >= 4,
        proofBackedSkillCount,
        4
      ),
      buildRequirement(
        'role_relevant_proof',
        'Three role-relevant proof-linked skills',
        'For MVP, role relevance is proxied by recent active skills with proof attached.',
        '/app/i/expertise',
        roleRelevantProofLinkedL4Count >= 3,
        roleRelevantProofLinkedL4Count,
        3
      ),
      buildRequirement(
        'trusted_signal',
        'Trusted or attested proof-backed signal',
        'Add one active trust anchor and at least one trusted or attested proof-backed skill before introductions unlock.',
        '/app/i/verifications',
        hasTrustedSignal && qualifyingTrustedProofLinkedSkillCount >= 1,
        qualifyingTrustedProofLinkedSkillCount,
        1
      ),
      buildRequirement(
        'fresh_proof_24',
        'Three fresh proof-linked skills',
        'At least three qualifying proof-linked skills must be evidenced within the last 24 months.',
        '/app/i/expertise',
        fresh24RoleRelevantSkillIds.size >= 3,
        fresh24RoleRelevantSkillIds.size,
        3
      ),
      buildRequirement(
        'fresh_proof_12',
        'One very recent proof-linked skill',
        'At least one qualifying proof-linked skill must be evidenced within the last 12 months.',
        '/app/i/expertise',
        fresh12RoleRelevantSkillIds.size >= 1,
        fresh12RoleRelevantSkillIds.size,
        1
      ),
      buildRequirement(
        'work_mode',
        'Work mode',
        'Set remote, hybrid, or on-site preference for safe introductions.',
        '/app/i/matching/preferences',
        hasContent(matching?.workMode)
      ),
      buildRequirement(
        'location',
        'Country or city',
        'Add a location constraint before qualified introductions unlock.',
        '/app/i/matching/preferences',
        hasLocationConstraint
      ),
      buildRequirement(
        'availability',
        'Availability window',
        'Add earliest and latest availability so introductions stay relevant.',
        '/app/i/matching/preferences',
        hasAvailabilityWindow
      ),
      buildRequirement(
        'compensation',
        'Compensation range',
        'Add min and max compensation so introductions stay safe and transparent.',
        '/app/i/matching/preferences',
        matching?.compMin != null && matching?.compMax != null
      ),
      buildRequirement(
        'currency',
        'Compensation currency',
        'Set a currency to make your compensation range interpretable.',
        '/app/i/matching/preferences',
        hasContent(matching?.currency)
      ),
      buildRequirement(
        'desired_roles',
        'Desired roles',
        'Specify desired roles before receiving qualified introductions.',
        '/app/i/matching/preferences',
        hasDesiredRoles
      ),
      buildRequirement(
        'purpose_block',
        'Mission, values, or causes',
        'Qualified introductions need at least one purpose signal in place.',
        '/app/i/profile',
        hasPurposeBlock
      ),
    ].filter((item) => !item.met),
  };

  const states = READINESS_STATES.filter((state) => {
    switch (state) {
      case 'portfolio_ready':
        return portfolioReady;
      case 'browse_ready':
        return browseReady;
      case 'qualified_intro_ready':
        return qualifiedIntroReady;
      default:
        return false;
    }
  });

  const highestState = resolveHighestState(states);
  const trustLevel: TrustLevelOrNone = stronglyTrusted
    ? 'strongly_trusted'
    : introEligible
      ? 'intro_eligible'
      : matchVisible
        ? 'match_visible'
        : discoverable
          ? 'discoverable'
          : 'none';

  const introReasonCodes: IntroEligibilityReasonCode[] = [];
  if (!discoverable) {
    introReasonCodes.push('discoverable_requirements_incomplete');
  }
  if (!matchVisible) {
    introReasonCodes.push('match_visibility_requirements_incomplete');
  }
  if (recentActiveSkillCount < 5) {
    introReasonCodes.push('recent_skills_insufficient');
  }
  if (proofBackedSkillCount < 4) {
    introReasonCodes.push('proof_linked_skills_insufficient');
  }
  if (roleRelevantProofLinkedL4Count < 3) {
    introReasonCodes.push('role_relevant_proof_insufficient');
  }
  if (!hasTrustedSignal) {
    introReasonCodes.push('trust_anchor_missing');
  }
  if (qualifyingTrustedProofLinkedSkillCount < 1) {
    introReasonCodes.push('trusted_or_attested_proof_missing');
  }
  if (fresh24RoleRelevantSkillIds.size < 3) {
    introReasonCodes.push('proof_freshness_insufficient');
  }
  if (fresh12RoleRelevantSkillIds.size < 1) {
    introReasonCodes.push('proof_recency_insufficient');
  }
  if (!hasIntroConstraints) {
    introReasonCodes.push('intro_preferences_incomplete');
  }
  if (!hasPurposeBlock) {
    introReasonCodes.push('purpose_signal_missing');
  }
  if (
    matchVisible &&
    !introEligible &&
    (fresh24RoleRelevantSkillIds.size < 3 ||
      fresh12RoleRelevantSkillIds.size < 1 ||
      hasOpenTrustIssue ||
      !hasTrustedSignal)
  ) {
    introReasonCodes.push('trust_regressed');
  }

  const introEligibility: IntroEligibilitySummary = {
    status: introEligible ? 'eligible' : 'blocked_profile',
    profileEligible: introEligible,
    assignmentEligible: null,
    reasonCodes: introEligible ? [] : Array.from(new Set(introReasonCodes)),
    missingRequirements: missingByState.qualified_intro_ready,
    nextActions: buildNextBestActions(highestState, missingByState),
    qualifyingProofLinkedL4Count,
    roleRelevantProofLinkedL4Count,
    assignmentRelevantProofLinkedL4Count: 0,
    activeTrustAnchorCount,
  };

  return {
    states,
    highestState,
    legacyTier: qualifiedIntroReady ? 'strong' : browseReady ? 'lite' : 'none',
    trustLevel,
    publicPortfolioUrl: hasHandle
      ? `${(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')}/portfolio/${encodeURIComponent(profile?.handle as string)}`
      : null,
    flags: {
      portfolioReady,
      browseReady,
      qualifiedIntroReady,
      discoverable,
      matchVisible,
      introEligible,
      stronglyTrusted,
      hasDisplayName,
      hasHandle,
      hasHeadlineOrBio,
      hasPortfolioSkill,
      hasPublicProofSignal,
      hasMatchingProfile,
      hasIntentSignal,
      hasLogisticsSignal,
      hasPurposeBlock,
      hasIntroConstraints,
      hasTrustedSignal,
    },
    counts: {
      skillsCount,
      skillsWithRecency: recentActiveSkillCount,
      proofCount,
      publicProofSignalCount: publicProofCount,
      proofBackedSkillCount,
      qualifyingProofLinkedL4Count,
      roleRelevantProofLinkedL4Count,
      attestedProofLinkedSkillCount,
      freshProofLinkedL4Count24: fresh24RoleRelevantSkillIds.size,
      freshProofLinkedL4Count12: fresh12RoleRelevantSkillIds.size,
      acceptedVerificationCount,
      verifiedTrustSignalCount,
      activeTrustAnchorCount,
      providerTrustAnchorCount,
    },
    missingByState,
    introEligibility,
    nextBestActions: introEligibility.nextActions,
  };
}
