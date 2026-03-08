import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq, inArray, isNull, or } from 'drizzle-orm';
import { nanoid } from 'nanoid';

import { requireApiAuthContext } from '@/lib/auth';
import { db } from '@/db';
import {
  assignments,
  conversations,
  matchInterest,
  matches,
  organizationMembers,
  profiles,
} from '@/db/schema';
import { emitMatchActioned } from '@/lib/analytics/events';
import { log } from '@/lib/log';
import { notifyIntroAccepted } from '@/lib/notifications';
import { getIndividualReadinessState } from '@/lib/readiness/individual-state';
import { unlockFullIdentityForMatch } from '@/lib/matching/review-contract';
import {
  buildWorkflowView,
  openIntroConversation,
  syncIntroWorkflowFromInterest,
} from '@/lib/workflow/service';

export const dynamic = 'force-dynamic';

const InterestSchema = z.object({
  assignmentId: z.string().uuid(),
  targetProfileId: z.string().uuid().optional(), // Org -> candidate
});

async function hasOrgAccess(userId: string, orgId: string) {
  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.userId, userId),
      eq(organizationMembers.orgId, orgId),
      eq(organizationMembers.status, 'active')
    ),
  });

  return !!membership;
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const body = await request.json();
    const validated = InterestSchema.parse(body);
    const { assignmentId, targetProfileId } = validated;
    const isOrgAction = !!targetProfileId;

    const assignment = await db.query.assignments.findFirst({
      where: eq(assignments.id, assignmentId),
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    if (isOrgAction) {
      const canActForOrg = await hasOrgAccess(user.id, assignment.orgId);
      if (!canActForOrg) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      if (targetProfileId === user.id) {
        return NextResponse.json(
          { error: 'Cannot express interest in your own profile' },
          { status: 400 }
        );
      }
    }

    const introductionProfileId = isOrgAction ? targetProfileId! : user.id;
    const introductionReadiness = await getIndividualReadinessState(introductionProfileId);
    if (!introductionReadiness.flags.qualifiedIntroReady) {
      return NextResponse.json(
        {
          error: 'QUALIFIED_INTRO_NOT_READY',
          message:
            'Qualified introductions stay locked until stronger proof, trust signals, and intro constraints are complete.',
          readiness: introductionReadiness,
        },
        { status: 403 }
      );
    }

    const interestResult = await db.transaction(async (tx) => {
      await tx
        .insert(matchInterest)
        .values({
          actorProfileId: user.id,
          assignmentId,
          targetProfileId: targetProfileId || null,
        })
        .onConflictDoNothing({
          target: [
            matchInterest.actorProfileId,
            matchInterest.assignmentId,
            matchInterest.targetProfileId,
          ],
        });

      if (isOrgAction) {
        const reciprocal = await tx.query.matchInterest.findFirst({
          where: and(
            eq(matchInterest.actorProfileId, targetProfileId!),
            eq(matchInterest.assignmentId, assignmentId),
            isNull(matchInterest.targetProfileId)
          ),
        });

        return {
          mutual: !!reciprocal,
          reciprocalActorProfileId: reciprocal?.actorProfileId ?? null,
        };
      }

      const reciprocalInterests = await tx.query.matchInterest.findMany({
        where: and(
          eq(matchInterest.assignmentId, assignmentId),
          eq(matchInterest.targetProfileId, user.id)
        ),
      });

      if (reciprocalInterests.length === 0) {
        return {
          mutual: false,
          reciprocalActorProfileId: null,
        };
      }

      const reciprocalActorIds = Array.from(
        new Set(reciprocalInterests.map((interest) => interest.actorProfileId))
      );

      const activeOrgMembers =
        reciprocalActorIds.length > 0
          ? await tx.query.organizationMembers.findMany({
              where: and(
                inArray(organizationMembers.userId, reciprocalActorIds),
                eq(organizationMembers.orgId, assignment.orgId),
                eq(organizationMembers.status, 'active')
              ),
            })
          : [];

      const activeOrgActorIds = new Set(activeOrgMembers.map((member) => member.userId));
      const reciprocal = reciprocalInterests.find((interest) =>
        activeOrgActorIds.has(interest.actorProfileId)
      );

      if (!reciprocal) {
        return {
          mutual: false,
          reciprocalActorProfileId: null,
        };
      }

      return {
        mutual: true,
        reciprocalActorProfileId: reciprocal.actorProfileId,
      };
    });

    log.info('match.interest.recorded', {
      userId: user.id,
      assignmentId,
      targetProfileId: targetProfileId || null,
      mutualInterest: interestResult.mutual,
    });

    const candidateProfileId = isOrgAction ? targetProfileId! : user.id;
    const introWorkflow = await syncIntroWorkflowFromInterest({
      assignmentId,
      candidateProfileId,
      orgId: assignment.orgId,
      actorType: isOrgAction ? 'organization_member' : 'candidate',
      actorId: user.id,
      mutual: interestResult.mutual,
    });

    if (!interestResult.mutual) {
      return NextResponse.json({
        revealed: false,
        workflow: buildWorkflowView({
          machine: 'intro',
          state: introWorkflow.state,
          reasonCode: introWorkflow.closeReason,
          timestamps: {
            expiresAt: introWorkflow.expiresAt?.toISOString(),
            withdrawnAt: introWorkflow.withdrawnAt?.toISOString(),
            closedAt: introWorkflow.closedAt?.toISOString(),
            updatedAt: introWorkflow.updatedAt?.toISOString(),
          },
        }),
      });
    }

    const individualId = isOrgAction ? targetProfileId! : user.id;
    const orgRepId = isOrgAction ? user.id : interestResult.reciprocalActorProfileId;

    if (!orgRepId) {
      return NextResponse.json({ revealed: false });
    }

    const [match] = await db
      .select()
      .from(matches)
      .where(and(eq(matches.assignmentId, assignmentId), eq(matches.profileId, individualId)))
      .limit(1);

    const counterpartId = isOrgAction ? individualId : orgRepId;

    if (match) {
      const vector = (match.vector as Record<string, unknown>) || {};
      const subscores = (vector.subscores as Record<string, number>) || {};
      const pacScore = subscores.purpose_alignment || subscores.pac || 0;
      const score = Number(match.score);
      const qualificationMet = score >= 0.7;

      await emitMatchActioned(user.id, match.id, {
        match_id: match.id,
        action: 'introduce',
        match_score: score,
        pac_value: pacScore,
      });

      if (counterpartId !== user.id) {
        await emitMatchActioned(counterpartId, match.id, {
          match_id: match.id,
          action: 'introduce',
          match_score: score,
          pac_value: pacScore,
        });
      }

      if (qualificationMet) {
        const { emitFirstQualifiedIntroAsync } = await import('@/lib/analytics/events');
        emitFirstQualifiedIntroAsync(user.id, match.id, assignmentId);
      }

      try {
        const [actorProfile, counterpartProfile] = await Promise.all([
          db.query.profiles.findFirst({ where: eq(profiles.id, user.id) }),
          db.query.profiles.findFirst({ where: eq(profiles.id, counterpartId) }),
        ]);

        const actorName = actorProfile?.displayName || actorProfile?.handle || 'Someone';
        const counterpartName =
          counterpartProfile?.displayName || counterpartProfile?.handle || 'Someone';

        await notifyIntroAccepted(user.id, match.id, counterpartName);
        if (counterpartId !== user.id) {
          await notifyIntroAccepted(counterpartId, match.id, actorName);
        }
      } catch (notifError) {
        log.error('mutual-interest-notification.failed', {
          error: notifError instanceof Error ? notifError.message : 'Unknown error',
        });
      }
    }

    try {
      const existingConversation = await db.query.conversations.findFirst({
        where: and(
          eq(conversations.assignmentId, assignmentId),
          or(
            and(
              eq(conversations.participantOneId, individualId),
              eq(conversations.participantTwoId, orgRepId)
            ),
            and(
              eq(conversations.participantOneId, orgRepId),
              eq(conversations.participantTwoId, individualId)
            )
          )
        ),
      });

      let conversationId: string;

      if (existingConversation) {
        conversationId = existingConversation.id;
      } else {
        const [newConversation] = await db
          .insert(conversations)
          .values({
            matchId: match?.id ?? null,
            assignmentId,
            participantOneId: individualId,
            participantTwoId: orgRepId,
            stage: 'masked',
            maskedHandleOne: `Candidate #${nanoid(6).toUpperCase()}`,
            maskedHandleTwo: `Organization #${nanoid(6).toUpperCase()}`,
            lastMessageAt: new Date(),
          })
          .returning();

        conversationId = newConversation.id;
      }

      const openedIntroWorkflow = await openIntroConversation({
        introWorkflowId: introWorkflow.id,
        conversationId,
        actorType: isOrgAction ? 'organization_member' : 'candidate',
        actorId: user.id,
        matchId: match?.id ?? null,
      });

      if (match?.id) {
        await unlockFullIdentityForMatch({
          matchId: match.id,
          actorId: user.id,
          actorRole: isOrgAction ? 'member' : 'candidate',
          actorType: 'user_account',
          triggerType: 'automatic',
          sourceSurface: 'mutual_interest_route',
          reasonCode: 'reveal_full_identity',
          unlockTrigger: 'mutual_interest',
          context: {
            conversationId,
            reciprocalActorProfileId: interestResult.reciprocalActorProfileId,
          },
        });
      }

      return NextResponse.json({
        revealed: true,
        conversationId,
        ...(match ? { matchId: match.id } : {}),
        workflow: buildWorkflowView({
          machine: 'intro',
          state: openedIntroWorkflow.state,
          reasonCode: openedIntroWorkflow.closeReason,
          timestamps: {
            expiresAt: openedIntroWorkflow.expiresAt?.toISOString(),
            withdrawnAt: openedIntroWorkflow.withdrawnAt?.toISOString(),
            closedAt: openedIntroWorkflow.closedAt?.toISOString(),
            updatedAt: openedIntroWorkflow.updatedAt?.toISOString(),
          },
        }),
      });
    } catch (convError) {
      log.error('conversation.creation.failed', {
        assignmentId,
        userId: user.id,
        error: convError instanceof Error ? convError.message : 'Unknown error',
      });

      return NextResponse.json({
        revealed: true,
        ...(match ? { matchId: match.id } : {}),
        workflow: buildWorkflowView({
          machine: 'intro',
          state: introWorkflow.state,
          reasonCode: introWorkflow.closeReason,
          timestamps: {
            expiresAt: introWorkflow.expiresAt?.toISOString(),
            withdrawnAt: introWorkflow.withdrawnAt?.toISOString(),
            closedAt: introWorkflow.closedAt?.toISOString(),
            updatedAt: introWorkflow.updatedAt?.toISOString(),
          },
        }),
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    log.error('match.interest.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to record interest' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');

    if (!assignmentId) {
      return NextResponse.json({ error: 'assignmentId is required' }, { status: 400 });
    }

    const assignment = await db.query.assignments.findFirst({
      where: eq(assignments.id, assignmentId),
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const canAccess = await hasOrgAccess(user.id, assignment.orgId);
    if (!canAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const interests = await db.query.matchInterest.findMany({
      where: eq(matchInterest.assignmentId, assignmentId),
    });

    return NextResponse.json({ items: interests });
  } catch (error) {
    log.error('match.interest.list.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to fetch interests' }, { status: 500 });
  }
}
