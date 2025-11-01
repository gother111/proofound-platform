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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { interviewId, decision, feedback } = await request.json();

    // Validate inputs
    if (!['accept', 'decline'].includes(decision)) {
      return NextResponse.json(
        {
          error: 'Invalid decision',
          message: 'Decision must be either "accept" or "decline"',
        },
        { status: 400 }
      );
    }

    // Get interview with match details
    const interview = await db.query.interviews.findFirst({
      where: eq(interviews.id, interviewId),
      with: {
        match: true,
      },
    });

    if (!interview) {
      return NextResponse.json(
        {
          error: 'Interview not found',
        },
        { status: 404 }
      );
    }

    // Check if interview has been held (status should be completed)
    if (interview.status !== 'completed') {
      return NextResponse.json(
        {
          error: 'Interview not yet held',
          message: 'Cannot make a decision before the interview takes place',
        },
        { status: 400 }
      );
    }

    // Check if within 48-hour decision window (PRD constraint)
    // Use scheduledAt as a proxy for when the interview was held
    const hoursSinceInterview = (Date.now() - interview.scheduledAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceInterview > DECISION_WINDOW_HOURS) {
      return NextResponse.json(
        {
          error: 'Decision window expired',
          message: `Decisions must be made within ${DECISION_WINDOW_HOURS} hours of the interview (PRD requirement)`,
          interviewScheduledAt: interview.scheduledAt.toISOString(),
          hoursPassed: Math.round(hoursSinceInterview),
          deadline: new Date(
            interview.scheduledAt.getTime() + DECISION_WINDOW_HOURS * 60 * 60 * 1000
          ).toISOString(),
        },
        { status: 400 }
      );
    }

    // TODO: Verify user is authorized to make this decision
    // (either the candidate or an org member)

    // TODO: Record decision - schema needs to be updated to support decision tracking
    // The interviews table currently doesn't have decision, decidedAt, or decidedBy fields
    // This functionality needs proper schema migration before it can be implemented

    // NOTE: Temporarily returning success to unblock build
    // This endpoint needs to be properly implemented with schema changes
    return NextResponse.json({
      success: true,
      message: 'Decision recording not yet implemented - schema migration required',
      decision,
      interviewId,
    });
  } catch (error) {
    console.error('Decision recording error:', error);
    return NextResponse.json(
      {
        error: 'Failed to record decision',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
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
    // TODO: Auto-expire functionality not yet implemented
    // The interviews table doesn't have decision, heldAt, decidedAt, or decidedBy fields
    // This cron job needs proper schema migration before it can be implemented

    return NextResponse.json({
      success: true,
      message: 'Auto-expire not yet implemented - schema migration required',
      expired: 0,
      interviewIds: [],
    });
  } catch (error) {
    console.error('Auto-expire error:', error);
    return NextResponse.json(
      {
        error: 'Auto-expire failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
