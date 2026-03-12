/**
 * Decision Window Status API
 *
 * GET /api/decisions/window/[interviewId] - Get decision window status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDecisionWindow } from '@/lib/decisions/automation';
import { log } from '@/lib/log';
import { isActiveOrgMember } from '@/lib/api/auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ interviewId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { interviewId } = await params;

    if (!interviewId) {
      return NextResponse.json({ error: 'interviewId is required' }, { status: 400 });
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

    const canViewWindow = await isActiveOrgMember(supabase, user.id, orgId, [
      'org_owner',
      'org_manager',
    ]);

    if (!canViewWindow) {
      return NextResponse.json(
        { error: 'Unauthorized to view decision window for this interview' },
        { status: 403 }
      );
    }

    const decisionWindow = await getDecisionWindow(interviewId);

    if (!decisionWindow) {
      return NextResponse.json(
        { error: 'Decision window not found or interview not completed' },
        { status: 404 }
      );
    }

    log.info('decision.window.retrieved', {
      userId: user.id,
      interviewId,
      hoursRemaining: decisionWindow.hoursRemaining.toFixed(2),
      isOverdue: decisionWindow.isOverdue,
    });

    return NextResponse.json({
      interviewId: decisionWindow.interviewId,
      completedAt: decisionWindow.interviewCompletedAt,
      deadline: decisionWindow.deadline,
      hoursRemaining: decisionWindow.hoursRemaining,
      isOverdue: decisionWindow.isOverdue,
      remindersSent: decisionWindow.remindersSent,
    });
  } catch (error) {
    log.error('decision.window.api.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: 'Failed to get decision window' }, { status: 500 });
  }
}
