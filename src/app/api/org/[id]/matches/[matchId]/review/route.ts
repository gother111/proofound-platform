import { and, eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { assignments, matchReviewStates, matches, organizations } from '@/db/schema';
import { requireApiAuthContext } from '@/lib/auth';
import {
  appendManualOverrideReason,
  getOrgMembershipRole,
  getVisibleIdentityFields,
  persistFairnessEvaluationForAssignment,
  recordRevealEvent,
  setMatchReviewStage,
} from '@/lib/matching/review-contract';

export const dynamic = 'force-dynamic';

const ReviewMutationSchema = z.object({
  action: z.enum([
    'shortlist',
    'unshortlist',
    'pass',
    'reject',
    'manual_override',
    'reveal_request',
  ]),
  annotation: z.string().max(1000).optional(),
  reasonCode: z
    .enum(['override_keep_under_review', 'override_shortlist_manual', 'override_reject_manual'])
    .optional(),
  requestedScope: z.enum(['shortlist_identity', 'full_identity']).optional(),
});

async function getOrgByIdOrSlug(orgIdOrSlug: string) {
  const [org] = await db
    .select({
      id: organizations.id,
      slug: organizations.slug,
    })
    .from(organizations)
    .where(
      sql`${organizations.id}::text = ${orgIdOrSlug} OR ${organizations.slug} = ${orgIdOrSlug}`
    )
    .limit(1);

  return org ?? null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = authContext;
    const { id, matchId } = await params;
    const parsed = ReviewMutationSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const org = await getOrgByIdOrSlug(id);
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const role = await getOrgMembershipRole(user.id, org.id);
    if (!role) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const [matchRow] = await db
      .select({
        matchId: matches.id,
        assignmentId: matches.assignmentId,
        profileId: matches.profileId,
        orgId: assignments.orgId,
        reviewStage: matchReviewStates.reviewStage,
        revealScope: matchReviewStates.revealScope,
      })
      .from(matches)
      .innerJoin(assignments, eq(assignments.id, matches.assignmentId))
      .innerJoin(matchReviewStates, eq(matchReviewStates.matchId, matches.id))
      .where(and(eq(matches.id, matchId), eq(assignments.orgId, org.id)))
      .limit(1);

    if (!matchRow) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const payload = parsed.data;

    if (payload.action === 'reveal_request') {
      const requestedScope = payload.requestedScope ?? 'full_identity';
      await recordRevealEvent({
        matchId: matchRow.matchId,
        assignmentId: matchRow.assignmentId,
        profileId: matchRow.profileId,
        orgId: org.id,
        actorId: user.id,
        actorRole: role,
        actorType: 'user_account',
        triggerType: 'user',
        requestedScope,
        grantedScope: matchRow.revealScope,
        reasonCode: 'org_reveal_request_denied',
        sourceSurface: 'org_review_route',
        context: {},
        outcome: requestedScope === 'full_identity' ? 'denied' : 'no_op',
      });

      return NextResponse.json(
        {
          error: 'Full identity reveal cannot be triggered unilaterally by the organization',
          reviewStage: matchRow.reviewStage,
          revealScope: matchRow.revealScope,
        },
        { status: requestedScope === 'full_identity' ? 403 : 200 }
      );
    }

    if (payload.action === 'manual_override') {
      if (!payload.reasonCode) {
        return NextResponse.json(
          { error: 'reasonCode is required for manual overrides' },
          { status: 400 }
        );
      }

      await appendManualOverrideReason({
        matchId: matchRow.matchId,
        assignmentId: matchRow.assignmentId,
        profileId: matchRow.profileId,
        actorId: user.id,
        reasonCode: payload.reasonCode,
        annotation: payload.annotation ?? null,
        payload: {
          reviewStage: matchRow.reviewStage,
        },
      });
    } else {
      const actionToStage = {
        shortlist: { reviewStage: 'shortlisted', reasonCode: 'shortlist_selected' },
        unshortlist: { reviewStage: 'blind_review', reasonCode: 'passed_for_now' },
        pass: { reviewStage: 'passed', reasonCode: 'passed_for_now' },
        reject: { reviewStage: 'rejected', reasonCode: 'rejected_constraints' },
      } as const;

      const next = actionToStage[payload.action as keyof typeof actionToStage];
      await setMatchReviewStage({
        matchId: matchRow.matchId,
        actorId: user.id,
        actorRole: role,
        sourceSurface: 'org_review_route',
        reviewStage: next.reviewStage,
        reasonCode: next.reasonCode,
        annotation: payload.annotation ?? null,
      });
    }

    const fairnessEvaluation = await persistFairnessEvaluationForAssignment({
      assignmentId: matchRow.assignmentId,
      actorId: user.id,
      actorType: 'user_account',
    });

    const updated = await db.query.matchReviewStates.findFirst({
      where: eq(matchReviewStates.matchId, matchRow.matchId),
      columns: {
        reviewStage: true,
        revealScope: true,
      },
    });

    return NextResponse.json({
      matchId: matchRow.matchId,
      reviewStage: updated?.reviewStage ?? matchRow.reviewStage,
      revealScope: updated?.revealScope ?? matchRow.revealScope,
      visibleIdentityFields: getVisibleIdentityFields(updated?.revealScope ?? matchRow.revealScope),
      fairness: {
        status: fairnessEvaluation.status,
        evaluationId: fairnessEvaluation.id,
      },
    });
  } catch (error) {
    console.error('org review mutation failed', error);
    return NextResponse.json({ error: 'Failed to update review state' }, { status: 500 });
  }
}
