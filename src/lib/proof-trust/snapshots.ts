import { and, desc, eq, inArray, sql } from 'drizzle-orm';

import { db } from '@/db';
import {
  individualProfiles,
  organizations,
  portfolioIndexingStates,
  portfolioPublicationStates,
  portfolioRobotsStates,
  portfolioSitemapStates,
  profiles,
  proofArtifacts,
  proofTrustSnapshots,
  skills,
  verificationRecords,
} from '@/db/schema';
import { getRows } from '@/lib/db/rows';
import { deriveEffectivePublicPortfolioState } from '@/lib/portfolio/public-contract';

export type ProofFreshnessState = 'fresh' | 'review_soon' | 'stale' | 'expired';
export type ProofTrustSnapshotContext = 'portfolio' | 'matching';
export type SnapshotSubjectType = 'individual_profile' | 'organization';
type PortfolioPublicationStateInsert = typeof portfolioPublicationStates.$inferInsert;
type PortfolioIndexingState = (typeof portfolioIndexingStates)[number];
type PortfolioRobotsState = (typeof portfolioRobotsStates)[number];
type PortfolioSitemapState = (typeof portfolioSitemapStates)[number];

const PROOF_FRESHNESS_THRESHOLDS = {
  freshDays: 90,
  reviewSoonDays: 180,
  staleDays: 365,
} as const;

type FreshnessDistribution = Record<ProofFreshnessState, number>;

function daysBetween(now: Date, target: Date) {
  return Math.floor((now.getTime() - target.getTime()) / (24 * 60 * 60 * 1000));
}

function clampRatio(value: number) {
  if (!Number.isFinite(value) || value < 0) return 0;
  if (value > 1) return 1;
  return Number(value.toFixed(4));
}

function roundMetric(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toFixed(2));
}

export function getProofFreshnessState(input: {
  issuedAt?: Date | string | null;
  expiresAt?: Date | string | null;
  updatedAt?: Date | string | null;
}): ProofFreshnessState {
  const now = new Date();
  const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
  if (expiresAt && expiresAt.getTime() <= now.getTime()) {
    return 'expired';
  }

  const basis = input.updatedAt
    ? new Date(input.updatedAt)
    : input.issuedAt
      ? new Date(input.issuedAt)
      : null;
  if (!basis || Number.isNaN(basis.getTime())) {
    return 'stale';
  }

  const ageDays = daysBetween(now, basis);
  if (ageDays <= PROOF_FRESHNESS_THRESHOLDS.freshDays) return 'fresh';
  if (ageDays <= PROOF_FRESHNESS_THRESHOLDS.reviewSoonDays) return 'review_soon';
  if (ageDays <= PROOF_FRESHNESS_THRESHOLDS.staleDays) return 'stale';
  return 'expired';
}

function summarizeFreshness(states: ProofFreshnessState[]): {
  rollup: ProofFreshnessState;
  distribution: FreshnessDistribution;
} {
  const distribution: FreshnessDistribution = {
    fresh: 0,
    review_soon: 0,
    stale: 0,
    expired: 0,
  };

  for (const state of states) {
    distribution[state] += 1;
  }

  if (distribution.expired > 0) return { rollup: 'expired', distribution };
  if (distribution.stale > 0) return { rollup: 'stale', distribution };
  if (distribution.review_soon > 0) return { rollup: 'review_soon', distribution };
  return { rollup: 'fresh', distribution };
}

function determineSuggestedActions(input: {
  publicSkillCount: number;
  proofBackedSkillCount: number;
  verificationCoverageRatio: number;
  freshnessState: ProofFreshnessState;
  trustSignalCoverageCount: number;
}) {
  const actions: string[] = [];

  if (
    input.publicSkillCount > 0 &&
    input.proofBackedSkillCount < Math.min(2, input.publicSkillCount)
  ) {
    actions.push('add_proof_to_more_public_skills');
  }
  if (input.verificationCoverageRatio < 0.5) {
    actions.push('request_more_verifications');
  }
  if (
    input.freshnessState === 'review_soon' ||
    input.freshnessState === 'stale' ||
    input.freshnessState === 'expired'
  ) {
    actions.push('refresh_outdated_proof');
  }
  if (input.trustSignalCoverageCount === 0) {
    actions.push('add_trust_signal');
  }

  return actions;
}

export async function computeProofTrustSnapshot(
  subjectType: SnapshotSubjectType,
  subjectId: string,
  context: ProofTrustSnapshotContext
) {
  if (subjectType !== 'individual_profile') {
    const emptySnapshot = {
      subjectType,
      subjectId,
      context,
      proofCoverageRatio: 0,
      proofBackedSkillCount: 0,
      publicSkillCount: 0,
      verificationCoverageRatio: 0,
      timeToVerifiedHoursP50: null,
      trustSignalCoverageCount: 0,
      trustSignalClassesPresent: [] as string[],
      proofFreshnessState: 'fresh' as ProofFreshnessState,
      proofFreshnessDistribution: { fresh: 0, review_soon: 0, stale: 0, expired: 0 },
      proofQuality: {
        coverageRatio: 0,
        freshnessRatio: 0,
        verificationCoverageRatio: 0,
        completenessRatio: 0,
      },
      proofQualitySummary: null,
      suggestedActions: [] as string[],
      computedAt: new Date(),
    };

    await db
      .insert(proofTrustSnapshots)
      .values({
        ...emptySnapshot,
        proofCoverageRatio: '0',
        verificationCoverageRatio: '0',
        proofFreshnessDistribution: emptySnapshot.proofFreshnessDistribution,
        proofQuality: emptySnapshot.proofQuality,
        computedAt: emptySnapshot.computedAt,
        updatedAt: emptySnapshot.computedAt,
      })
      .onConflictDoUpdate({
        target: [
          proofTrustSnapshots.subjectType,
          proofTrustSnapshots.subjectId,
          proofTrustSnapshots.context,
        ],
        set: {
          proofCoverageRatio: '0',
          proofBackedSkillCount: 0,
          publicSkillCount: 0,
          verificationCoverageRatio: '0',
          timeToVerifiedHoursP50: null,
          trustSignalCoverageCount: 0,
          trustSignalClassesPresent: [],
          proofFreshnessState: 'fresh',
          proofFreshnessDistribution: emptySnapshot.proofFreshnessDistribution,
          proofQuality: emptySnapshot.proofQuality,
          proofQualitySummary: null,
          suggestedActions: [],
          computedAt: emptySnapshot.computedAt,
          updatedAt: emptySnapshot.computedAt,
        },
      });

    return emptySnapshot;
  }

  const [publicSkillCountResult, artifactRows, verificationRows, medianRow, profileRow] =
    await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(skills)
        .where(eq(skills.profileId, subjectId)),
      db.query.proofArtifacts.findMany({
        where: and(
          eq(proofArtifacts.ownerType, 'individual_profile'),
          eq(proofArtifacts.ownerId, subjectId)
        ),
        orderBy: [desc(proofArtifacts.updatedAt)],
      }),
      db.query.verificationRecords.findMany({
        where: and(
          eq(verificationRecords.ownerType, 'individual_profile'),
          eq(verificationRecords.ownerId, subjectId),
          inArray(verificationRecords.status, [
            'pending',
            'verified',
            'expired',
            'failed',
            'declined',
            'cancelled',
          ])
        ),
        orderBy: [desc(verificationRecords.updatedAt)],
      }),
      db.execute(sql`
      SELECT
        PERCENTILE_CONT(0.5) WITHIN GROUP (
          ORDER BY EXTRACT(EPOCH FROM ((COALESCE(verified_at, completed_at)) - created_at)) / 3600
        ) AS p50
      FROM verification_records
      WHERE owner_type = 'individual_profile'
        AND owner_id = ${subjectId}::uuid
        AND status = 'verified'
        AND COALESCE(verified_at, completed_at) IS NOT NULL
    `),
      db
        .select({
          handle: profiles.handle,
          requestedState: profiles.publicPortfolioState,
          searchIndexingEnabledAt: profiles.searchIndexingEnabledAt,
          headline: individualProfiles.headline,
          bio: individualProfiles.bio,
          verificationStatus: individualProfiles.verificationStatus,
          verificationMethod: individualProfiles.verificationMethod,
          workEmailVerified: individualProfiles.workEmailVerified,
          linkedinVerificationLevel: individualProfiles.linkedinVerificationLevel,
          linkedinVerificationStatus: individualProfiles.linkedinVerificationStatus,
        })
        .from(profiles)
        .leftJoin(individualProfiles, eq(individualProfiles.userId, profiles.id))
        .where(eq(profiles.id, subjectId))
        .limit(1),
    ]);

  const publicSkillCount = Number(publicSkillCountResult[0]?.count || 0);
  const artifactBySkill = new Set(
    artifactRows
      .filter((row) => row.subjectType === 'skill' && row.subjectId)
      .map((row) => row.subjectId as string)
  );
  const proofBackedSkillCount = artifactBySkill.size;
  const proofCoverageRatio = clampRatio(
    publicSkillCount > 0 ? proofBackedSkillCount / publicSkillCount : 0
  );

  const freshnessStates = artifactRows.map((row) =>
    getProofFreshnessState({
      issuedAt: row.issuedAt,
      expiresAt: row.expiresAt,
      updatedAt: row.updatedAt,
    })
  );
  const freshnessSummary = summarizeFreshness(freshnessStates);
  const freshnessRatio =
    artifactRows.length > 0
      ? clampRatio(
          (freshnessSummary.distribution.fresh + freshnessSummary.distribution.review_soon * 0.5) /
            artifactRows.length
        )
      : 0;

  const verifiedVerificationSkillIds = new Set(
    verificationRows
      .filter((row) => row.status === 'verified' && row.subjectType === 'skill')
      .map((row) => row.subjectId)
  );
  const verificationCoverageRatio = clampRatio(
    proofBackedSkillCount > 0 ? verifiedVerificationSkillIds.size / proofBackedSkillCount : 0
  );

  const trustSignalClassesPresent = new Set<string>();
  const profile = profileRow[0];
  if (profile?.verificationStatus === 'verified') {
    trustSignalClassesPresent.add('identity_verified');
  }
  if (profile?.workEmailVerified) {
    trustSignalClassesPresent.add('workplace_verified');
  }
  if (profile?.linkedinVerificationLevel === 'workplace') {
    trustSignalClassesPresent.add('linkedin_workplace');
  }
  if (profile?.linkedinVerificationLevel === 'identity') {
    trustSignalClassesPresent.add('linkedin_identity');
  }
  if (
    verificationRows.some(
      (row) =>
        row.status === 'verified' &&
        ['skill_attestation_peer', 'skill_attestation_manager'].includes(row.verificationKind)
    )
  ) {
    trustSignalClassesPresent.add('accepted_skill_verification');
  }
  if (
    verificationRows.some(
      (row) => row.status === 'verified' && row.verificationKind === 'platform_manual_review'
    )
  ) {
    trustSignalClassesPresent.add('accepted_attestation');
  }

  const artifactCompletenessRatio =
    artifactRows.length > 0
      ? clampRatio(
          artifactRows.filter((row) =>
            Boolean(row.title && (row.sourceUrl || row.storagePath || row.description))
          ).length / artifactRows.length
        )
      : 0;

  const proofQuality = {
    coverageRatio: proofCoverageRatio,
    freshnessRatio,
    verificationCoverageRatio,
    completenessRatio: artifactCompletenessRatio,
  };
  const proofQualitySummary =
    artifactRows.length > 0 || publicSkillCount > 0
      ? roundMetric(
          proofCoverageRatio * 35 +
            freshnessRatio * 25 +
            verificationCoverageRatio * 25 +
            artifactCompletenessRatio * 15
        )
      : null;
  const trustSignalCoverageCount = trustSignalClassesPresent.size;
  const medianRows = getRows(medianRow as any) as Array<{ p50?: string | number | null }>;
  const timeToVerifiedHoursP50Raw = Number(medianRows[0]?.p50 ?? 0);
  const timeToVerifiedHoursP50 =
    Number.isFinite(timeToVerifiedHoursP50Raw) && timeToVerifiedHoursP50Raw > 0
      ? roundMetric(timeToVerifiedHoursP50Raw)
      : null;

  const suggestedActions = determineSuggestedActions({
    publicSkillCount,
    proofBackedSkillCount,
    verificationCoverageRatio,
    freshnessState: freshnessSummary.rollup,
    trustSignalCoverageCount,
  });

  const computedAt = new Date();
  const snapshot = {
    subjectType,
    subjectId,
    context,
    proofCoverageRatio,
    proofBackedSkillCount,
    publicSkillCount,
    verificationCoverageRatio,
    timeToVerifiedHoursP50,
    trustSignalCoverageCount,
    trustSignalClassesPresent: [...trustSignalClassesPresent].sort(),
    proofFreshnessState: freshnessSummary.rollup,
    proofFreshnessDistribution: freshnessSummary.distribution,
    proofQuality,
    proofQualitySummary,
    suggestedActions,
    computedAt,
  };

  await db
    .insert(proofTrustSnapshots)
    .values({
      subjectType,
      subjectId,
      context,
      proofCoverageRatio: snapshot.proofCoverageRatio.toString(),
      proofBackedSkillCount,
      publicSkillCount,
      verificationCoverageRatio: snapshot.verificationCoverageRatio.toString(),
      timeToVerifiedHoursP50:
        snapshot.timeToVerifiedHoursP50 != null ? snapshot.timeToVerifiedHoursP50.toString() : null,
      trustSignalCoverageCount,
      trustSignalClassesPresent: snapshot.trustSignalClassesPresent,
      proofFreshnessState: snapshot.proofFreshnessState,
      proofFreshnessDistribution: snapshot.proofFreshnessDistribution,
      proofQuality: snapshot.proofQuality,
      proofQualitySummary:
        snapshot.proofQualitySummary != null ? snapshot.proofQualitySummary.toString() : null,
      suggestedActions: snapshot.suggestedActions,
      computedAt,
      updatedAt: computedAt,
    })
    .onConflictDoUpdate({
      target: [
        proofTrustSnapshots.subjectType,
        proofTrustSnapshots.subjectId,
        proofTrustSnapshots.context,
      ],
      set: {
        proofCoverageRatio: snapshot.proofCoverageRatio.toString(),
        proofBackedSkillCount,
        publicSkillCount,
        verificationCoverageRatio: snapshot.verificationCoverageRatio.toString(),
        timeToVerifiedHoursP50:
          snapshot.timeToVerifiedHoursP50 != null
            ? snapshot.timeToVerifiedHoursP50.toString()
            : null,
        trustSignalCoverageCount,
        trustSignalClassesPresent: snapshot.trustSignalClassesPresent,
        proofFreshnessState: snapshot.proofFreshnessState,
        proofFreshnessDistribution: snapshot.proofFreshnessDistribution,
        proofQuality: snapshot.proofQuality,
        proofQualitySummary:
          snapshot.proofQualitySummary != null ? snapshot.proofQualitySummary.toString() : null,
        suggestedActions: snapshot.suggestedActions,
        computedAt,
        updatedAt: computedAt,
      },
    });

  return snapshot;
}

export async function computePortfolioPublicationState(
  subjectType: SnapshotSubjectType,
  subjectId: string
) {
  const now = new Date();

  if (subjectType === 'individual_profile') {
    const [row] = await db
      .select({
        requestedState: profiles.publicPortfolioState,
        searchIndexingEnabledAt: profiles.searchIndexingEnabledAt,
        handle: profiles.handle,
        headline: individualProfiles.headline,
        bio: individualProfiles.bio,
        redactMode: individualProfiles.redactMode,
      })
      .from(profiles)
      .leftJoin(individualProfiles, eq(individualProfiles.userId, profiles.id))
      .where(eq(profiles.id, subjectId))
      .limit(1);

    if (!row) {
      throw new Error('Profile not found');
    }

    const minimumContentMet = Boolean(row.handle && (row.headline || row.bio));
    const effectiveState = deriveEffectivePublicPortfolioState({
      requestedState: row.requestedState,
      searchIndexingEnabled: Boolean(row.searchIndexingEnabledAt),
      minimumContentMet,
      redactMode: Boolean(row.redactMode),
    });

    const indexingState: PortfolioIndexingState =
      effectiveState === 'public_indexable'
        ? 'indexable'
        : effectiveState === 'unavailable'
          ? 'unavailable'
          : 'noindex';
    const robotsState: PortfolioRobotsState =
      effectiveState === 'public_indexable' ? 'index_follow' : 'noindex_nofollow';
    const sitemapState: PortfolioSitemapState =
      effectiveState === 'public_indexable' ? 'included' : 'excluded';
    const reasonCodes = [
      !minimumContentMet ? 'minimum_content_missing' : null,
      row.redactMode ? 'redact_mode_enabled' : null,
      !row.searchIndexingEnabledAt && effectiveState !== 'unavailable'
        ? 'search_indexing_disabled'
        : null,
    ].filter((value): value is string => Boolean(value));

    const state: PortfolioPublicationStateInsert = {
      subjectType,
      subjectId,
      requestedState: row.requestedState,
      effectiveState,
      publicationState: effectiveState,
      indexingState,
      robotsState,
      sitemapState,
      reasonCodes,
      metadata: {
        minimumContentMet,
        handlePresent: Boolean(row.handle),
      },
      lastComputedAt: now,
    };

    await db
      .insert(portfolioPublicationStates)
      .values({
        ...state,
        updatedAt: now,
        createdAt: now,
      })
      .onConflictDoUpdate({
        target: [portfolioPublicationStates.subjectType, portfolioPublicationStates.subjectId],
        set: {
          requestedState: state.requestedState,
          effectiveState: state.effectiveState,
          publicationState: state.publicationState,
          indexingState: state.indexingState,
          robotsState: state.robotsState,
          sitemapState: state.sitemapState,
          reasonCodes: state.reasonCodes,
          metadata: state.metadata,
          lastComputedAt: now,
          updatedAt: now,
        },
      });

    return state;
  }

  const [organization] = await db
    .select({
      requestedState: organizations.publicPortfolioState,
      searchIndexingEnabledAt: organizations.searchIndexingEnabledAt,
      slug: organizations.slug,
      displayName: organizations.displayName,
      mission: organizations.mission,
      tagline: organizations.tagline,
      website: organizations.website,
    })
    .from(organizations)
    .where(eq(organizations.id, subjectId))
    .limit(1);

  if (!organization) {
    throw new Error('Organization not found');
  }

  const minimumContentMet = Boolean(
    organization.slug &&
      organization.displayName &&
      (organization.tagline || organization.mission || organization.website)
  );
  const effectiveState = deriveEffectivePublicPortfolioState({
    requestedState: organization.requestedState,
    searchIndexingEnabled: Boolean(organization.searchIndexingEnabledAt),
    minimumContentMet,
  });

  const indexingState: PortfolioIndexingState =
    effectiveState === 'public_indexable'
      ? 'indexable'
      : effectiveState === 'unavailable'
        ? 'unavailable'
        : 'noindex';
  const robotsState: PortfolioRobotsState =
    effectiveState === 'public_indexable' ? 'index_follow' : 'noindex_nofollow';
  const sitemapState: PortfolioSitemapState =
    effectiveState === 'public_indexable' ? 'included' : 'excluded';
  const reasonCodes = [
    !minimumContentMet ? 'minimum_content_missing' : null,
    !organization.searchIndexingEnabledAt && effectiveState !== 'unavailable'
      ? 'search_indexing_disabled'
      : null,
  ].filter((value): value is string => Boolean(value));

  const state: PortfolioPublicationStateInsert = {
    subjectType,
    subjectId,
    requestedState: organization.requestedState,
    effectiveState,
    publicationState: effectiveState,
    indexingState,
    robotsState,
    sitemapState,
    reasonCodes,
    metadata: {
      minimumContentMet,
      slugPresent: Boolean(organization.slug),
    },
    lastComputedAt: now,
  };

  await db
    .insert(portfolioPublicationStates)
    .values({
      ...state,
      updatedAt: now,
      createdAt: now,
    })
    .onConflictDoUpdate({
      target: [portfolioPublicationStates.subjectType, portfolioPublicationStates.subjectId],
      set: {
        requestedState: state.requestedState,
        effectiveState: state.effectiveState,
        publicationState: state.publicationState,
        indexingState: state.indexingState,
        robotsState: state.robotsState,
        sitemapState: state.sitemapState,
        reasonCodes: state.reasonCodes,
        metadata: state.metadata,
        lastComputedAt: now,
        updatedAt: now,
      },
    });

  return state;
}
