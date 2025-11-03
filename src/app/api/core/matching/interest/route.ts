import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { matchInterest, assignments, matches } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { log } from '@/lib/log';
import { emitMatchActioned } from '@/lib/analytics/events';

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

    // Record interest
    const interestData = {
      actorProfileId: user.id,
      assignmentId,
      targetProfileId: targetProfileId || null,
    };

    // Insert interest (ignore if already exists due to unique constraint)
    try {
      await db.insert(matchInterest).values(interestData);
    } catch (error) {
      // Likely duplicate - that's ok, continue to check mutual interest
    }

    // Check for mutual interest
    let mutualInterest = false;

    if (targetProfileId) {
      // Org → Candidate: check if candidate expressed interest in this assignment
      const reciprocal = await db.query.matchInterest.findFirst({
        where: and(
          eq(matchInterest.actorProfileId, targetProfileId),
          eq(matchInterest.assignmentId, assignmentId),
          eq(matchInterest.targetProfileId, user.id)
        ),
      });

      mutualInterest = !!reciprocal;
    } else {
      // Individual → Assignment: check if org expressed interest in this individual
      const reciprocal = await db.query.matchInterest.findFirst({
        where: and(
          eq(matchInterest.assignmentId, assignmentId),
          eq(matchInterest.targetProfileId, user.id)
        ),
      });

      mutualInterest = !!reciprocal;
    }

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
          const pac = vector?.subscores?.pac || 0;
          const score = parseFloat(match.score.toString());

          // Check if this is a Qualified Introduction
          // PRD criteria: score ≥0.70, all hard constraints satisfied
          const qualificationMet = score >= 0.7;

          // Emit event for both parties
          await emitMatchActioned(user.id, match.id, 'introduce', {
            score,
            pac,
            qualificationMet,
          });

          // Also emit for the other party if it's a mutual introduction
          const otherUserId = targetProfileId ? targetProfileId : assignment.orgId;
          if (otherUserId && otherUserId !== user.id) {
            await emitMatchActioned(otherUserId, match.id, 'introduce', {
              score,
              pac,
              qualificationMet,
            });
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
