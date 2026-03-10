import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  getFeedbackReminderSchedule,
  issueFeedbackInvites,
  resolveFeedbackFollowUpState,
} from '@/lib/feedback/service';
import { buildWorkflowView, recordInterviewTransition } from '@/lib/workflow/service';

const CompleteSchema = z.object({
  interviewId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = CompleteSchema.parse(await request.json());

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: interview, error: interviewError } = await supabase
      .from('interviews')
      .select('id, host_user_id, participant_user_ids, status')
      .eq('id', body.interviewId)
      .maybeSingle();

    if (interviewError || !interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    if (interview.host_user_id !== user.id) {
      return NextResponse.json({ error: 'Only the host can mark completion' }, { status: 403 });
    }

    if (interview.status === 'completed') {
      return NextResponse.json({ success: true, message: 'Already completed' });
    }

    const { error: updateError } = await supabase
      .from('interviews')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', body.interviewId);

    if (updateError) {
      return NextResponse.json({ error: 'Could not update interview status' }, { status: 500 });
    }

    const updatedInterview = await recordInterviewTransition({
      interviewId: body.interviewId,
      toState: 'completed',
      actorType: 'organization_member',
      actorId: user.id,
      trigger: 'host_marked_complete',
    });

    const feedbackInvites = await issueFeedbackInvites(body.interviewId);
    const feedbackFollowUp = resolveFeedbackFollowUpState({
      completedAt: updatedInterview.completedAt ?? new Date(),
    });

    return NextResponse.json({
      success: true,
      workflow: buildWorkflowView({
        machine: 'interview',
        state: updatedInterview.status,
        reasonCode: updatedInterview.cancelReason,
        timestamps: {
          completedAt: updatedInterview.completedAt?.toISOString(),
          cancelledAt: updatedInterview.cancelledAt?.toISOString(),
          noShowAt: updatedInterview.noShowAt?.toISOString(),
          updatedAt: updatedInterview.updatedAt?.toISOString(),
        },
      }),
      feedbackFollowUp: {
        dueAt: feedbackFollowUp.dueAt?.toISOString() ?? null,
        overallState: feedbackFollowUp.overallState,
        candidateToOrg: feedbackFollowUp.candidateToOrg,
        orgToCandidate: feedbackFollowUp.orgToCandidate,
        slaBreached: feedbackFollowUp.slaBreached,
        reminderSchedule: getFeedbackReminderSchedule(
          updatedInterview.completedAt ?? new Date()
        ).map((entry) => ({
          checkpoint: entry.checkpoint,
          scheduledAt: entry.scheduledAt.toISOString(),
        })),
        issuedInvites: feedbackInvites.length,
      },
    });
  } catch (error: any) {
    console.error('Interview completion failed', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid payload', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
