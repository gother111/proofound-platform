/**
 * Interview Cancellation API
 * POST /api/interviews/cancel
 *
 * Implements PRD Gap 1: Cancel scheduled interview
 *
 * Features:
 * - Cancels meeting in Zoom or Google Meet
 * - Updates interview status
 * - Notifies all participants
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import {
  canManageInterviewAsOrgAdmin,
  postInterviewUpdateMessageBestEffort,
} from '@/lib/interviews/messaging';
import { withWorkflowMutationIdempotency } from '@/lib/api/workflow-idempotency';
import { buildWorkflowView, recordInterviewTransition } from '@/lib/workflow/service';

const CancelInterviewSchema = z.object({
  interviewId: z.string().uuid(),
  reason: z.string().optional(),
});

function isMissingColumnError(error: { code?: string; message?: string } | null, column: string) {
  return Boolean(error?.code === 'PGRST204' && error?.message?.includes(`'${column}'`));
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { interviewId, reason } = CancelInterviewSchema.parse(body);

    const { allowed, context } = await canManageInterviewAsOrgAdmin(supabase, user.id, interviewId);
    if (!context) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    if (!allowed) {
      return NextResponse.json(
        { error: 'Only organization owners/managers can cancel interviews' },
        { status: 403 }
      );
    }

    return await withWorkflowMutationIdempotency(
      request,
      {
        userId: user.id,
        orgId: context.orgId,
        action: 'interview.cancel',
        resourceType: 'interview',
        resourceId: interviewId,
      },
      { interviewId, reason: reason ?? null },
      async () => {
        if (context.status === 'cancelled') {
          return NextResponse.json({ error: 'Interview already cancelled' }, { status: 400 });
        }

        if (context.status !== 'scheduled') {
          return NextResponse.json(
            { error: 'Only scheduled interviews can be cancelled' },
            { status: 400 }
          );
        }

        let existingNotes: string | null = null;
        if (reason?.trim()) {
          const notesResult = await supabase
            .from('interviews')
            .select('notes')
            .eq('id', interviewId)
            .maybeSingle();
          if (!notesResult.error && notesResult.data) {
            existingNotes =
              typeof notesResult.data.notes === 'string' ? notesResult.data.notes : null;
          }
        }

        const updatedAt = new Date().toISOString();
        const updatePayload: Record<string, unknown> = {
          status: 'cancelled',
          updated_at: updatedAt,
        };

        if (reason?.trim()) {
          updatePayload.notes = `${existingNotes ? `${existingNotes}\n\n` : ''}Cancelled: ${reason.trim()}`;
        }

        let updateResult = await supabase
          .from('interviews')
          .update(updatePayload)
          .eq('id', interviewId);
        if (updateResult.error && isMissingColumnError(updateResult.error, 'notes')) {
          delete updatePayload.notes;
          updateResult = await supabase
            .from('interviews')
            .update({
              status: 'cancelled',
              updated_at: updatedAt,
            })
            .eq('id', interviewId);
        }

        if (updateResult.error) {
          return NextResponse.json({ error: 'Failed to cancel interview' }, { status: 500 });
        }

        const updatedInterview = await recordInterviewTransition({
          interviewId,
          toState: 'cancelled',
          actorType: 'organization_member',
          actorId: user.id,
          trigger: 'org_cancelled_interview',
          reasonCode: reason?.trim() || 'cancelled_by_org',
          metadata: {
            previousScheduledAt: context.scheduledAt?.toISOString?.() ?? null,
          },
        });

        await postInterviewUpdateMessageBestEffort({
          action: 'cancelled',
          actorUserId: user.id,
          interviewId,
          matchId: context.matchId,
          reason: reason?.trim(),
          previous: {
            scheduledAt: context.scheduledAt,
            platform: context.platform,
            meetingUrl: context.meetingUrl,
            timezone: context.timezone,
          },
          next: {
            scheduledAt: context.scheduledAt,
            platform: context.platform,
            meetingUrl: context.meetingUrl,
            timezone: context.timezone,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Interview cancelled successfully',
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
        });
      }
    );
  } catch (error: any) {
    console.error('Interview cancellation error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to cancel interview' }, { status: 500 });
  }
}
