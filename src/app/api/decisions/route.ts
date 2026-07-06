/**
 * Decision Recording API
 *
 * POST /api/decisions - Record organization's decision on a candidate
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/log';
import { withWorkflowMutationIdempotency } from '@/lib/api/workflow-idempotency';
import { isActiveOrgMember } from '@/lib/api/auth';
import { getInterviewAccessContext } from '@/lib/interviews/messaging';
import { buildWorkflowView, recordDecisionTransition } from '@/lib/workflow/service';

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
    const { interviewId, decision, feedback, holdUntil, reasonCode } = body;

    if (!interviewId || !decision) {
      return NextResponse.json({ error: 'interviewId and decision are required' }, { status: 400 });
    }

    const validDecisions = ['hire', 'advance', 'hold', 'reject', 'withdraw'];
    if (!validDecisions.includes(decision)) {
      return NextResponse.json(
        { error: `decision must be one of: ${validDecisions.join(', ')}` },
        { status: 400 }
      );
    }

    const interview = await getInterviewAccessContext(interviewId);
    if (!interview) {
      log.warn('decision.interview_not_found', {
        userId: user.id,
        interviewId,
      });
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    const canDecide = await isActiveOrgMember(supabase, user.id, interview.orgId, ['org_owner']);

    if (!canDecide) {
      log.warn('decision.unauthorized', {
        userId: user.id,
        interviewId,
        orgId: interview.orgId,
      });
      return NextResponse.json(
        { error: 'Unauthorized to make decision for this interview' },
        { status: 403 }
      );
    }

    return await withWorkflowMutationIdempotency(
      req,
      {
        userId: user.id,
        orgId: interview.orgId,
        action: 'decision.record',
        resourceType: 'interview',
        resourceId: interviewId,
      },
      body,
      async () => {
        if (interview.status !== 'completed') {
          return NextResponse.json(
            {
              error: 'Interview must be completed before a decision can be recorded',
              code: 'DECISION_NOT_READY',
              workflow: buildWorkflowView({
                machine: 'interview',
                state: interview.status ?? 'scheduled',
                timestamps: {
                  scheduledAt:
                    interview.scheduledAt instanceof Date
                      ? interview.scheduledAt.toISOString()
                      : null,
                },
              }),
              nextAction: {
                id: 'record_interview_outcome',
                label: 'Complete the interview first',
                description:
                  'The legal next action is to finish the interview flow before recording a decision.',
              },
            },
            { status: 409 }
          );
        }

        const decisionRecord = await recordDecisionTransition({
          interviewId,
          toState: decision,
          actorType: 'organization_member',
          actorId: user.id,
          internalNote: feedback,
          reasonCode: reasonCode ?? null,
          holdUntil: holdUntil ? new Date(holdUntil) : null,
        });

        log.info('decision.recorded', {
          userId: user.id,
          interviewId,
          decision,
          reasonCode: reasonCode ?? null,
        });

        return NextResponse.json({
          success: true,
          decision: {
            id: decisionRecord.id,
            interviewId,
            decision: decisionRecord.state,
            holdUntil: decisionRecord.holdUntil,
            reasonCode: decisionRecord.reasonCode,
            updatedAt: decisionRecord.updatedAt,
            workflow: decisionRecord.workflow,
          },
          engagementVerification: decisionRecord.engagementVerification,
        });
      }
    );
  } catch (error) {
    log.error('decision.api.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: 'Failed to record decision' }, { status: 500 });
  }
}
