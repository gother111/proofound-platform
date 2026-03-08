import { and, eq, inArray, isNotNull, sql } from 'drizzle-orm';

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

export const READINESS_STATES = [
  'portfolio_ready',
  'browse_ready',
  'qualified_intro_ready',
] as const;

export type ReadinessState = (typeof READINESS_STATES)[number];
export type LegacyReadinessTier = 'none' | 'lite' | 'strong';

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

export type IndividualReadinessRequirementsByState = Record<ReadinessState, ReadinessRequirement[]>;

export type IndividualReadinessStateSnapshot = {
  states: ReadinessState[];
  highestState: ReadinessState | null;
  legacyTier: LegacyReadinessTier;
  publicPortfolioUrl: string | null;
  flags: IndividualReadinessFlags;
  counts: {
    skillsCount: number;
    skillsWithRecency: number;
    proofCount: number;
    publicProofSignalCount: number;
    proofBackedSkillCount: number;
    acceptedVerificationCount: number;
    verifiedTrustSignalCount: number;
  };
  missingByState: IndividualReadinessRequirementsByState;
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
      'Qualified introductions need at least two proof artifacts across distinct skills.',
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
      'Qualified introductions require a stronger trust signal such as work email, LinkedIn, or accepted verification.',
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

function resolveNumericRowValue(rows: unknown, key: string, fallback = 0): number {
  if (!Array.isArray(rows)) {
    return fallback;
  }

  const raw = (rows[0] as UnknownRow | undefined)?.[key];
  const numeric = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(numeric) ? numeric : fallback;
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
        (item) => item.id === 'proof_coverage' || item.id === 'proof_distribution'
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

export async function getIndividualReadinessState(
  userId: string
): Promise<IndividualReadinessStateSnapshot> {
  const queryDb = db as any;
  const [
    profileRow,
    individualRow,
    matchingRow,
    skillsCountRow,
    recencySkillsRow,
    proofCountRow,
    publicProofSignalRow,
    proofCoverageRow,
    acceptedVerificationCountRow,
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
      queryDb
        .select?.({ count: sql<number>`count(${skills.id})::int` })
        ?.from(skills)
        ?.where(eq(skills.profileId, userId))
    ),
    safeSelectRows(() =>
      queryDb
        .select?.({ count: sql<number>`count(${skills.id})::int` })
        ?.from(skills)
        ?.where(and(eq(skills.profileId, userId), isNotNull(skills.lastUsedAt)))
    ),
    safeSelectRows(() =>
      queryDb
        .select?.({ count: sql<number>`count(${skillProofs.id})::int` })
        ?.from(skillProofs)
        ?.where(eq(skillProofs.profileId, userId))
    ),
    safeSelectRows(() =>
      queryDb
        .select?.({
          count: sql<number>`count(${skillProofs.id}) filter (
            where coalesce(${skillProofs.metadata}->>'visibility', 'private') in ('public', 'network', 'network_only')
          )::int`,
        })
        ?.from(skillProofs)
        ?.where(eq(skillProofs.profileId, userId))
    ),
    safeSelectRows(() =>
      queryDb
        .select?.({
          distinctSkills: sql<number>`count(distinct ${skillProofs.skillId})::int`,
        })
        ?.from(skillProofs)
        ?.where(eq(skillProofs.profileId, userId))
    ),
    safeSelectRows(() =>
      queryDb
        .select?.({
          count: sql<number>`count(${skillVerificationRequests.id}) filter (
            where ${skillVerificationRequests.status} = 'accepted'
              and ${skillVerificationRequests.integrityStatus} = 'clear'
          )::int`,
        })
        ?.from(skillVerificationRequests)
        ?.where(eq(skillVerificationRequests.requesterProfileId, userId))
    ),
  ]);

  const profile = profileRow as ProfileRow;
  const individual = individualRow as IndividualProfileRow;
  const matching = matchingRow as MatchingProfileRow;

  const skillsCount = resolveNumericRowValue(skillsCountRow, 'count');
  const skillsWithRecency = resolveNumericRowValue(recencySkillsRow, 'count', skillsCount);
  const proofCount = resolveNumericRowValue(proofCountRow, 'count');
  const publicProofCount = resolveNumericRowValue(publicProofSignalRow, 'count', proofCount);
  const proofBackedSkillCount = resolveNumericRowValue(
    proofCoverageRow,
    'distinctSkills',
    proofCount
  );
  const acceptedVerificationCount = resolveNumericRowValue(acceptedVerificationCountRow, 'count');

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
  const hasCompensationRange =
    matching?.compMin != null && matching?.compMax != null && hasContent(matching?.currency);
  const hasLocationConstraint = hasContent(matching?.country) || hasContent(matching?.city);
  const hasIntroConstraints =
    hasContent(matching?.workMode) &&
    hasLocationConstraint &&
    hasAvailabilityWindow &&
    hasCompensationRange &&
    hasDesiredRoles;

  const linkedinLevel = individual?.linkedinVerificationLevel ?? 'unverified';
  const linkedinStatus = individual?.linkedinVerificationStatus ?? 'unverified';
  const hasTrustedSignal = Boolean(
    acceptedVerificationCount >= 1 ||
      individual?.workEmailVerified ||
      linkedinLevel === 'workplace' ||
      linkedinLevel === 'identity' ||
      (linkedinStatus === 'verified' && linkedinLevel !== 'unverified') ||
      individual?.verificationStatus === 'verified'
  );

  const verifiedTrustSignalCount = [
    acceptedVerificationCount >= 1,
    Boolean(individual?.workEmailVerified),
    linkedinLevel === 'workplace' || linkedinLevel === 'identity',
    individual?.verificationStatus === 'verified',
  ].filter(Boolean).length;

  const portfolioReady =
    hasDisplayName && hasHandle && hasHeadlineOrBio && hasPortfolioSkill && hasPublicProofSignal;
  const browseReady =
    skillsWithRecency >= 3 && hasMatchingProfile && hasIntentSignal && hasLogisticsSignal;
  const qualifiedIntroReady =
    browseReady &&
    skillsWithRecency >= 5 &&
    proofCount >= 2 &&
    proofBackedSkillCount >= 2 &&
    hasTrustedSignal &&
    hasIntroConstraints &&
    hasPurposeBlock;

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
        skillsWithRecency >= 3,
        skillsWithRecency,
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
        'Qualified introductions require stronger, fresher coverage than browse.',
        '/app/i/expertise',
        skillsWithRecency >= 5,
        skillsWithRecency,
        5
      ),
      buildRequirement(
        'proof_coverage',
        'Two proof artifacts',
        'Add at least two proof artifacts before qualified introductions unlock.',
        '/app/i/expertise',
        proofCount >= 2,
        proofCount,
        2
      ),
      buildRequirement(
        'proof_distribution',
        'Proof across distinct skills',
        'Spread proof across at least two skills or subjects to avoid thin evidence.',
        '/app/i/expertise',
        proofBackedSkillCount >= 2,
        proofBackedSkillCount,
        2
      ),
      buildRequirement(
        'trusted_signal',
        'Verified trust signal',
        'Add an accepted verification, work email, LinkedIn verification, or identity verification.',
        '/app/i/verifications',
        hasTrustedSignal,
        verifiedTrustSignalCount,
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

  return {
    states,
    highestState,
    legacyTier: qualifiedIntroReady ? 'strong' : browseReady ? 'lite' : 'none',
    publicPortfolioUrl: hasHandle
      ? `${(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')}/portfolio/${encodeURIComponent(profile?.handle as string)}`
      : null,
    flags: {
      portfolioReady,
      browseReady,
      qualifiedIntroReady,
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
      skillsWithRecency,
      proofCount,
      publicProofSignalCount: publicProofCount,
      proofBackedSkillCount,
      acceptedVerificationCount,
      verifiedTrustSignalCount,
    },
    missingByState,
    nextBestActions: buildNextBestActions(highestState, missingByState),
  };
}
