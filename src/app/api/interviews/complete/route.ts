import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { withWorkflowMutationIdempotency } from '@/lib/api/workflow-idempotency';
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
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const body = CompleteSchema.parse(rawBody);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: interview, error: interviewError } = await supabase
      .from('interviews')
      .select(
        'id, host_user_id, participant_user_ids, status, completed_at, cancelled_at, cancel_reason, no_show_at, updated_at'
      )
      .eq('id', body.interviewId)
      .maybeSingle();

    if (interviewError || !interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    if (interview.host_user_id !== user.id) {
      return NextResponse.json({ error: 'Only the host can mark completion' }, { status: 403 });
    }

    return await withWorkflowMutationIdempotency(
      request,
      {
        userId: user.id,
        action: 'interview.complete',
        resourceType: 'interview',
        resourceId: body.interviewId,
      },
      body,
      async () => {
        if (interview.status === 'completed') {
          return NextResponse.json({
            success: true,
            message: 'Already completed',
            workflow: buildWorkflowView({
              machine: 'interview',
              state: 'completed',
              reasonCode: interview.cancel_reason,
              timestamps: {
                completedAt: interview.completed_at,
                cancelledAt: interview.cancelled_at,
                noShowAt: interview.no_show_at,
                updatedAt: interview.updated_at,
              },
            }),
          });
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

        let feedbackInvites: Awaited<ReturnType<typeof issueFeedbackInvites>> = [];
        let feedbackInviteWarning: string | null = null;

        try {
          feedbackInvites = await issueFeedbackInvites(body.interviewId);
        } catch (feedbackError) {
          console.warn('Interview completion feedback invites failed', feedbackError);
          feedbackInviteWarning = 'Feedback invites could not be issued immediately.';
        }

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
            warning: feedbackInviteWarning,
          },
        });
      }
    );
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
