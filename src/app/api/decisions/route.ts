/**
 * Decision Recording API
 *
 * POST /api/decisions - Record organization's decision on a candidate
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { recordDecision } from '@/lib/decisions/automation';
import { log } from '@/lib/log';
import { isActiveOrgMember } from '@/lib/api/auth';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { interviewId, decision, feedback } = body;

    if (!interviewId || !decision) {
      return NextResponse.json({ error: 'interviewId and decision are required' }, { status: 400 });
    }

    const validDecisions = ['hire', 'advance', 'hold', 'reject'];
    if (!validDecisions.includes(decision)) {
      return NextResponse.json(
        { error: `decision must be one of: ${validDecisions.join(', ')}` },
        { status: 400 }
      );
    }

    const { data: interview, error: interviewError } = await supabase
      .from('interviews')
      .select(
        `
          id,
          match_id,
          matches!inner(
            assignment_id,
            assignments!inner(
              org_id
            )
          )
        `
      )
      .eq('id', interviewId)
      .single();

    if (interviewError || !interview) {
      log.warn('decision.interview_not_found', {
        userId: user.id,
        interviewId,
      });
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    const interviewMatch = Array.isArray((interview as any).matches)
      ? (interview as any).matches[0]
      : (interview as any).matches;
    const interviewAssignment = Array.isArray(interviewMatch?.assignments)
      ? interviewMatch.assignments[0]
      : interviewMatch?.assignments;
    const orgId = interviewAssignment?.org_id as string | undefined;

    if (!orgId) {
      return NextResponse.json({ error: 'Interview assignment not found' }, { status: 404 });
    }

    const canDecide = await isActiveOrgMember(supabase, user.id, orgId, ['owner', 'admin']);

    if (!canDecide) {
      log.warn('decision.unauthorized', {
        userId: user.id,
        interviewId,
        orgId,
      });
      return NextResponse.json(
        { error: 'Unauthorized to make decision for this interview' },
        { status: 403 }
      );
    }

    const decisionRecord = await recordDecision(user.id, interviewId, decision, feedback);

    log.info('decision.recorded', {
      userId: user.id,
      interviewId,
      decision,
      withinSLA: decisionRecord.withinSLA,
    });

    return NextResponse.json({
      success: true,
      decision: {
        id: decisionRecord.id,
        interviewId: decisionRecord.interviewId,
        decision: decisionRecord.decision,
        hoursSinceInterview: decisionRecord.hoursSinceInterview,
        withinSLA: decisionRecord.withinSLA,
        decisionMadeAt: decisionRecord.decisionMadeAt,
      },
    });
  } catch (error) {
    log.error('decision.api.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: 'Failed to record decision' }, { status: 500 });
  }
}
