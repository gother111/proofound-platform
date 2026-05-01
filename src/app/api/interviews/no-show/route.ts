import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { canManageInterviewAsOrgAdmin } from '@/lib/interviews/messaging';
import { withWorkflowMutationIdempotency } from '@/lib/api/workflow-idempotency';
import { buildWorkflowView, recordInterviewTransition } from '@/lib/workflow/service';

const NoShowSchema = z.object({
  interviewId: z.string().uuid(),
  reason: z.string().optional(),
});

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

    const body = NoShowSchema.parse(await request.json());
    const { allowed, context } = await canManageInterviewAsOrgAdmin(
      supabase,
      user.id,
      body.interviewId
    );

    if (!context) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    if (!allowed) {
      return NextResponse.json(
        { error: 'Only organization owners/managers can mark no-show' },
        { status: 403 }
      );
    }

    return await withWorkflowMutationIdempotency(
      request,
      {
        userId: user.id,
        orgId: context.orgId,
        action: 'interview.no_show',
        resourceType: 'interview',
        resourceId: body.interviewId,
      },
      body,
      async () => {
        if (context.status !== 'scheduled') {
          return NextResponse.json(
            { error: 'Only scheduled interviews can be marked as no-show' },
            { status: 400 }
          );
        }

        const updatedInterview = await recordInterviewTransition({
          interviewId: body.interviewId,
          toState: 'no_show',
          actorType: 'organization_member',
          actorId: user.id,
          trigger: 'org_marked_no_show',
          reasonCode: body.reason?.trim() || 'candidate_no_show',
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
        });
      }
    );
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to mark no-show' }, { status: 500 });
  }
}
