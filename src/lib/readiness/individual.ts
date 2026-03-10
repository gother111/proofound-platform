import { and, eq, sql } from 'drizzle-orm';

import { db } from '@/db';
import { individualProfiles, matches, profiles, skills, verificationRecords } from '@/db/schema';
import { computeSkillGaps } from '@/lib/skills/gap-service';
import { getOrSetTtlCache, PLATFORM_PERF_CACHE_TTL_MS } from '@/lib/performance/ttl-cache';
import { getIndividualReadinessState } from '@/lib/readiness/individual-state';
import {
  listCanonicalProofPackAggregatesForOwner,
  summarizeCanonicalProofOwnerAggregates,
} from '@/lib/proofs/canonical-pack';
import type {
  IndividualReadiness,
  ReadinessAction,
  ReadinessScoreBreakdown,
} from '@/lib/momentum/types';

const INDIVIDUAL_READINESS_CACHE_PREFIX = 'readiness:individual';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export async function getIndividualReadiness(userId: string): Promise<IndividualReadiness> {
  const readinessState = await getIndividualReadinessState(userId);
  const [profileRow, individualRow, canonicalAggregates, verificationStatsRow, matchStatsRow] =
    await Promise.all([
      db.query.profiles.findFirst({
        where: eq(profiles.id, userId),
      }),
      db.query.individualProfiles.findFirst({
        where: eq(individualProfiles.userId, userId),
      }),
      listCanonicalProofPackAggregatesForOwner('individual_profile', userId),
      db
        .select({
          pending: sql<number>`count(${verificationRecords.id}) filter (where ${verificationRecords.status} = 'pending')::int`,
          accepted: sql<number>`count(${verificationRecords.id}) filter (where ${verificationRecords.status} = 'verified' and ${verificationRecords.integrityStatus} = 'clear')::int`,
        })
        .from(verificationRecords)
        .where(
          and(
            eq(verificationRecords.ownerType, 'individual_profile'),
            eq(verificationRecords.ownerId, userId)
          )
        ),
      db
        .select({
          totalMatches: sql<number>`count(${matches.id})::int`,
          highQualityMatches: sql<number>`count(${matches.id}) filter (where ${matches.score}::numeric >= 0.8)::int`,
        })
        .from(matches)
        .where(eq(matches.profileId, userId)),
    ]);

  const skillsCount = readinessState.counts.skillsCount;
  const canonicalSummary = summarizeCanonicalProofOwnerAggregates(canonicalAggregates);
  const totalProofs = canonicalSummary.packCount;
  const verifiedProofs = canonicalAggregates.filter(
    (aggregate) =>
      aggregate.verificationStatus === 'verified' ||
      aggregate.verificationStatus === 'partially_verified'
  ).length;
  const pendingVerifications = verificationStatsRow[0]?.pending ?? 0;
  const acceptedVerifications = verificationStatsRow[0]?.accepted ?? 0;
  const totalMatches = matchStatsRow[0]?.totalMatches ?? 0;
  const highQualityMatches = matchStatsRow[0]?.highQualityMatches ?? 0;

  const profileChecks = [
    Boolean(profileRow?.displayName),
    Boolean(profileRow?.avatarUrl),
    Boolean(individualRow?.headline),
    Boolean(individualRow?.mission),
  ];

  const profileBasicsScore = Math.round(
    (profileChecks.filter(Boolean).length / profileChecks.length) * 25
  );

  const expertiseDepthScore = Math.round(clamp(skillsCount / 10, 0, 1) * 25);
  const proofsAndVerificationScore = Math.round(
    clamp(totalProofs / 3, 0, 1) * 12 + clamp(acceptedVerifications / 2, 0, 1) * 13
  );
  const matchingSignalScore = Math.round(
    clamp(totalMatches / 5, 0, 1) * 15 + clamp(highQualityMatches / 3, 0, 1) * 10
  );

  const scoreBreakdown: ReadinessScoreBreakdown[] = [
    {
      key: 'profile_basics',
      label: 'Profile Basics',
      score: profileBasicsScore,
      maxScore: 25,
      notes: 'Display name, avatar, headline, and mission',
    },
    {
      key: 'expertise_depth',
      label: 'Expertise Depth',
      score: expertiseDepthScore,
      maxScore: 25,
      notes: 'Skill coverage in your Expertise Atlas',
    },
    {
      key: 'proofs_verification',
      label: 'Proofs and Verification',
      score: proofsAndVerificationScore,
      maxScore: 25,
      notes: 'Evidence quality and verified signals',
    },
    {
      key: 'matching_signal',
      label: 'Matching Signal',
      score: matchingSignalScore,
      maxScore: 25,
      notes: 'Current real-match activity and quality',
    },
  ];

  const readinessScore = scoreBreakdown.reduce((sum, item) => sum + item.score, 0);

  const topActions: ReadinessAction[] = [];

  topActions.push(...readinessState.nextBestActions);

  const gapAnalysis = await computeSkillGaps({ profileId: userId, limitAssignments: 12 });

  const skillToOpportunityBridge = gapAnalysis.gaps.slice(0, 3).map((gap) => ({
    skillCode: gap.skillCode,
    skillName: gap.skillName,
    topRole: gap.assignments[0]?.role,
    currentLevel: gap.currentLevel,
    targetLevel: gap.targetLevel,
    expectedImpactMin: gap.expectedImpact.min,
    expectedImpactMax: gap.expectedImpact.max,
  }));

  const completionRate = totalProofs > 0 ? Math.round((verifiedProofs / totalProofs) * 100) : 0;
  const proofProgress = {
    totalProofs,
    verifiedProofs,
    pendingVerificationRequests: pendingVerifications,
    completionRate,
    nextStep:
      totalProofs === 0
        ? 'Upload your first proof'
        : pendingVerifications > 0
          ? `Follow up on ${pendingVerifications} pending verification request${
              pendingVerifications > 1 ? 's' : ''
            }`
          : 'Request a new verification for your strongest proof',
  };

  if (topActions.length === 0) {
    topActions.push({
      id: 'maintain-momentum',
      title: 'Maintain profile momentum',
      description: 'Keep proofs fresh and refresh matching preferences weekly.',
      priority: 'low',
      category: 'matching',
      actionUrl: '/app/i/home',
    });
  }

  return {
    readinessScore,
    scoreBreakdown,
    topActions: topActions.slice(0, 3),
    states: readinessState.states,
    highestState: readinessState.highestState,
    publicPortfolioUrl: readinessState.publicPortfolioUrl,
    missingByState: readinessState.missingByState,
    legacyTier: readinessState.legacyTier,
    trustLevel: readinessState.trustLevel,
    introEligibility: readinessState.introEligibility,
    flags: {
      portfolioReady: readinessState.flags.portfolioReady,
      browseReady: readinessState.flags.browseReady,
      qualifiedIntroReady: readinessState.flags.qualifiedIntroReady,
      discoverable: readinessState.flags.discoverable,
      matchVisible: readinessState.flags.matchVisible,
      introEligible: readinessState.flags.introEligible,
      stronglyTrusted: readinessState.flags.stronglyTrusted,
    },
    proofProgress,
    skillToOpportunityBridge,
    marketActivityLow: highQualityMatches < 3,
    metrics: {
      totalMatches,
      highQualityMatches,
      pendingVerifications,
      skillsCount,
      skillsWithRecency: readinessState.counts.skillsWithRecency,
      publicProofSignalCount: readinessState.counts.publicProofSignalCount,
      proofBackedSkillCount: readinessState.counts.proofBackedSkillCount,
      qualifyingProofLinkedL4Count: readinessState.counts.qualifyingProofLinkedL4Count,
      roleRelevantProofLinkedL4Count: readinessState.counts.roleRelevantProofLinkedL4Count,
      attestedProofLinkedSkillCount: readinessState.counts.attestedProofLinkedSkillCount,
      freshProofLinkedL4Count24: readinessState.counts.freshProofLinkedL4Count24,
      freshProofLinkedL4Count12: readinessState.counts.freshProofLinkedL4Count12,
      verifiedTrustSignalCount: readinessState.counts.verifiedTrustSignalCount,
      activeTrustAnchorCount: readinessState.counts.activeTrustAnchorCount,
      providerTrustAnchorCount: readinessState.counts.providerTrustAnchorCount,
    },
  };
}

export async function getIndividualReadinessCached(userId: string): Promise<IndividualReadiness> {
  return getOrSetTtlCache(
    `${INDIVIDUAL_READINESS_CACHE_PREFIX}:${userId}`,
    () => getIndividualReadiness(userId),
    { ttlMs: PLATFORM_PERF_CACHE_TTL_MS }
  );
}
