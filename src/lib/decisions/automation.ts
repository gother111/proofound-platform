/**
 * Canonical decision automation and reminder processing.
 *
 * Decision current-state lives in `decisions`.
 * Reminder delivery attempts live in `workflow_async_jobs`.
 */

import { and, desc, eq, inArray, sql } from 'drizzle-orm';

import { db } from '@/db';
import { decisions, interviews, workflowAsyncJobs } from '@/db/schema';
import { getRows } from '@/lib/db/rows';
import { log } from '@/lib/log';
import {
  cancelWorkflowJobs,
  claimWorkflowJobs,
  markWorkflowJobFailure,
  markWorkflowJobSuccess,
} from '@/lib/workflow/queue';
import { recordDecisionTransition } from '@/lib/workflow/service';

export type DecisionType = 'hire' | 'advance' | 'hold' | 'reject' | 'withdraw';

export interface Decision {
  id: string;
  interviewId: string;
  decision: DecisionType;
  feedback?: string;
  decisionMadeAt: Date;
  hoursSinceInterview: number;
  withinSLA: boolean;
}

export interface DecisionWindow {
  interviewId: string;
  interviewCompletedAt: Date;
  deadline: Date;
  hoursRemaining: number;
  isOverdue: boolean;
  remindersSent: number;
}

type DecisionWindowInterview = {
  completedAt: Date | null;
  updatedAt: Date | null;
  scheduledAt: Date | null;
};

function resolveCompletedAt(interview: DecisionWindowInterview | null) {
  if (!interview) {
    return null;
  }

  return interview.completedAt ?? interview.updatedAt ?? interview.scheduledAt;
}

async function getInterview(interviewId: string) {
  const [interview] = await db
    .select({
      completedAt: interviews.completedAt,
      updatedAt: interviews.updatedAt,
      scheduledAt: interviews.scheduledAt,
    })
    .from(interviews)
    .where(eq(interviews.id, interviewId))
    .limit(1);

  return interview ?? null;
}

async function getDecisionByInterview(interviewId: string) {
  return db.query.decisions.findFirst({
    where: eq(decisions.latestInterviewId, interviewId),
    orderBy: [desc(decisions.updatedAt)],
  });
}

/**
 * Backward-compatible wrapper used by older route/tests.
 */
export async function recordDecision(
  userId: string,
  interviewId: string,
  decision: DecisionType,
  feedback?: string
): Promise<Decision> {
  const updated = await recordDecisionTransition({
    interviewId,
    toState: decision,
    actorType: 'organization_member',
    actorId: userId,
    internalNote: feedback ?? null,
  });

  const interview = await getInterview(interviewId);
  const completedAt = resolveCompletedAt(interview ?? null) ?? new Date();
  const decisionMadeAt = updated.updatedAt ?? new Date();
  const hoursSinceInterview = (decisionMadeAt.getTime() - completedAt.getTime()) / (1000 * 60 * 60);

  return {
    id: updated.id,
    interviewId,
    decision,
    feedback,
    decisionMadeAt,
    hoursSinceInterview,
    withinSLA: hoursSinceInterview <= 48,
  };
}

export async function getDecisionWindow(interviewId: string): Promise<DecisionWindow | null> {
  const interview = await getInterview(interviewId);
  const completedAt = resolveCompletedAt(interview ?? null);
  if (!interview || !completedAt) {
    return null;
  }

  const deadline = new Date(completedAt.getTime() + 48 * 60 * 60 * 1000);
  const now = new Date();
  const hoursRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
  const decision = await getDecisionByInterview(interviewId);

  let remindersSent = 0;
  if (decision) {
    const reminderRows = await db
      .select({ id: workflowAsyncJobs.id })
      .from(workflowAsyncJobs)
      .where(
        and(
          eq(workflowAsyncJobs.decisionId, decision.id),
          eq(workflowAsyncJobs.jobType, 'decision_reminder'),
          eq(workflowAsyncJobs.status, 'completed')
        )
      );

    remindersSent = reminderRows.length;
  }

  return {
    interviewId,
    interviewCompletedAt: completedAt,
    deadline,
    hoursRemaining,
    isOverdue: hoursRemaining < 0,
    remindersSent,
  };
}

export async function getInterviewsAwaitingDecision(): Promise<
  Array<{
    interviewId: string;
    assignmentId: string;
    candidateId: string;
    organizationId: string;
    completedAt: Date;
    hoursRemaining: number;
    isOverdue: boolean;
  }>
> {
  const result = await db.execute(sql`
    SELECT
      i.id AS interview_id,
      d.assignment_id,
      d.candidate_profile_id AS candidate_id,
      d.org_id AS organization_id,
      COALESCE(i.completed_at, i.updated_at, i.scheduled_at) AS completed_at
    FROM public.decisions d
    INNER JOIN public.interviews i ON i.id = d.latest_interview_id
    WHERE d.state = 'pending'
      AND i.status = 'completed'
    ORDER BY COALESCE(i.completed_at, i.updated_at, i.scheduled_at) ASC
  `);

  return (
    getRows(result) as Array<{
      interview_id: string;
      assignment_id: string;
      candidate_id: string;
      organization_id: string;
      completed_at: string;
    }>
  ).map((row) => {
    const completedAt = new Date(row.completed_at);
    const deadline = new Date(completedAt.getTime() + 48 * 60 * 60 * 1000);
    const hoursRemaining = (deadline.getTime() - Date.now()) / (1000 * 60 * 60);
    return {
      interviewId: row.interview_id,
      assignmentId: row.assignment_id,
      candidateId: row.candidate_id,
      organizationId: row.organization_id,
      completedAt,
      hoursRemaining,
      isOverdue: hoursRemaining < 0,
    };
  });
}

export async function sendDecisionReminder(
  interviewId: string,
  organizationId: string,
  reminderType: '24h' | '40h' | '48h_deadline' | '54h_overdue'
): Promise<boolean> {
  const decision = await getDecisionByInterview(interviewId);
  if (!decision || decision.state !== 'pending') {
    log.info('decision.reminder.skipped_not_pending', {
      interviewId,
      organizationId,
      reminderType,
    });
    return false;
  }

  log.info('decision.reminder.sent', {
    interviewId,
    organizationId,
    reminderType,
    decisionId: decision.id,
  });

  try {
    await db.execute(sql`
      INSERT INTO analytics_events (
        event_type,
        user_id,
        org_id,
        entity_type,
        entity_id,
        properties,
        created_at
      ) VALUES (
        'decision_reminder_sent',
        ${decision.candidateProfileId},
        ${organizationId},
        'decision',
        ${decision.id},
        ${JSON.stringify({ reminder_type: reminderType, interview_id: interviewId })}::jsonb,
        NOW()
      )
    `);
  } catch (error) {
    log.warn('decision.reminder.analytics_failed', {
      interviewId,
      decisionId: decision.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  return true;
}

export async function processDecisionReminders(): Promise<{
  processed: number;
  sent: number;
  skipped: number;
}> {
  const jobs = await claimWorkflowJobs(50);
  const reminderJobs = jobs.filter((job) => job.jobType === 'decision_reminder');

  let sent = 0;
  let skipped = 0;

  for (const job of reminderJobs) {
    try {
      const decisionId = job.decisionId;
      const interviewId = job.interviewId;
      const reminderType = String((job.payload as Record<string, unknown>)?.reminderKey ?? '');

      if (
        !decisionId ||
        !interviewId ||
        !['24h', '40h', '48h_deadline', '54h_overdue'].includes(reminderType)
      ) {
        await markWorkflowJobFailure(job.id, 'Malformed decision reminder payload');
        continue;
      }

      const decision = await db.query.decisions.findFirst({
        where: eq(decisions.id, decisionId),
      });

      if (!decision || decision.state !== 'pending') {
        await markWorkflowJobSuccess(job.id, { outcome: 'suppressed_not_pending' });
        skipped += 1;
        continue;
      }

      const sentReminder = await sendDecisionReminder(
        interviewId,
        decision.orgId,
        reminderType as '24h' | '40h' | '48h_deadline' | '54h_overdue'
      );

      if (!sentReminder) {
        await markWorkflowJobSuccess(job.id, { outcome: 'suppressed' });
        skipped += 1;
        continue;
      }

      await markWorkflowJobSuccess(job.id, { outcome: 'sent', reminderType });
      sent += 1;
    } catch (error) {
      await markWorkflowJobFailure(
        job.id,
        error instanceof Error ? error.message : 'Unknown decision reminder error'
      );
    }
  }

  const leasedNonReminderIds = jobs
    .filter((job) => job.jobType !== 'decision_reminder')
    .map((job) => job.id);

  if (leasedNonReminderIds.length > 0) {
    await db
      .update(workflowAsyncJobs)
      .set({
        status: 'pending',
        leaseExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          inArray(workflowAsyncJobs.id, leasedNonReminderIds),
          eq(workflowAsyncJobs.status, 'leased')
        )
      );
  }

  return {
    processed: reminderJobs.length,
    sent,
    skipped,
  };
}

export async function cancelDecisionRemindersForInterview(interviewId: string) {
  const decision = await getDecisionByInterview(interviewId);
  if (!decision) {
    return 0;
  }

  return cancelWorkflowJobs({
    decisionId: decision.id,
    jobTypes: ['decision_reminder'],
    reason: 'decision_no_longer_pending',
  });
}
