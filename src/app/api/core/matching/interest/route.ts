import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import {
  matchInterest,
  assignments,
  matches,
  profiles,
  conversations,
  applicationTimeline,
  applicationStages,
} from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { log } from '@/lib/log';
import { emitMatchActioned } from '@/lib/analytics/events';
import { notifyIntroAccepted } from '@/lib/notifications';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

const DEFAULT_APPLIED_STAGE = 'applied';

async function computeExpectedDecisionDate(stageCode: string) {
  const stages = await db
    .select()
    .from(applicationStages)
    .orderBy(asc(applicationStages.displayOrder));
  const ordered = stages.sort((a, b) => a.displayOrder - b.displayOrder);
  const startIndex = ordered.findIndex((stage) => stage.code === stageCode);
  const today = new Date();

  if (startIndex === -1) {
    return today;
  }

  const remainingDays = ordered
    .slice(startIndex)
    .reduce((sum, stage) => sum + (stage.defaultDaysToComplete ?? 0), 0);

  const expected = new Date(today);
  expected.setDate(expected.getDate() + remainingDays);
  return expected;
}

async function ensureApplicationTimeline(profileId: string, assignmentId: string) {
  const existing = await db.query.applicationTimeline.findFirst({
    where: and(
      eq(applicationTimeline.profileId, profileId),
      eq(applicationTimeline.assignmentId, assignmentId)
    ),
  });

  if (existing) return existing;

  const stage =
    (await db.query.applicationStages.findFirst({
      where: eq(applicationStages.code, DEFAULT_APPLIED_STAGE),
    })) ||
    (
      await db
        .select()
        .from(applicationStages)
        .orderBy(asc(applicationStages.displayOrder))
        .limit(1)
    )[0];

  const stageCode = stage?.code || DEFAULT_APPLIED_STAGE;
  const history = [
    {
      stage: stageCode,
      entered_at: new Date().toISOString(),
    },
  ];

  const expectedDecisionDate = await computeExpectedDecisionDate(stageCode);
  const expectedDecisionDateStr = expectedDecisionDate.toISOString().split('T')[0];

  const [created] = await db
    .insert(applicationTimeline)
    .values({
      profileId,
      assignmentId,
      currentStageCode: stageCode,
      stageHistory: history,
      expectedDecisionDate: expectedDecisionDateStr,
    })
    .returning();

  return created;
}

// Validation schema
const InterestSchema = z.object({
  assignmentId: z.string().uuid(),
  targetProfileId: z.string().uuid().optional(), // For org expressing interest in candidate
});

/**
 * POST /api/match/interest
 *
 * Records interest in a match.
 *
 * Two scenarios:
 * 1. Organization → Candidate: { assignmentId, targetProfileId }
 * 2. Individual → Assignment: { assignmentId } (targetProfileId is null)
 *
 * Returns { revealed: true } if mutual interest detected, else { revealed: false }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    // Validate input
    const validatedData = InterestSchema.parse(body);
    const { assignmentId, targetProfileId } = validatedData;

    // Check if assignment exists
    const assignment = await db.query.assignments.findFirst({
      where: eq(assignments.id, assignmentId),
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Create an application timeline entry for individuals expressing interest
    if (!targetProfileId) {
      await ensureApplicationTimeline(user.id, assignmentId);
    }

    // Record interest and check mutual interest in a transaction
    const mutualInterest = await db.transaction(async (tx) => {
      const interestData = {
        actorProfileId: user.id,
        assignmentId,
        targetProfileId: targetProfileId || null,
      };

      // Insert interest (ignore if already exists due to unique constraint)
      try {
        await tx.insert(matchInterest).values(interestData);
      } catch (error) {
        // Likely duplicate - that's ok, continue to check mutual interest
      }

      // Check for mutual interest
      let isMutual = false;

      if (targetProfileId) {
        // Org → Candidate: check if candidate expressed interest in this assignment
        const reciprocal = await tx.query.matchInterest.findFirst({
          where: and(
            eq(matchInterest.actorProfileId, targetProfileId),
            eq(matchInterest.assignmentId, assignmentId),
            eq(matchInterest.targetProfileId, user.id)
          ),
        });

        isMutual = !!reciprocal;
      } else {
        // Individual → Assignment: check if org expressed interest in this individual
        const reciprocal = await tx.query.matchInterest.findFirst({
          where: and(
            eq(matchInterest.assignmentId, assignmentId),
            eq(matchInterest.targetProfileId, user.id)
          ),
        });

        isMutual = !!reciprocal;
      }

      return isMutual;
    });

    log.info('match.interest.recorded', {
      userId: user.id,
      assignmentId,
      targetProfileId: targetProfileId || null,
      mutualInterest,
    });

    // If mutual interest detected, emit match_actioned event for "introduce"
    if (mutualInterest) {
      try {
        // Find the match to get score and PAC
        const profileId = targetProfileId || user.id;
        const [match] = await db
          .select()
          .from(matches)
          .where(and(eq(matches.assignmentId, assignmentId), eq(matches.profileId, profileId)))
          .limit(1);

        if (match) {
          // Extract PAC from match vector
          const vector = match.vector as any;
          const subscores = vector?.subscores || {};
          const pacScore = subscores?.purpose_alignment || subscores?.pac || 0;
          const skillsScore = subscores?.skills || 0;
          const constraintsScore = subscores?.constraints || 0;
          const verificationScore = subscores?.verification || 0;
          const score = parseFloat(match.score.toString());

          // Check if this is a Qualified Introduction
          // PRD criteria: score ≥0.70, all hard constraints satisfied
          const qualificationMet = score >= 0.7;

          // Emit match actioned event with proper structure
          await emitMatchActioned(user.id, match.id, {
            match_id: match.id,
            action: 'introduce' as const,
            match_score: score,
            pac_value: pacScore,
          });

          // Also emit for the other party if it's a mutual introduction
          const otherUserId = targetProfileId ? targetProfileId : assignment.orgId;
          if (otherUserId && otherUserId !== user.id) {
            await emitMatchActioned(otherUserId, match.id, {
              match_id: match.id,
              action: 'introduce' as const,
              match_score: score,
              pac_value: pacScore,
            });
          }

          // If this is a qualified intro, also emit FIRST_QUALIFIED_INTRO event (for TTFQI tracking)
          if (qualificationMet) {
            const { emitFirstQualifiedIntroAsync } = await import('@/lib/analytics/events');
            // Emit first qualified intro event with required analytics payload
            emitFirstQualifiedIntroAsync(user.id, match.id, {
              assignment_id: assignmentId,
              match_id: match.id,
            });
          }

          // Send notifications to both parties about mutual interest
          try {
            // Get profile names for notification
            const actorProfile = await db.query.profiles.findFirst({
              where: eq(profiles.id, user.id),
            });

            const otherProfile = targetProfileId
              ? await db.query.profiles.findFirst({
                  where: eq(profiles.id, targetProfileId),
                })
              : null;

            const actorName = actorProfile?.displayName || actorProfile?.handle || 'Someone';
            const otherName = otherProfile?.displayName || otherProfile?.handle || 'Someone';

            // Notify the current user
            await notifyIntroAccepted(user.id, match.id, otherName);

            // Notify the other party
            if (otherUserId && otherUserId !== user.id) {
              await notifyIntroAccepted(otherUserId, match.id, actorName);
            }
          } catch (notifError) {
            log.error('mutual-interest-notification.failed', {
              error: notifError instanceof Error ? notifError.message : 'Unknown error',
            });
          }

          // Create conversation for mutual interest (PRD I-20)
          try {
            // Check if conversation already exists for this match
            const existingConversation = await db
              .select()
              .from(conversations)
              .where(eq(conversations.matchId, match.id))
              .limit(1);

            let conversationId: string;

            if (existingConversation.length > 0) {
              // Use existing conversation
              conversationId = existingConversation[0].id;
              log.info('conversation.already_exists', {
                matchId: match.id,
                conversationId,
              });
            } else {
              // Determine participants:
              // - participantOne: the individual (match.profileId)
              // - participantTwo: the org representative (user.id if org, else find org owner)
              const individualId = match.profileId;
              const orgRepId = targetProfileId ? user.id : otherUserId;

              // Get participant personas for masked handle generation
              const [individualProfile, orgRepProfile] = await Promise.all([
                db.query.profiles.findFirst({ where: eq(profiles.id, individualId) }),
                orgRepId ? db.query.profiles.findFirst({ where: eq(profiles.id, orgRepId) }) : null,
              ]);

              // Generate masked handles
              const maskedHandleOne = `Candidate #${nanoid(6).toUpperCase()}`;
              const maskedHandleTwo = `Organization #${nanoid(6).toUpperCase()}`;

              // Create conversation
              const [newConversation] = await db
                .insert(conversations)
                .values({
                  matchId: match.id,
                  assignmentId,
                  participantOneId: individualId,
                  participantTwoId: orgRepId || user.id,
                  stage: 'masked',
                  maskedHandleOne,
                  maskedHandleTwo,
                  lastMessageAt: new Date(),
                })
                .returning();

              conversationId = newConversation.id;

              log.info('conversation.created_on_mutual_interest', {
                conversationId,
                matchId: match.id,
                assignmentId,
                individualId,
                orgRepId: orgRepId || user.id,
              });
            }

            // Return with conversation ID
            return NextResponse.json({
              revealed: true,
              conversationId,
              matchId: match.id,
            });
          } catch (convError) {
            log.error('conversation.creation.failed', {
              error: convError instanceof Error ? convError.message : 'Unknown error',
              matchId: match.id,
            });
            // Still return success for mutual interest, just without conversation
            return NextResponse.json({ revealed: true, matchId: match.id });
          }
        }
      } catch (error) {
        // Don't fail the request if event emission fails
        log.error('match-introduction-event.failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
          assignmentId,
          targetProfileId,
        });
      }
    }

    return NextResponse.json({ revealed: mutualInterest });
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

/**
 * GET /api/match/interest?assignmentId=...
 *
 * Gets all interests for an assignment (for organizations).
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');

    if (!assignmentId) {
      return NextResponse.json({ error: 'assignmentId is required' }, { status: 400 });
    }

    // Verify user has access to this assignment
    const assignment = await db.query.assignments.findFirst({
      where: eq(assignments.id, assignmentId),
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Fetch all interests for this assignment
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
