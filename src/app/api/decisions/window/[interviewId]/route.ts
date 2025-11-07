/**
 * Decision Window Status API
 *
 * GET /api/decisions/window/[interviewId] - Get decision window status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDecisionWindow } from '@/lib/decisions/automation';
import { log } from '@/lib/log';

export async function GET(req: NextRequest, { params }: { params: { interviewId: string } }) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { interviewId } = params;

    if (!interviewId) {
      return NextResponse.json({ error: 'interviewId is required' }, { status: 400 });
    }

    // Verify user has permission for this interview
    const { data: interview, error: interviewError } = await supabase
      .from('interviews')
      .select('id, assignment_id, assignments(organization_id)')
      .eq('id', interviewId)
      .single();

    if (interviewError || !interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    const assignment = (interview as any).assignments;
    if (assignment.organization_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to view decision window for this interview' },
        { status: 403 }
      );
    }

    // Get decision window status
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
