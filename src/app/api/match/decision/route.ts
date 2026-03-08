import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { matches, interviews, auditLogs, assignments, organizationMembers } from '@/db/schema';
import { eq, and, isNull, lt, sql } from 'drizzle-orm';
import { validateDecisionWindow, DECISION_CONSTRAINTS, getDecisionDeadline } from '@/lib/sla';
import { log } from '@/lib/log';
import { recordDecisionTransition } from '@/lib/workflow/service';

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

    // Check if within 48-hour decision window (PRD I-22)
    // Use scheduledAt as a proxy for when the interview was held
    const decisionValidation = validateDecisionWindow(interview.scheduledAt);

    if (!decisionValidation.valid) {
      return NextResponse.json(
        {
          error: 'Decision window expired',
          message: decisionValidation.errors.join(', '),
          interviewScheduledAt: interview.scheduledAt.toISOString(),
          deadline: getDecisionDeadline(interview.scheduledAt).toISOString(),
        },
        { status: 400 }
      );
    }

    // Get the match to check authorization
    const match = await db.query.matches.findFirst({
      where: eq(matches.id, interview.matchId),
    });

    if (!match) {
      return NextResponse.json(
        {
          error: 'Match not found',
        },
        { status: 404 }
      );
    }

    // Verify user is authorized to make this decision
    const isCandidate = match.profileId === user.id;

    // Check if user is org member for this assignment
    let isOrgMember = false;
    if (!isCandidate) {
      const assignment = await db.query.assignments.findFirst({
        where: eq(assignments.id, match.assignmentId),
      });

      if (assignment) {
        const orgMembership = await db.query.organizationMembers.findFirst({
          where: and(
            eq(organizationMembers.userId, user.id),
            eq(organizationMembers.orgId, assignment.orgId),
            eq(organizationMembers.status, 'active')
          ),
        });
        isOrgMember = !!orgMembership;
      }
    }

    if (!isCandidate && !isOrgMember) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Only the candidate or organization members can make this decision',
        },
        { status: 403 }
      );
    }

    const canonicalDecision = await recordDecisionTransition({
      interviewId,
      toState: decision === 'accept' ? 'advance' : 'reject',
      actorType: isCandidate ? 'candidate' : 'organization_member',
      actorId: user.id,
      internalNote: feedback || null,
      reasonCode: decision === 'accept' ? 'legacy_accept' : 'legacy_decline',
    });

    // Log the decision
    log.info('interview.decision.recorded', {
      interviewId,
      matchId: interview.matchId,
      decision,
      decidedBy: user.id,
      isCandidate,
      isOrgMember,
    });

    // Create audit log entry
    try {
      await db.insert(auditLogs).values({
        actorId: user.id,
        action: 'interview_decision',
        targetType: 'interview',
        targetId: interviewId,
        meta: {
          decision,
          feedback: feedback || null,
        },
      });
    } catch (auditError) {
      log.error('audit.log.failed', {
        error: auditError instanceof Error ? auditError.message : 'Unknown error',
      });
      // Don't fail the request if audit logging fails
    }

    return NextResponse.json({
      success: true,
      decision: {
        id: canonicalDecision.id,
        state: canonicalDecision.state,
        workflow: canonicalDecision.workflow,
      },
      message: `Decision "${decision}" recorded successfully`,
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
 * DEPRECATED: Use /api/cron/sla-enforcement instead
 * This endpoint has been superseded by the centralized SLA enforcement cron
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      error: 'Deprecated',
      message: 'Use /api/cron/sla-enforcement instead',
      redirectTo: '/api/cron/sla-enforcement',
    },
    { status: 410 }
  );
}
