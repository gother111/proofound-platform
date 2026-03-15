import { and, desc, eq, inArray } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import {
  assignments,
  individualProfiles,
  matchReviewStates,
  matches,
  matchingProfiles,
  profiles,
} from '@/db/schema';
import { isActiveOrgMember, requireMobileAuth } from '@/lib/api/mobile/auth';
import { mobileError, mobileSuccess } from '@/lib/api/mobile/response';
import {
  buildCandidateReviewProjection,
  buildVisibilitySafeWhy,
  getRankBand,
  getVisibleIdentityFields,
  normalizeFairnessStatus,
  resolveCanonicalCorridor,
  resolveCanonicalFallbackState,
  shouldSuppressExactRank,
} from '@/lib/matching/review-contract';

export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  orgId: z.string().uuid(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireMobileAuth(request);
    if ('status' in auth) {
      return auth;
    }

    const parsedQuery = QuerySchema.safeParse({
      orgId: request.nextUrl.searchParams.get('orgId'),
    });

    if (!parsedQuery.success) {
      return mobileError('validation_error', 'orgId query parameter is required', 400);
    }

    const { orgId } = parsedQuery.data;
    const canAccess = await isActiveOrgMember(auth.user.id, orgId, [
      'org_owner',
      'org_manager',
      'org_reviewer',
    ]);

    if (!canAccess) {
      return mobileError('forbidden', 'Organization membership required', 403);
    }

    const shortlist = await db
      .select({
        matchId: matches.id,
        assignmentId: assignments.id,
        assignmentRole: assignments.role,
        assignmentStatus: assignments.status,
        profileId: profiles.id,
        displayName: profiles.displayName,
        handle: profiles.handle,
        avatarUrl: profiles.avatarUrl,
        headline: individualProfiles.headline,
        tagline: individualProfiles.tagline,
        desiredRoles: matchingProfiles.desiredRoles,
        valuesTags: matchingProfiles.valuesTags,
        causeTags: matchingProfiles.causeTags,
        workMode: matchingProfiles.workMode,
        country: matchingProfiles.country,
        city: matchingProfiles.city,
        verified: matchingProfiles.verified,
        reviewStage: matchReviewStates.reviewStage,
        revealScope: matchReviewStates.revealScope,
        operationalFallbackMode: matchReviewStates.operationalFallbackMode,
        shortlistedAt: matchReviewStates.shortlistedAt,
        fairnessStatus: matches.fairnessStatus,
        scoreState: matches.scoreState,
        generatedAt: matches.generatedAt,
        staleAt: matches.staleAt,
      })
      .from(matchReviewStates)
      .innerJoin(matches, eq(matches.id, matchReviewStates.matchId))
      .innerJoin(assignments, eq(assignments.id, matchReviewStates.assignmentId))
      .innerJoin(profiles, eq(profiles.id, matchReviewStates.profileId))
      .leftJoin(individualProfiles, eq(individualProfiles.userId, profiles.id))
      .leftJoin(matchingProfiles, eq(matchingProfiles.profileId, profiles.id))
      .where(
        and(eq(matchReviewStates.orgId, orgId), eq(matchReviewStates.reviewStage, 'shortlisted'))
      )
      .orderBy(desc(matchReviewStates.shortlistedAt), desc(matches.scoreTotal), desc(matches.score))
      .limit(100);

    const assignmentIds = Array.from(new Set(shortlist.map((row) => row.assignmentId)));
    const rankRows =
      assignmentIds.length > 0
        ? await db
            .select({
              matchId: matches.id,
              assignmentId: matches.assignmentId,
              score: matches.scoreTotal,
            })
            .from(matches)
            .where(inArray(matches.assignmentId, assignmentIds))
            .orderBy(
              matches.assignmentId,
              desc(matches.scoreTotal),
              desc(matches.score),
              matches.id
            )
        : [];

    const rankMap = new Map<string, { rank: number; total: number }>();
    const totalByAssignment = new Map<string, number>();
    for (const row of rankRows) {
      totalByAssignment.set(row.assignmentId, (totalByAssignment.get(row.assignmentId) || 0) + 1);
    }
    const rankCounter = new Map<string, number>();
    for (const row of rankRows) {
      const nextRank = (rankCounter.get(row.assignmentId) || 0) + 1;
      rankCounter.set(row.assignmentId, nextRank);
      rankMap.set(row.matchId, {
        rank: nextRank,
        total: totalByAssignment.get(row.assignmentId) || 1,
      });
    }

    return mobileSuccess({
      items: shortlist.map((row) => {
        const fairnessStatus = normalizeFairnessStatus(row.fairnessStatus);
        const rankInfo = rankMap.get(row.matchId);
        const suppressExactRank = shouldSuppressExactRank(
          fairnessStatus,
          row.scoreState,
          row.generatedAt,
          row.staleAt
        );
        const fallbackState = resolveCanonicalFallbackState({
          operationalFallbackMode: row.operationalFallbackMode,
          fairnessStatus,
        });
        return {
          id: row.matchId,
          assignmentId: row.assignmentId,
          assignmentRole: row.assignmentRole,
          assignmentStatus: row.assignmentStatus,
          reviewStage: row.reviewStage,
          revealScope: row.revealScope,
          visibleIdentityFields: getVisibleIdentityFields(row.revealScope),
          ...resolveCanonicalCorridor({
            reviewStage: row.reviewStage,
            revealScope: row.revealScope,
            surface: 'shortlist',
            fairnessStatus,
            operationalFallbackMode: row.operationalFallbackMode,
          }),
          candidate: buildCandidateReviewProjection(
            {
              profileId: row.profileId,
              displayName: row.displayName,
              handle: row.handle,
              avatarUrl: row.avatarUrl,
              headline: row.headline,
              tagline: row.tagline,
              workMode: row.workMode,
              country: row.country,
              city: row.city,
              desiredRoles: row.desiredRoles,
              valuesTags: row.valuesTags,
              causeTags: row.causeTags,
              verified: (row.verified as Record<string, unknown> | null) ?? null,
            },
            row.revealScope
          ),
          fairness: {
            status: fairnessStatus,
          },
          rankBand:
            rankInfo && !suppressExactRank
              ? getRankBand(rankInfo.rank, rankInfo.total)
              : 'Shortlisted',
          why: buildVisibilitySafeWhy({
            reasonCodes: ['shortlist_selected'],
            fairnessStatus,
            fallbackState,
            rankBand:
              rankInfo && !suppressExactRank
                ? getRankBand(rankInfo.rank, rankInfo.total)
                : 'Shortlisted',
          }),
          shortlistedAt: row.shortlistedAt,
        };
      }),
      count: shortlist.length,
    });
  } catch (error) {
    console.error('[mobile.shortlist.get] failed', error);
    return mobileError('internal_error', 'Failed to load shortlist', 500);
  }
}
