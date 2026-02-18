import { and, desc, eq, isNull } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { assignments, matchInterest, matches, profiles } from '@/db/schema';
import { isActiveOrgMember, requireMobileAuth } from '@/lib/api/mobile/auth';
import { mobileError, mobileSuccess } from '@/lib/api/mobile/response';

export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  orgId: z.string().uuid(),
});

/**
 * GET /api/mobile/v1/shortlist?orgId=<uuid>
 *
 * Org-side shortlist, derived from candidate-expressed interest.
 */
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
      'owner',
      'admin',
      'member',
      'viewer',
    ]);

    if (!canAccess) {
      return mobileError('forbidden', 'Organization membership required', 403);
    }

    const rows = await db
      .select({
        id: matchInterest.id,
        assignmentId: assignments.id,
        assignmentRole: assignments.role,
        assignmentStatus: assignments.status,
        candidateId: profiles.id,
        candidateName: profiles.displayName,
        candidateHandle: profiles.handle,
        candidateAvatarUrl: profiles.avatarUrl,
        score: matches.score,
        createdAt: matchInterest.createdAt,
      })
      .from(matchInterest)
      .innerJoin(assignments, eq(matchInterest.assignmentId, assignments.id))
      .leftJoin(
        matches,
        and(
          eq(matches.assignmentId, assignments.id),
          eq(matches.profileId, matchInterest.actorProfileId)
        )
      )
      .leftJoin(profiles, eq(matchInterest.actorProfileId, profiles.id))
      .where(and(eq(assignments.orgId, orgId), isNull(matchInterest.targetProfileId)))
      .orderBy(desc(matchInterest.createdAt))
      .limit(100);

    return mobileSuccess({
      items: rows.map((row) => ({
        id: row.id,
        assignmentId: row.assignmentId,
        assignmentRole: row.assignmentRole,
        assignmentStatus: row.assignmentStatus,
        candidate: {
          id: row.candidateId,
          displayName: row.candidateName,
          handle: row.candidateHandle,
          avatarUrl: row.candidateAvatarUrl,
        },
        score: row.score === null ? null : Number(row.score),
        createdAt: row.createdAt,
      })),
      count: rows.length,
    });
  } catch (error) {
    console.error('[mobile.shortlist.get] failed', error);
    return mobileError('internal_error', 'Failed to load shortlist', 500);
  }
}
