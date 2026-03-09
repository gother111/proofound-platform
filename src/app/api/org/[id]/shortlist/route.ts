import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db';
import {
  assignments,
  individualProfiles,
  matchReviewStates,
  matches,
  matchingProfiles,
  organizations,
  organizationMembers,
  profiles,
} from '@/db/schema';
import {
  buildCandidateReviewProjection,
  getShortlistProjectionPolicy,
  getRankBand,
  getVisibleIdentityFields,
  normalizeFairnessStatus,
  shouldSuppressExactRank,
} from '@/lib/matching/review-contract';
import { authorize, type OrgRole } from '@/lib/authz';

export const dynamic = 'force-dynamic';

async function getOrgWithAccess(orgIdOrSlug: string, userId: string) {
  const orgs = await db
    .select({
      id: organizations.id,
      slug: organizations.slug,
      displayName: organizations.displayName,
    })
    .from(organizations)
    .where(
      sql`${organizations.id}::text = ${orgIdOrSlug} OR ${organizations.slug} = ${orgIdOrSlug}`
    )
    .limit(1);

  if (orgs.length === 0) {
    return { org: null, membership: null };
  }

  const org = orgs[0];

  const memberships = await db
    .select({ role: organizationMembers.role, status: organizationMembers.status })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.orgId, org.id),
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.status, 'active')
      )
    )
    .limit(1);

  return {
    org,
    membership: memberships.length > 0 ? memberships[0] : null,
  };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { requireApiAuthContext } = await import('@/lib/auth');
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const { id } = await params;

    const { org, membership } = await getOrgWithAccess(id, user.id);
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
    const orgRole = (membership?.role as OrgRole | undefined) ?? null;
    if (
      !authorize({
        resource: 'candidate_shortlist_cards',
        action: 'read',
        orgRole,
      }).allowed
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
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
        and(eq(matchReviewStates.orgId, org.id), eq(matchReviewStates.reviewStage, 'shortlisted'))
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

    return NextResponse.json({
      items: shortlist.map((row) => {
        const fairnessStatus = normalizeFairnessStatus(row.fairnessStatus);
        const rankInfo = rankMap.get(row.matchId);
        const projectionPolicy = getShortlistProjectionPolicy(orgRole, row.revealScope);
        const suppressExactRank = shouldSuppressExactRank(
          fairnessStatus,
          row.scoreState,
          row.generatedAt,
          row.staleAt
        );

        return {
          id: row.matchId,
          assignmentId: row.assignmentId,
          assignmentRole: row.assignmentRole,
          assignmentStatus: row.assignmentStatus,
          reviewStage: row.reviewStage,
          revealScope: projectionPolicy.effectiveScope,
          visibleIdentityFields: getVisibleIdentityFields(projectionPolicy.effectiveScope),
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
            projectionPolicy.effectiveScope,
            {
              verificationSummaryVisibility: projectionPolicy.verificationSummaryVisibility,
            }
          ),
          fairness: {
            status: fairnessStatus,
          },
          rankBand:
            rankInfo && !suppressExactRank && orgRole !== 'viewer'
              ? getRankBand(rankInfo.rank, rankInfo.total)
              : 'Shortlisted',
          shortlistedAt: row.shortlistedAt,
        };
      }),
    });
  } catch (error) {
    console.error('Error fetching shortlist:', error);
    return NextResponse.json({ error: 'Failed to fetch shortlist' }, { status: 500 });
  }
}
