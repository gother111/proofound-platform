import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { matches, interviews, auditLogs } from '@/db/schema';
import { eq, and, isNull, lt, sql } from 'drizzle-orm';

/**
 * Decision Window Constants (PRD I-22)
 * Both sides must respond within 48 hours after interview
 */
const DECISION_WINDOW_HOURS = 48;

/**
 * POST /api/match/decision
 *
 * Records a decision (accept/decline) after an interview
 * Must be made within 48 hours of interview completion
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { interviewId, decision, feedback } = await request.json();

    // Validate inputs
    if (!['accept', 'decline'].includes(decision)) {
      return NextResponse.json({
        error: 'Invalid decision',
        message: 'Decision must be either "accept" or "decline"',
      }, { status: 400 });
    }

    // Get interview with match details
    const interview = await db.query.interviews.findFirst({
      where: eq(interviews.id, interviewId),
      with: {
        match: true,
      },
    });

    if (!interview) {
      return NextResponse.json({
        error: 'Interview not found'
      }, { status: 404 });
    }

    // Check if interview has been held
    if (!interview.heldAt) {
      return NextResponse.json({
        error: 'Interview not yet held',
        message: 'Cannot make a decision before the interview takes place',
      }, { status: 400 });
    }

    // Check if within 48-hour decision window (PRD constraint)
    const hoursSinceInterview =
      (Date.now() - interview.heldAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceInterview > DECISION_WINDOW_HOURS) {
      return NextResponse.json({
        error: 'Decision window expired',
        message: `Decisions must be made within ${DECISION_WINDOW_HOURS} hours of the interview (PRD requirement)`,
        interviewHeldAt: interview.heldAt.toISOString(),
        hoursPassed: Math.round(hoursSinceInterview),
        deadline: new Date(
          interview.heldAt.getTime() + DECISION_WINDOW_HOURS * 60 * 60 * 1000
        ).toISOString(),
      }, { status: 400 });
    }

    // Check if decision already made
    if (interview.decision) {
      return NextResponse.json({
        error: 'Decision already recorded',
        existingDecision: interview.decision,
      }, { status: 409 });
    }

    // TODO: Verify user is authorized to make this decision
    // (either the candidate or an org member)

    // Record decision
    await db.update(interviews)
      .set({
        decision,
        feedback,
        decidedAt: new Date(),
        decidedBy: user.id,
      })
      .where(eq(interviews.id, interviewId));

    // Audit log
    await db.insert(auditLogs).values({
      userId: user.id,
      action: 'interview_decision',
      details: {
        interviewId,
        decision,
        hoursSinceInterview: Math.round(hoursSinceInterview),
      },
    });

    // If both sides accepted, update match status
    if (decision === 'accept') {
      // TODO: Check if other party also accepted, then mark match as 'contract_pending'
    }

    return NextResponse.json({
      success: true,
      decision,
      recordedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Decision recording error:', error);
    return NextResponse.json({
      error: 'Failed to record decision',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * GET /api/match/decision
 *
 * Cron job to auto-expire interviews past 48-hour decision window
 * Protected by CRON_SECRET environment variable
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Calculate cutoff time (48 hours ago)
    const cutoffTime = new Date(Date.now() - DECISION_WINDOW_HOURS * 60 * 60 * 1000);

    // Find expired interviews (held more than 48 hours ago, no decision)
    const expiredInterviews = await db.query.interviews.findMany({
      where: and(
        isNull(interviews.decision),
        lt(interviews.heldAt, cutoffTime)
      ),
    });

    // Auto-expire with system message
    const expiredIds = [];
    for (const interview of expiredInterviews) {
      await db.update(interviews)
        .set({
          decision: 'expired',
          feedback: `Decision window expired - no response provided within ${DECISION_WINDOW_HOURS} hours (PRD requirement)`,
          decidedAt: new Date(),
          decidedBy: null, // System decision
        })
        .where(eq(interviews.id, interview.id));

      expiredIds.push(interview.id);

      // Audit log
      await db.insert(auditLogs).values({
        userId: null, // System action
        action: 'interview_decision_auto_expired',
        details: {
          interviewId: interview.id,
          heldAt: interview.heldAt,
          hoursOverdue: Math.round(
            (Date.now() - interview.heldAt!.getTime()) / (1000 * 60 * 60) -
            DECISION_WINDOW_HOURS
          ),
        },
      });
    }

    return NextResponse.json({
      success: true,
      expired: expiredIds.length,
      interviewIds: expiredIds,
      cutoffTime: cutoffTime.toISOString(),
    });

  } catch (error) {
    console.error('Auto-expire error:', error);
    return NextResponse.json({
      error: 'Auto-expire failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
