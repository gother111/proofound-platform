import { eq, sql } from 'drizzle-orm';

import { db } from '@/db';
import {
  individualProfiles,
  matches,
  profiles,
  skillProofs,
  skills,
  skillVerificationRequests,
} from '@/db/schema';
import { computeSkillGaps } from '@/lib/skills/gap-service';
import { getOrSetTtlCache, PLATFORM_PERF_CACHE_TTL_MS } from '@/lib/performance/ttl-cache';
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
  const [
    profileRow,
    individualRow,
    skillsCountRow,
    proofStatsRow,
    verificationStatsRow,
    matchStatsRow,
  ] = await Promise.all([
    db.query.profiles.findFirst({
      where: eq(profiles.id, userId),
    }),
    db.query.individualProfiles.findFirst({
      where: eq(individualProfiles.userId, userId),
    }),
    db
      .select({
        count: sql<number>`count(${skills.id})::int`,
      })
      .from(skills)
      .where(eq(skills.profileId, userId)),
    db
      .select({
        totalProofs: sql<number>`count(${skillProofs.id})::int`,
        verifiedProofs: sql<number>`count(${skillProofs.id}) filter (where ${skillProofs.verified} = true)::int`,
      })
      .from(skillProofs)
      .where(eq(skillProofs.profileId, userId)),
    db
      .select({
        pending: sql<number>`count(${skillVerificationRequests.id}) filter (where ${skillVerificationRequests.status} = 'pending')::int`,
        accepted: sql<number>`count(${skillVerificationRequests.id}) filter (where ${skillVerificationRequests.status} = 'accepted')::int`,
      })
      .from(skillVerificationRequests)
      .where(eq(skillVerificationRequests.requesterProfileId, userId)),
    db
      .select({
        totalMatches: sql<number>`count(${matches.id})::int`,
        highQualityMatches: sql<number>`count(${matches.id}) filter (where ${matches.score}::numeric >= 0.8)::int`,
      })
      .from(matches)
      .where(eq(matches.profileId, userId)),
  ]);

  const skillsCount = skillsCountRow[0]?.count ?? 0;
  const totalProofs = proofStatsRow[0]?.totalProofs ?? 0;
  const verifiedProofs = proofStatsRow[0]?.verifiedProofs ?? 0;
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

  if (skillsCount < 5) {
    topActions.push({
      id: 'add-skills',
      title: 'Add core skills to your Expertise Atlas',
      description: 'Profiles with at least 5 skills receive more relevant opportunities.',
      priority: 'high',
      category: 'expertise',
      actionUrl: '/app/i/expertise',
    });
  }

  if (totalProofs < 1) {
    topActions.push({
      id: 'add-first-proof',
      title: 'Add your first proof artifact',
      description: 'Attach a project link or credential to increase trust and ranking.',
      priority: 'high',
      category: 'verification',
      actionUrl: '/app/i/expertise?tab=proofs',
    });
  }

  if (acceptedVerifications < 1) {
    topActions.push({
      id: 'request-verification',
      title: 'Request one skill verification',
      description: 'Verification can materially increase your match confidence score.',
      priority: 'medium',
      category: 'verification',
      actionUrl: '/app/i/verifications',
    });
  }

  if (totalMatches === 0) {
    topActions.push({
      id: 'tune-matching-preferences',
      title: 'Tune matching preferences',
      description: 'Set role, location, and compensation constraints for better fit.',
      priority: 'medium',
      category: 'matching',
      actionUrl: '/app/i/matching/preferences',
    });
  }

  if (!individualRow?.mission) {
    topActions.push({
      id: 'complete-mission-block',
      title: 'Complete mission and values',
      description: 'Values alignment improves quality in purpose-first matching.',
      priority: 'medium',
      category: 'profile',
      actionUrl: '/app/i/profile',
    });
  }

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
    proofProgress,
    skillToOpportunityBridge,
    marketActivityLow: highQualityMatches < 3,
    metrics: {
      totalMatches,
      highQualityMatches,
      pendingVerifications,
      skillsCount,
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
