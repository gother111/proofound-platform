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
  organizationMembers,
} from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { log } from '@/lib/log';
import { emitMatchActioned } from '@/lib/analytics/events';
import { notifyIntroAccepted } from '@/lib/notifications';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

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

    // Org -> candidate: only allow org members for the assignment org.
    if (targetProfileId) {
      const membership = await db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.userId, user.id),
          eq(organizationMembers.orgId, assignment.orgId),
          eq(organizationMembers.status, 'active')
        ),
      });

      if (!membership) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
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

      // Check for mutual interest.
      // Important: the individual's interest record is stored with targetProfileId = NULL, because
      // the individual does not know which specific org member will respond.
      if (targetProfileId) {
        // Org → Candidate: check if candidate expressed interest in this assignment (targetProfileId NULL).
        const reciprocal = await tx.query.matchInterest.findFirst({
          where: and(
            eq(matchInterest.actorProfileId, targetProfileId),
            eq(matchInterest.assignmentId, assignmentId),
            isNull(matchInterest.targetProfileId)
          ),
        });

        return {
          isMutual: !!reciprocal,
          reciprocalOrgActorId: null,
        };
      }

      // Individual → Assignment: check if any org member expressed interest in this individual.
      const reciprocal = await tx.query.matchInterest.findFirst({
        where: and(
          eq(matchInterest.assignmentId, assignmentId),
          eq(matchInterest.targetProfileId, user.id)
        ),
      });

      // Ensure the reciprocal actor is actually a member of the org that owns this assignment.
      if (reciprocal) {
        const orgMembership = await tx.query.organizationMembers.findFirst({
          where: and(
            eq(organizationMembers.userId, reciprocal.actorProfileId),
            eq(organizationMembers.orgId, assignment.orgId),
            eq(organizationMembers.status, 'active')
          ),
        });

        if (!orgMembership) {
          return {
            isMutual: false,
            reciprocalOrgActorId: null,
          };
        }
      }

      return {
        isMutual: !!reciprocal,
        reciprocalOrgActorId: reciprocal?.actorProfileId ?? null,
      };
    });

    log.info('match.interest.recorded', {
      userId: user.id,
      assignmentId,
      targetProfileId: targetProfileId || null,
      mutualInterest: mutualInterest.isMutual,
    });

    // If mutual interest detected, emit match_actioned event for "introduce"
    if (mutualInterest.isMutual) {
      try {
        const candidateId = targetProfileId ? targetProfileId : user.id;
        const orgRepId = targetProfileId ? user.id : mutualInterest.reciprocalOrgActorId;

        if (!orgRepId) {
          // Should not happen when mutualInterest.isMutual is true, but keep defensive.
          log.error('match.interest.mutual_missing_org_rep', { assignmentId, userId: user.id });
          return NextResponse.json({ revealed: true });
        }

        // Find the match to get score and PAC
        const [match] = await db
          .select()
          .from(matches)
          .where(and(eq(matches.assignmentId, assignmentId), eq(matches.profileId, candidateId)))
          .limit(1);

        if (match) {
          // Extract PAC from match vector
          const vector = match.vector as any;
          const subscores = vector?.subscores || {};
          const pacScore = subscores?.purpose_alignment || subscores?.pac || 0;
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
          const otherUserId = targetProfileId ? candidateId : orgRepId;
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
            emitFirstQualifiedIntroAsync(user.id, match.id, assignmentId);
          }

          // Send notifications to both parties about mutual interest
          try {
            // Get profile names for notification
            const actorProfile = await db.query.profiles.findFirst({
              where: eq(profiles.id, user.id),
            });

            const otherProfile = await db.query.profiles.findFirst({
              where: eq(profiles.id, otherUserId),
            });

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
              // - participantOne: the individual (candidate)
              // - participantTwo: the org representative (the org member who expressed interest)
              const individualId = candidateId;

              // Get participant personas for masked handle generation
              await Promise.all([
                db.query.profiles.findFirst({ where: eq(profiles.id, individualId) }),
                db.query.profiles.findFirst({ where: eq(profiles.id, orgRepId) }),
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
                  participantTwoId: orgRepId,
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
                orgRepId,
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

    return NextResponse.json({ revealed: mutualInterest.isMutual });
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

    // Only org members for this assignment can list interests.
    const membership = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.userId, user.id),
        eq(organizationMembers.orgId, assignment.orgId),
        eq(organizationMembers.status, 'active')
      ),
    });

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
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
