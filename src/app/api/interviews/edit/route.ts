import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import {
  canManageInterviewAsOrgAdmin,
  postInterviewUpdateMessageBestEffort,
} from '@/lib/interviews/messaging';
import { canReschedule } from '@/lib/interview-constraints';
import { buildWorkflowView, recordInterviewRescheduleAudit } from '@/lib/workflow/service';

const EditInterviewSchema = z.object({
  interviewId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  timezone: z.string().optional(),
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
    const { interviewId, scheduledAt, timezone, reason } = EditInterviewSchema.parse(body);

    const { allowed, context } = await canManageInterviewAsOrgAdmin(supabase, user.id, interviewId);
    if (!context) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    if (!allowed) {
      return NextResponse.json(
        { error: 'Only organization owners/managers can edit interviews' },
        { status: 403 }
      );
    }

    if (context.status !== 'scheduled') {
      return NextResponse.json(
        { error: 'Only scheduled interviews can be edited' },
        { status: 400 }
      );
    }

    if (context.scheduledAt && context.scheduledAt.getTime() <= Date.now()) {
      return NextResponse.json(
        { error: 'Only upcoming scheduled interviews can be edited' },
        { status: 400 }
      );
    }

    const nextScheduledAt = new Date(scheduledAt);
    if (Number.isNaN(nextScheduledAt.getTime()) || nextScheduledAt.getTime() <= Date.now()) {
      return NextResponse.json(
        { error: 'New interview time must be in the future' },
        { status: 400 }
      );
    }

    const rescheduleValidation = canReschedule(context.rescheduleCount ?? 0);
    if (!rescheduleValidation.valid) {
      return NextResponse.json({ error: rescheduleValidation.errors[0] }, { status: 400 });
    }

    let existingNotes: string | null = null;
    if (reason?.trim()) {
      const notesResult = await supabase
        .from('interviews')
        .select('notes')
        .eq('id', interviewId)
        .maybeSingle();
      if (!notesResult.error && notesResult.data) {
        existingNotes = typeof notesResult.data.notes === 'string' ? notesResult.data.notes : null;
      }
    }

    const updatePayload: Record<string, unknown> = {
      scheduled_at: nextScheduledAt.toISOString(),
      reschedule_count: (context.rescheduleCount ?? 0) + 1,
      updated_at: new Date().toISOString(),
    };

    if (timezone) {
      updatePayload.timezone = timezone;
    }

    if (reason?.trim()) {
      updatePayload.notes = `${existingNotes ? `${existingNotes}\n\n` : ''}Updated: ${reason.trim()}`;
    }

    let updateResult = await supabase
      .from('interviews')
      .update(updatePayload)
      .eq('id', interviewId);

    if (updateResult.error && isMissingColumnError(updateResult.error, 'notes')) {
      delete updatePayload.notes;
      updateResult = await supabase.from('interviews').update(updatePayload).eq('id', interviewId);
    }

    if (updateResult.error && isMissingColumnError(updateResult.error, 'timezone')) {
      delete updatePayload.timezone;
      updateResult = await supabase.from('interviews').update(updatePayload).eq('id', interviewId);
    }

    if (updateResult.error) {
      return NextResponse.json({ error: 'Failed to edit interview' }, { status: 500 });
    }

    await recordInterviewRescheduleAudit({
      interviewId,
      actorType: 'organization_member',
      actorId: user.id,
      previousScheduledAt: context.scheduledAt?.toISOString?.() ?? null,
      nextScheduledAt: nextScheduledAt.toISOString(),
      previousTimezone: context.timezone ?? null,
      nextTimezone: timezone ?? context.timezone ?? null,
      reasonCode: reason?.trim() || 'rescheduled_by_org',
      metadata: {
        matchId: context.matchId,
      },
    });

    await postInterviewUpdateMessageBestEffort({
      action: 'edited',
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
        scheduledAt: nextScheduledAt.toISOString(),
        platform: context.platform,
        meetingUrl: context.meetingUrl,
        timezone: timezone ?? context.timezone,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Interview updated successfully',
      interview: {
        id: interviewId,
        scheduledAt: nextScheduledAt.toISOString(),
        timezone: timezone ?? context.timezone ?? 'UTC',
        rescheduleCount: (context.rescheduleCount ?? 0) + 1,
      },
      workflow: buildWorkflowView({
        machine: 'interview',
        state: 'scheduled',
        reasonCode: reason?.trim() || 'rescheduled_by_org',
        timestamps: {
          scheduledAt: nextScheduledAt.toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }),
    });
  } catch (error: any) {
    console.error('Interview edit error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to edit interview' }, { status: 500 });
  }
}
