import { and, eq, inArray } from 'drizzle-orm';

import { db } from '@/db';
import {
  education,
  experiences,
  individualProfiles,
  matchingProfiles,
  portfolioPublicationStates,
  profiles,
  skills,
  volunteering,
} from '@/db/schema';
import type { ReadinessAction } from '@/lib/momentum/types';
import { isAccessiblePublicPortfolioState } from '@/lib/portfolio/public-contract';
import { evaluateIndividualProfileCompletion } from '@/lib/profile/completion-flow';
import {
  hasPrimaryAnchorContext,
  listCanonicalProofPackAggregatesForOwner,
  type CanonicalProofPackAggregate,
} from '@/lib/proofs/canonical-pack';

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
  'orphan_relevant_proof_blocking_intro',
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

export type LaunchReadinessDisplayLabel = 'Portfolio ready' | 'Match visible' | 'Intro eligible';

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
type PortfolioCompletionProfileRow = Pick<
  typeof profiles.$inferSelect,
  'id' | 'displayName' | 'handle' | 'publicPortfolioState'
> | null;
type PortfolioCompletionIndividualRow = Pick<
  typeof individualProfiles.$inferSelect,
  'userId' | 'headline' | 'bio' | 'location'
> | null;
type PortfolioCompletionMatchingRow = Pick<
  typeof matchingProfiles.$inferSelect,
  'profileId' | 'timezone' | 'desiredRoles' | 'workMode' | 'engagementType'
> | null;

const READINESS_EVENT_ACTIONS: Record<string, ReadinessAction> = {
  finish_safe_shell: {
    id: 'finish-safe-shell',
    title: 'Finish your safe shell',
    description:
      'Add the few basics that help people read your first proof: handle, headline, location, and work preferences.',
    priority: 'high',
    category: 'profile',
    actionUrl: '/app/i/profile',
  },
  add_anchor_context: {
    id: 'add-anchor-context',
    title: 'Add one real context',
    description:
      'Create one work, volunteering, or learning context so your first proof has a real anchor.',
    priority: 'high',
    category: 'profile',
    actionUrl: '/app/i/profile',
  },
  add_first_proof: {
    id: 'add-first-proof',
    title: 'Add your first proof',
    description:
      'Start with one real proof link or artifact. This is the fastest path into a shareable portfolio.',
    priority: 'high',
    category: 'profile',
    actionUrl: '/app/i/profile?profileView=full&tab=proof_packs',
  },
  structure_first_proof_pack: {
    id: 'structure-first-proof-pack',
    title: 'Structure first Proof Pack',
    description:
      'Turn the first proof into a clean Proof Pack with context, evidence, and outcomes.',
    priority: 'high',
    category: 'profile',
    actionUrl: '/app/i/profile?profileView=full&tab=proof_packs',
  },
  request_required_verification: {
    id: 'request-required-verification',
    title: 'Request required verification',
    description:
      'Add one accepted non-self verification tied to anchored proof before the Public Page can be ready.',
    priority: 'high',
    category: 'verification',
    actionUrl: '/app/i/verifications',
  },
  publish_portfolio: {
    id: 'publish-portfolio',
    title: 'Publish Public Page',
    description:
      'Choose one proof-backed public signal and publish the direct-link proof snapshot.',
    priority: 'high',
    category: 'profile',
    actionUrl: '/app/i/profile?profileView=full&tab=visibility',
  },
  preview_portfolio: {
    id: 'preview-portfolio',
    title: 'Preview your Public Page',
    description: 'Open your Public Page and confirm the proof you want to share.',
    priority: 'medium',
    category: 'profile',
    actionUrl: '/app/i/profile?profileView=full&tab=visibility',
  },
  set_browse_preferences: {
    id: 'set-browse-preferences',
    title: 'Set focus and work preferences',
    description:
      'Browse unlocks once your portfolio has a target role or focus plus work and engagement preferences.',
    priority: 'high',
    category: 'matching',
    actionUrl: '/app/i/matching/preferences',
  },
  strengthen_proof_coverage: {
    id: 'strengthen-proof-coverage',
    title: 'Strengthen anchored proof',
    description:
      'Introductions need anchored proof on relevant skills, with fresh evidence and no floating orphan packs.',
    priority: 'high',
    category: 'verification',
    actionUrl: '/app/i/profile?profileView=full&tab=proof_packs',
  },
  complete_intro_constraints: {
    id: 'complete-intro-constraints',
    title: 'Complete intro requirements',
    description:
      'Add role, availability, location, compensation, and engagement constraints before introductions unlock.',
    priority: 'high',
    category: 'matching',
    actionUrl: '/app/i/matching/preferences',
  },
  add_verified_signal: {
    id: 'add-verified-signal',
    title: 'Add one non-self trust signal',
    description:
      'Introductions require at least one active peer, manager, or external attestation tied to anchored proof.',
    priority: 'medium',
    category: 'verification',
    actionUrl: '/app/i/verifications',
  },
};

const DAYS_365 = 365 * 24 * 60 * 60 * 1000;
const RECENT_SKILL_WINDOW_MS = 3 * DAYS_365;
const FRESH_PROOF_WINDOW_MS = 2 * DAYS_365;
const VERY_FRESH_PROOF_WINDOW_MS = DAYS_365;
const NON_SELF_TRUST_KINDS = new Set([
  'skill_attestation_peer',
  'skill_attestation_manager',
  'impact_attestation',
]);

function hasContent(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasArrayContent(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
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
    if (missingByState.portfolio_ready.some((item) => item.id === 'safe_shell')) {
      actionIds.push('finish_safe_shell');
    }
    if (missingByState.portfolio_ready.some((item) => item.id === 'real_context')) {
      actionIds.push('add_anchor_context');
    }
    if (missingByState.portfolio_ready.some((item) => item.id === 'anchored_proof_pack')) {
      actionIds.push('structure_first_proof_pack');
    }
    if (missingByState.portfolio_ready.some((item) => item.id === 'required_verification')) {
      actionIds.push('request_required_verification');
    }
    if (missingByState.portfolio_ready.some((item) => item.id === 'published_portfolio')) {
      actionIds.push('publish_portfolio');
    }
  }

  if (highestState === 'portfolio_ready' || highestState === null) {
    if (
      missingByState.browse_ready.some((item) =>
        ['desired_roles', 'work_mode', 'engagement_type'].includes(item.id)
      )
    ) {
      actionIds.push('set_browse_preferences');
    }
  }

  if (highestState === 'browse_ready' || highestState === 'portfolio_ready') {
    if (
      missingByState.qualified_intro_ready.some((item) =>
        [
          'proof_coverage',
          'role_relevant_proof',
          'trusted_signal',
          'fresh_proof_24',
          'fresh_proof_12',
          'orphan_relevant_packs',
        ].includes(item.id)
      )
    ) {
      actionIds.push('strengthen_proof_coverage');
    }
    if (
      missingByState.qualified_intro_ready.some((item) =>
        [
          'work_mode',
          'engagement_type',
          'location',
          'availability',
          'compensation',
          'currency',
          'desired_roles',
        ].includes(item.id)
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

function hasActiveNonSelfTrustAnchor(
  record: CanonicalProofPackAggregate['verificationReferences'][number],
  seenRecordIds: Set<string>
) {
  if (seenRecordIds.has(record.id)) {
    return false;
  }

  if (!NON_SELF_TRUST_KINDS.has(record.verificationKind)) {
    return false;
  }

  if (record.status !== 'verified' || record.integrityStatus !== 'clear') {
    return false;
  }

  if (record.disputeState === 'open' || record.disputeState === 'under_review') {
    return false;
  }

  seenRecordIds.add(record.id);
  return true;
}

function collectAggregateSkillIds(aggregate: CanonicalProofPackAggregate) {
  const skillIds = new Set<string>();

  for (const item of aggregate.items) {
    if (item.artifact.subjectType === 'skill' && typeof item.artifact.subjectId === 'string') {
      skillIds.add(item.artifact.subjectId);
    }
  }

  for (const record of aggregate.verificationReferences) {
    if (record.subjectType === 'skill' && typeof record.subjectId === 'string') {
      skillIds.add(record.subjectId);
    }
  }

  return skillIds;
}

function intersectsSkillSet(skillIds: Set<string>, candidateIds: Set<string>) {
  for (const skillId of skillIds) {
    if (candidateIds.has(skillId)) {
      return true;
    }
  }

  return false;
}

type PortfolioCompletionSnapshotInput = {
  profile: PortfolioCompletionProfileRow;
  individual: PortfolioCompletionIndividualRow;
  matching: PortfolioCompletionMatchingRow;
  contextCount: number;
  skillsCount: number;
  proofCount: number;
  proofArtifactCount: number;
  anchoredProofPackCount: number;
  acceptedVerificationCount: number;
  publicProofCount: number;
  publishedPortfolio: boolean;
};

function dedupeRequirements(requirements: ReadinessRequirement[]) {
  const seen = new Set<string>();
  return requirements.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}

export function getLaunchReadinessDisplayLabel(flags: {
  matchVisible?: boolean;
  introEligible?: boolean;
}): LaunchReadinessDisplayLabel {
  if (flags.introEligible) return 'Intro eligible';
  if (flags.matchVisible) return 'Match visible';
  return 'Portfolio ready';
}

export function getLaunchReadinessSummary(flags: {
  portfolioReady?: boolean;
  matchVisible?: boolean;
  introEligible?: boolean;
}) {
  if (flags.introEligible) {
    return 'Your portfolio is live, matching is visible, and introductions can proceed when you choose.';
  }

  if (flags.matchVisible) {
    return 'Your proof is visible for matching. Stronger trust and intro settings still gate identity-bearing progress.';
  }

  if (flags.portfolioReady) {
    return 'Your portfolio foundation is in place. Strengthen matching signal next, then work toward introductions.';
  }

  return 'Start with one real context and one anchored proof. Portfolio-ready comes before matching.';
}

export function getLaunchReadinessBlockers(input: {
  flags: {
    portfolioReady?: boolean;
    matchVisible?: boolean;
    introEligible?: boolean;
  };
  missingByState: IndividualReadinessRequirementsByState;
}) {
  if (!input.flags.portfolioReady) {
    return input.missingByState.portfolio_ready.slice(0, 3);
  }

  if (!input.flags.matchVisible) {
    const matchVisibleIds = new Set([
      'desired_roles',
      'work_mode',
      'engagement_type',
      'proof_coverage',
      'role_relevant_proof',
      'location',
    ]);

    return dedupeRequirements([
      ...input.missingByState.browse_ready,
      ...input.missingByState.qualified_intro_ready.filter((item) => matchVisibleIds.has(item.id)),
    ]).slice(0, 3);
  }

  if (!input.flags.introEligible) {
    const introEligibleIds = new Set([
      'trusted_signal',
      'fresh_proof_24',
      'fresh_proof_12',
      'availability',
      'compensation',
      'currency',
      'orphan_relevant_packs',
    ]);

    return dedupeRequirements(
      input.missingByState.qualified_intro_ready.filter((item) => introEligibleIds.has(item.id))
    ).slice(0, 3);
  }

  return [];
}

export function getLaunchPrimaryAction(actions: ReadinessAction[]) {
  return actions[0] ?? null;
}

function buildPortfolioCompletionSnapshotInput(input: PortfolioCompletionSnapshotInput) {
  return {
    displayName: input.profile?.displayName ?? null,
    handle: input.profile?.handle ?? null,
    headline: input.individual?.headline ?? null,
    bio: input.individual?.bio ?? null,
    location: input.individual?.location ?? null,
    timezone: input.matching?.timezone ?? null,
    desiredRolesCount: Array.isArray(input.matching?.desiredRoles)
      ? input.matching.desiredRoles.length
      : 0,
    workPreference: input.matching?.workMode ?? null,
    engagementType: input.matching?.engagementType ?? null,
    contextCount: input.contextCount,
    skillsCount: input.skillsCount,
    proofCount: input.proofCount,
    proofArtifactCount: input.proofArtifactCount,
    anchoredProofPackCount: input.anchoredProofPackCount,
    acceptedVerificationCount: input.acceptedVerificationCount,
    publicProofCount: input.publicProofCount,
    publishedPortfolio: input.publishedPortfolio,
  };
}

function incrementOwnerCount(map: Map<string, number>, ownerId: string) {
  map.set(ownerId, (map.get(ownerId) ?? 0) + 1);
}

function countRowsByUserId<T extends { userId: string | null | undefined }>(
  rows: T[]
): Map<string, number> {
  const counts = new Map<string, number>();

  for (const row of rows) {
    if (typeof row.userId !== 'string' || row.userId.length === 0) {
      continue;
    }
    incrementOwnerCount(counts, row.userId);
  }

  return counts;
}

export async function getIndividualPortfolioReadinessMap(
  profileIds: string[]
): Promise<Map<string, boolean>> {
  const uniqueProfileIds = Array.from(
    new Set(profileIds.filter((profileId): profileId is string => typeof profileId === 'string'))
  );

  if (uniqueProfileIds.length === 0) {
    return new Map();
  }

  const queryDb = db as any;
  const [
    profileRows,
    individualRows,
    matchingRows,
    experienceRows,
    educationRows,
    volunteeringRows,
    publicationStateRows,
  ] = await Promise.all([
    safeSelectRows(() =>
      queryDb.query?.profiles?.findMany?.({
        where: inArray(profiles.id, uniqueProfileIds),
        columns: {
          id: true,
          displayName: true,
          handle: true,
          publicPortfolioState: true,
        },
      })
    ),
    safeSelectRows(() =>
      queryDb.query?.individualProfiles?.findMany?.({
        where: inArray(individualProfiles.userId, uniqueProfileIds),
        columns: {
          userId: true,
          headline: true,
          bio: true,
          location: true,
        },
      })
    ),
    safeSelectRows(() =>
      queryDb.query?.matchingProfiles?.findMany?.({
        where: inArray(matchingProfiles.profileId, uniqueProfileIds),
        columns: {
          profileId: true,
          timezone: true,
          desiredRoles: true,
          workMode: true,
          engagementType: true,
        },
      })
    ),
    safeSelectRows(() =>
      queryDb.query?.experiences?.findMany?.({
        where: inArray(experiences.userId, uniqueProfileIds),
        columns: { userId: true },
      })
    ),
    safeSelectRows(() =>
      queryDb.query?.education?.findMany?.({
        where: inArray(education.userId, uniqueProfileIds),
        columns: { userId: true },
      })
    ),
    safeSelectRows(() =>
      queryDb.query?.volunteering?.findMany?.({
        where: inArray(volunteering.userId, uniqueProfileIds),
        columns: { userId: true },
      })
    ),
    safeSelectRows(() =>
      queryDb.query?.portfolioPublicationStates?.findMany?.({
        where: and(
          eq(portfolioPublicationStates.subjectType, 'individual_profile'),
          inArray(portfolioPublicationStates.subjectId, uniqueProfileIds)
        ),
        columns: {
          subjectId: true,
          effectiveState: true,
        },
      })
    ),
  ]);

  const profileById = new Map(
    (
      profileRows as Array<
        Pick<typeof profiles.$inferSelect, 'id' | 'displayName' | 'handle' | 'publicPortfolioState'>
      >
    ).map((row) => [row.id, row])
  );
  const individualByUserId = new Map(
    (
      individualRows as Array<
        Pick<typeof individualProfiles.$inferSelect, 'userId' | 'headline' | 'bio' | 'location'>
      >
    ).map((row) => [row.userId, row])
  );
  const matchingByProfileId = new Map(
    (
      matchingRows as Array<
        Pick<
          typeof matchingProfiles.$inferSelect,
          'profileId' | 'timezone' | 'desiredRoles' | 'workMode' | 'engagementType'
        >
      >
    ).map((row) => [row.profileId, row])
  );
  const publicationStateBySubjectId = new Map(
    (
      publicationStateRows as Array<
        Pick<typeof portfolioPublicationStates.$inferSelect, 'subjectId' | 'effectiveState'>
      >
    ).map((row) => [row.subjectId, row.effectiveState])
  );

  const contextCountByUserId = new Map<string, number>();
  for (const counts of [
    countRowsByUserId(experienceRows as Array<{ userId: string | null }>),
    countRowsByUserId(educationRows as Array<{ userId: string | null }>),
    countRowsByUserId(volunteeringRows as Array<{ userId: string | null }>),
  ]) {
    for (const [userId, count] of counts.entries()) {
      contextCountByUserId.set(userId, (contextCountByUserId.get(userId) ?? 0) + count);
    }
  }

  const aggregateRowsByOwnerId = new Map<string, CanonicalProofPackAggregate[]>();
  await Promise.all(
    uniqueProfileIds.map(async (profileId) => {
      try {
        aggregateRowsByOwnerId.set(
          profileId,
          await listCanonicalProofPackAggregatesForOwner('individual_profile', profileId)
        );
      } catch {
        aggregateRowsByOwnerId.set(profileId, []);
      }
    })
  );

  const readinessByProfileId = new Map<string, boolean>();
  for (const profileId of uniqueProfileIds) {
    const profile = profileById.get(profileId) ?? null;
    const individual = individualByUserId.get(profileId) ?? null;
    const matching = matchingByProfileId.get(profileId) ?? null;
    const publicationEffectiveState =
      publicationStateBySubjectId.get(profileId) ?? profile?.publicPortfolioState ?? null;
    const publishedPortfolio =
      typeof publicationEffectiveState === 'string' &&
      isAccessiblePublicPortfolioState(publicationEffectiveState as any);
    const ownerAggregates = aggregateRowsByOwnerId.get(profileId) ?? [];
    const anchoredAggregates = ownerAggregates.filter((aggregate) =>
      hasPrimaryAnchorContext(aggregate.pack)
    );
    const seenTrustRecordIds = new Set<string>();
    const acceptedVerificationCount = anchoredAggregates.reduce(
      (count, aggregate) =>
        count +
        aggregate.verificationReferences.filter((record) =>
          hasActiveNonSelfTrustAnchor(record, seenTrustRecordIds)
        ).length,
      0
    );
    const anchoredProofPackCount = anchoredAggregates.length;
    const completionState = evaluateIndividualProfileCompletion(
      buildPortfolioCompletionSnapshotInput({
        profile,
        individual,
        matching,
        contextCount: contextCountByUserId.get(profileId) ?? 0,
        skillsCount: 0,
        proofCount: anchoredProofPackCount,
        proofArtifactCount: anchoredProofPackCount,
        anchoredProofPackCount,
        acceptedVerificationCount,
        publicProofCount: 0,
        publishedPortfolio,
      })
    );

    readinessByProfileId.set(profileId, completionState.isPortfolioReady);
  }

  return readinessByProfileId;
}

export async function getIndividualReadinessState(
  userId: string
): Promise<IndividualReadinessStateSnapshot> {
  const queryDb = db as any;
  const [
    profileRow,
    individualRow,
    matchingRow,
    skillRows,
    experienceRows,
    educationRows,
    volunteeringRows,
    publicationStateRow,
    canonicalAggregates,
  ] = await Promise.all([
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
      queryDb.query?.experiences?.findMany?.({
        where: eq(experiences.userId, userId),
        columns: { id: true },
      })
    ),
    safeSelectRows(() =>
      queryDb.query?.education?.findMany?.({
        where: eq(education.userId, userId),
        columns: { id: true },
      })
    ),
    safeSelectRows(() =>
      queryDb.query?.volunteering?.findMany?.({
        where: eq(volunteering.userId, userId),
        columns: { id: true },
      })
    ),
    safeFindFirst(() =>
      queryDb.query?.portfolioPublicationStates?.findFirst?.({
        where: and(
          eq(portfolioPublicationStates.subjectType, 'individual_profile'),
          eq(portfolioPublicationStates.subjectId, userId)
        ),
      })
    ),
    listCanonicalProofPackAggregatesForOwner('individual_profile', userId),
  ]);

  const profile = profileRow as ProfileRow;
  const individual = individualRow as IndividualProfileRow;
  const matching = matchingRow as MatchingProfileRow;
  const nowMs = Date.now();

  const skillRowsTyped = skillRows as Array<typeof skills.$inferSelect>;
  const skillsCount = skillRowsTyped.length;
  const contextCount = experienceRows.length + educationRows.length + volunteeringRows.length;

  const currentSkillIds = new Set(skillRowsTyped.map((skill) => skill.id));
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

  const proofFacingAggregates = canonicalAggregates.filter(
    (aggregate) => aggregate.pack.packKind === 'verification_bundle'
  );
  const anchoredAggregates = proofFacingAggregates.filter((aggregate) =>
    hasPrimaryAnchorContext(aggregate.pack)
  );
  const orphanAggregates = proofFacingAggregates.filter(
    (aggregate) => !hasPrimaryAnchorContext(aggregate.pack)
  );

  const proofBackedSkillIds = new Set<string>();
  const roleRelevantProofSkillIds = new Set<string>();
  const fresh24RoleRelevantSkillIds = new Set<string>();
  const fresh12RoleRelevantSkillIds = new Set<string>();
  const attestedSkillIds = new Set<string>();
  const seenTrustRecordIds = new Set<string>();

  let publicProofCount = 0;
  let freshRoleRelevantAnchoredPackCount = 0;
  let orphanRelevantPackCount = 0;
  let activeTrustAnchorCount = 0;

  for (const aggregate of anchoredAggregates) {
    const packSkillIds = collectAggregateSkillIds(aggregate);
    const isRoleRelevant = intersectsSkillSet(packSkillIds, recentSkillIds);
    const isFresh24 = isWithinWindow(aggregate.latestEvidenceAt, FRESH_PROOF_WINDOW_MS, nowMs);
    const isFresh12 = isWithinWindow(aggregate.latestEvidenceAt, VERY_FRESH_PROOF_WINDOW_MS, nowMs);

    if (aggregate.publicSafe !== null) {
      publicProofCount += 1;
    }

    for (const skillId of packSkillIds) {
      proofBackedSkillIds.add(skillId);
      if (recentSkillIds.has(skillId)) {
        roleRelevantProofSkillIds.add(skillId);
        if (isFresh24) {
          fresh24RoleRelevantSkillIds.add(skillId);
        }
        if (isFresh12) {
          fresh12RoleRelevantSkillIds.add(skillId);
        }
      }
    }

    if (isRoleRelevant && isFresh24) {
      freshRoleRelevantAnchoredPackCount += 1;
    }

    for (const record of aggregate.verificationReferences) {
      if (!hasActiveNonSelfTrustAnchor(record, seenTrustRecordIds)) {
        continue;
      }

      activeTrustAnchorCount += 1;
      if (record.subjectType === 'skill' && typeof record.subjectId === 'string') {
        attestedSkillIds.add(record.subjectId);
      }
    }
  }

  for (const aggregate of orphanAggregates) {
    const packSkillIds = collectAggregateSkillIds(aggregate);
    const relevantSkillUniverse = recentSkillIds.size > 0 ? recentSkillIds : currentSkillIds;
    if (intersectsSkillSet(packSkillIds, relevantSkillUniverse)) {
      orphanRelevantPackCount += 1;
    }
  }

  const proofBackedSkillCount = proofBackedSkillIds.size;
  const roleRelevantProofLinkedL4Count = roleRelevantProofSkillIds.size;
  const qualifyingProofLinkedL4Count = fresh24RoleRelevantSkillIds.size;
  const attestedProofLinkedSkillCount = [...attestedSkillIds].filter((skillId) =>
    proofBackedSkillIds.has(skillId)
  ).length;
  const acceptedVerificationCount = activeTrustAnchorCount;
  const verifiedTrustSignalCount = activeTrustAnchorCount;
  const providerTrustAnchorCount = 0;
  const publicationEffectiveState =
    (publicationStateRow as { effectiveState?: string | null } | null)?.effectiveState ??
    profile?.publicPortfolioState ??
    null;
  const publishedPortfolio =
    typeof publicationEffectiveState === 'string' &&
    isAccessiblePublicPortfolioState(publicationEffectiveState as any);

  const completionState = evaluateIndividualProfileCompletion(
    buildPortfolioCompletionSnapshotInput({
      profile,
      individual,
      matching,
      contextCount,
      skillsCount,
      proofCount: anchoredAggregates.length,
      proofArtifactCount: anchoredAggregates.reduce(
        (total, aggregate) => total + aggregate.items.length,
        0
      ),
      anchoredProofPackCount: anchoredAggregates.length,
      acceptedVerificationCount,
      publicProofCount,
      publishedPortfolio,
    })
  );

  const hasDisplayName = hasContent(profile?.displayName);
  const hasHandle = hasContent(profile?.handle);
  const hasHeadlineOrBio = hasContent(individual?.headline) || hasContent(individual?.bio);
  const hasPortfolioSkill = proofBackedSkillCount >= 1;
  const hasPublicProofSignal = publicProofCount >= 1;
  const hasMatchingProfile = Boolean(matching);
  const hasDesiredRoles = hasArrayContent(matching?.desiredRoles);
  const hasIntentSignal = hasDesiredRoles;
  const hasEngagementPreference = hasContent(matching?.engagementType);
  const hasLocationConstraint = hasContent(matching?.country) || hasContent(matching?.city);
  const hasLogisticsSignal =
    hasContent(matching?.workMode) ||
    hasEngagementPreference ||
    hasLocationConstraint ||
    hasContent(matching?.timezone);
  const hasAvailabilityWindow =
    matching?.availabilityEarliest != null && matching?.availabilityLatest != null;
  const hasBasicAvailability =
    matching?.availabilityEarliest != null || matching?.availabilityLatest != null;
  const hasCompensationRange =
    matching?.compMin != null && matching?.compMax != null && hasContent(matching?.currency);
  const hasIntroConstraints =
    hasContent(matching?.workMode) &&
    hasEngagementPreference &&
    hasLocationConstraint &&
    hasAvailabilityWindow &&
    hasCompensationRange &&
    hasDesiredRoles;
  const hasTrustedSignal = activeTrustAnchorCount >= 1;

  const portfolioReady = completionState.isPortfolioReady;
  const browseReady =
    portfolioReady && hasDesiredRoles && hasContent(matching?.workMode) && hasEngagementPreference;
  const discoverable = portfolioReady;
  const matchVisible =
    discoverable &&
    browseReady &&
    roleRelevantProofLinkedL4Count >= 3 &&
    anchoredAggregates.length >= 1 &&
    hasBasicAvailability &&
    hasLocationConstraint;
  const introEligible =
    matchVisible &&
    freshRoleRelevantAnchoredPackCount >= 1 &&
    hasTrustedSignal &&
    hasIntroConstraints &&
    orphanRelevantPackCount === 0;
  const stronglyTrusted =
    introEligible &&
    activeTrustAnchorCount >= 2 &&
    fresh12RoleRelevantSkillIds.size >= 1 &&
    orphanRelevantPackCount === 0;
  const qualifiedIntroReady = introEligible;

  const missingByState: IndividualReadinessRequirementsByState = {
    portfolio_ready: [
      buildRequirement(
        'safe_shell',
        'Safe shell',
        'Finish the shell with a real display name, handle, and headline or bio.',
        '/app/i/profile',
        completionState.checks.hasSafeShell
      ),
      buildRequirement(
        'real_context',
        'One real context',
        'Add at least one work, education-learning, or volunteering context.',
        '/app/i/profile',
        completionState.checks.hasRealContext,
        completionState.counts.contexts,
        1
      ),
      buildRequirement(
        'anchored_proof_pack',
        'Anchored Proof Pack',
        'Add at least one Proof Pack anchored to a real work, education, or volunteering context.',
        '/app/i/profile?profileView=full&tab=proof_packs',
        completionState.checks.hasStructuredProofPack,
        completionState.counts.anchoredProofPacks,
        1
      ),
      buildRequirement(
        'required_verification',
        'Accepted non-self verification',
        'Add one accepted peer, manager, or external verification tied to anchored proof before public visibility can unlock.',
        '/app/i/verifications',
        completionState.checks.hasRequiredVerification,
        completionState.counts.acceptedVerifications,
        1
      ),
      buildRequirement(
        'published_portfolio',
        'Published portfolio',
        'Publish the portfolio so verified anchored proof is accessible from your public page.',
        '/app/i/profile?profileView=full&tab=visibility',
        completionState.checks.hasPublishedPortfolio
      ),
    ].filter((item) => !item.met),
    browse_ready: [
      buildRequirement(
        'desired_roles',
        'Target role or focus',
        'Add at least one target role or focus area so browse stays relevant.',
        '/app/i/matching/preferences',
        hasDesiredRoles
      ),
      buildRequirement(
        'work_mode',
        'Work mode preference',
        'Add remote, hybrid, or on-site preference before browse unlocks.',
        '/app/i/matching/preferences',
        hasContent(matching?.workMode)
      ),
      buildRequirement(
        'engagement_type',
        'Engagement preference',
        'Add the engagement type you want so browse stays practical.',
        '/app/i/matching/preferences',
        hasEngagementPreference
      ),
    ].filter((item) => !item.met),
    qualified_intro_ready: [
      buildRequirement(
        'proof_coverage',
        'Three proof-backed role signals',
        'Introductions need at least three role-relevant skills or capabilities that resolve back to anchored Proof Packs.',
        '/app/i/profile?profileView=full&tab=proof_packs',
        roleRelevantProofLinkedL4Count >= 3,
        roleRelevantProofLinkedL4Count,
        3
      ),
      buildRequirement(
        'role_relevant_proof',
        'One fresh anchored pack',
        'At least one anchored Proof Pack must be both fresh and relevant to matching.',
        '/app/i/profile?profileView=full&tab=proof_packs',
        freshRoleRelevantAnchoredPackCount >= 1,
        freshRoleRelevantAnchoredPackCount,
        1
      ),
      buildRequirement(
        'trusted_signal',
        'Non-self trust anchor',
        'Add one active peer, manager, or external attestation tied to anchored proof or context.',
        '/app/i/verifications',
        hasTrustedSignal,
        activeTrustAnchorCount,
        1
      ),
      buildRequirement(
        'fresh_proof_24',
        'Fresh supporting proof',
        'Role-relevant anchored Proof Packs should include supporting evidence refreshed within the last 24 months.',
        '/app/i/profile?profileView=full&tab=proof_packs',
        fresh24RoleRelevantSkillIds.size >= 1,
        fresh24RoleRelevantSkillIds.size,
        1
      ),
      buildRequirement(
        'fresh_proof_12',
        'One current proof signal',
        'At least one role-relevant anchored Proof Pack should show evidence refreshed within the last 12 months.',
        '/app/i/profile?profileView=full&tab=proof_packs',
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
        'engagement_type',
        'Engagement preference',
        'Add the engagement type you can accept before introductions unlock.',
        '/app/i/matching/preferences',
        hasEngagementPreference
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
        'orphan_relevant_packs',
        'No orphan Proof Packs',
        'Re-anchor legacy or floating Proof Packs before introductions can unlock.',
        '/app/i/profile?profileView=full&tab=proof_packs',
        orphanRelevantPackCount === 0,
        orphanRelevantPackCount,
        0
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
  if (roleRelevantProofLinkedL4Count < 3) {
    introReasonCodes.push('recent_skills_insufficient');
  }
  if (proofBackedSkillCount < 1) {
    introReasonCodes.push('proof_linked_skills_insufficient');
  }
  if (freshRoleRelevantAnchoredPackCount < 1) {
    introReasonCodes.push('role_relevant_proof_insufficient');
  }
  if (!hasTrustedSignal) {
    introReasonCodes.push('trust_anchor_missing');
    introReasonCodes.push('trusted_or_attested_proof_missing');
  }
  if (fresh24RoleRelevantSkillIds.size < 1) {
    introReasonCodes.push('proof_freshness_insufficient');
  }
  if (fresh12RoleRelevantSkillIds.size < 1) {
    introReasonCodes.push('proof_recency_insufficient');
  }
  if (!hasIntroConstraints) {
    introReasonCodes.push('intro_preferences_incomplete');
  }
  if (orphanRelevantPackCount > 0) {
    introReasonCodes.push('orphan_relevant_proof_blocking_intro');
  }
  if (
    matchVisible &&
    !introEligible &&
    (freshRoleRelevantAnchoredPackCount < 1 ||
      fresh12RoleRelevantSkillIds.size < 1 ||
      !hasTrustedSignal ||
      orphanRelevantPackCount > 0)
  ) {
    introReasonCodes.push('trust_regressed');
  }

  const nextBestActions = buildNextBestActions(highestState, missingByState);
  const introEligibility: IntroEligibilitySummary = {
    status: introEligible ? 'eligible' : 'blocked_profile',
    profileEligible: introEligible,
    assignmentEligible: null,
    reasonCodes: introEligible ? [] : Array.from(new Set(introReasonCodes)),
    missingRequirements: missingByState.qualified_intro_ready,
    nextActions: nextBestActions,
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
      hasIntroConstraints,
      hasTrustedSignal,
    },
    counts: {
      skillsCount,
      skillsWithRecency: recentActiveSkillCount,
      proofCount: anchoredAggregates.length,
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
    nextBestActions,
  };
}
