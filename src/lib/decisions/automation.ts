/**
 * Decision Automation Library
 *
 * Implements PRD Requirement: 48-hour decision window after interview
 * Tracks decision SLA and sends reminders
 */

import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { log } from '@/lib/log';
import { emitDecisionMade } from '@/lib/analytics/events';

// ============================================================================
// TYPES
// ============================================================================

export type DecisionType = 'hire' | 'advance' | 'hold' | 'reject';

export interface Decision {
  id: string;
  interviewId: string;
  decision: DecisionType;
  feedback?: string;
  decisionMadeAt: Date;
  hoursSinceInterview: number;
  withinSLA: boolean; // Within 48 hours
}

export interface DecisionWindow {
  interviewId: string;
  interviewCompletedAt: Date;
  deadline: Date; // 48 hours from interview completion
  hoursRemaining: number;
  isOverdue: boolean;
  remindersSent: number;
}

// ============================================================================
// DECISION TRACKING
// ============================================================================

/**
 * Record a decision for an interview
 */
export async function recordDecision(
  userId: string,
  interviewId: string,
  decision: DecisionType,
  feedback?: string
): Promise<Decision> {
  try {
    // Get interview completion time
    const interview = await db.execute(sql`
      SELECT completed_at
      FROM interviews
      WHERE id = ${interviewId}
    `);

    if (!interview.rows.length) {
      throw new Error('Interview not found');
    }

    const completedAt = new Date((interview.rows[0] as any).completed_at);
    const now = new Date();
    const hoursSinceInterview = (now.getTime() - completedAt.getTime()) / (1000 * 60 * 60);
    const withinSLA = hoursSinceInterview <= 48;

    // Store decision
    const result = await db.execute(sql`
      INSERT INTO decisions (
        interview_id,
        decision,
        feedback,
        hours_since_interview,
        within_sla,
        created_at
      ) VALUES (
        ${interviewId},
        ${decision},
        ${feedback || null},
        ${hoursSinceInterview},
        ${withinSLA},
        NOW()
      )
      RETURNING *
    `);

    const decisionRecord = result.rows[0] as any;

    // Emit analytics event
    await emitDecisionMade(userId, interviewId, {
      interview_id: interviewId,
      decision,
      hours_since_interview: hoursSinceInterview,
      feedback_provided: !!feedback,
    });

    log.info('decision.recorded', {
      userId,
      interviewId,
      decision,
      hoursSinceInterview: hoursSinceInterview.toFixed(2),
      withinSLA,
    });

    return {
      id: decisionRecord.id,
      interviewId,
      decision,
      feedback,
      decisionMadeAt: new Date(decisionRecord.created_at),
      hoursSinceInterview,
      withinSLA,
    };
  } catch (error) {
    log.error('decision.record.failed', {
      userId,
      interviewId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Get decision window status for an interview
 */
export async function getDecisionWindow(interviewId: string): Promise<DecisionWindow | null> {
  try {
    const interview = await db.execute(sql`
      SELECT completed_at
      FROM interviews
      WHERE id = ${interviewId}
        AND status = 'completed'
    `);

    if (!interview.rows.length) {
      return null;
    }

    const completedAt = new Date((interview.rows[0] as any).completed_at);
    const deadline = new Date(completedAt.getTime() + 48 * 60 * 60 * 1000); // 48 hours
    const now = new Date();
    const hoursRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    const isOverdue = hoursRemaining < 0;

    // Count reminders sent
    const reminders = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM decision_reminders
      WHERE interview_id = ${interviewId}
    `);

    const remindersSent = parseInt((reminders.rows[0] as any)?.count || '0');

    return {
      interviewId,
      interviewCompletedAt: completedAt,
      deadline,
      hoursRemaining,
      isOverdue,
      remindersSent,
    };
  } catch (error) {
    log.error('decision.window.failed', {
      interviewId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Get all interviews awaiting decisions (no decision made yet)
 */
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
  try {
    const result = await db.execute(sql`
      SELECT
        i.id as interview_id,
        i.assignment_id,
        i.participant_user_ids[1] as candidate_id,
        a.organization_id,
        i.completed_at,
        EXTRACT(EPOCH FROM (i.completed_at + INTERVAL '48 hours' - NOW())) / 3600 as hours_remaining
      FROM interviews i
      INNER JOIN assignments a ON i.assignment_id = a.id
      LEFT JOIN decisions d ON i.id = d.interview_id
      WHERE i.status = 'completed'
        AND d.id IS NULL
        AND i.completed_at < NOW()
      ORDER BY i.completed_at ASC
    `);

    return result.rows.map((row: any) => ({
      interviewId: row.interview_id,
      assignmentId: row.assignment_id,
      candidateId: row.candidate_id,
      organizationId: row.organization_id,
      completedAt: new Date(row.completed_at),
      hoursRemaining: parseFloat(row.hours_remaining),
      isOverdue: parseFloat(row.hours_remaining) < 0,
    }));
  } catch (error) {
    log.error('decision.awaiting.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return [];
  }
}

// ============================================================================
// REMINDER SYSTEM
// ============================================================================

/**
 * Send decision reminder to organization
 * Reminders sent at: 24h, 40h, 48h (deadline), 54h (overdue)
 */
export async function sendDecisionReminder(
  interviewId: string,
  organizationId: string,
  reminderType: '24h' | '40h' | '48h_deadline' | '54h_overdue'
): Promise<boolean> {
  try {
    // Get interview details
    const interview = await db.execute(sql`
      SELECT
        i.*,
        a.role,
        a.organization_id
      FROM interviews i
      INNER JOIN assignments a ON i.assignment_id = a.id
      WHERE i.id = ${interviewId}
    `);

    if (!interview.rows.length) {
      log.warn('decision.reminder.no_interview', { interviewId });
      return false;
    }

    const interviewData = interview.rows[0] as any;

    // Check if decision already made
    const decision = await db.execute(sql`
      SELECT id FROM decisions WHERE interview_id = ${interviewId}
    `);

    if (decision.rows.length > 0) {
      log.info('decision.reminder.already_decided', { interviewId });
      return false;
    }

    // Record reminder sent
    await db.execute(sql`
      INSERT INTO decision_reminders (
        interview_id,
        organization_id,
        reminder_type,
        sent_at
      ) VALUES (
        ${interviewId},
        ${organizationId},
        ${reminderType},
        NOW()
      )
    `);

    // TODO: Send actual email/notification
    // For now, just log
    log.info('decision.reminder.sent', {
      interviewId,
      organizationId,
      reminderType,
      role: interviewData.role,
    });

    // Emit analytics event
    await db.execute(sql`
      INSERT INTO analytics_events (
        event_type,
        user_id,
        organization_id,
        entity_type,
        entity_id,
        properties,
        occurred_at
      ) VALUES (
        'decision_reminder_sent',
        ${organizationId},
        ${organizationId},
        'interview',
        ${interviewId},
        ${JSON.stringify({ reminder_type: reminderType })}::jsonb,
        NOW()
      )
    `);

    return true;
  } catch (error) {
    log.error('decision.reminder.failed', {
      interviewId,
      reminderType,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Process decision reminders (called by cron)
 * Checks all completed interviews and sends appropriate reminders
 */
export async function processDecisionReminders(): Promise<{
  processed: number;
  sent: number;
  skipped: number;
}> {
  try {
    log.info('decision.reminders.processing.start');

    const awaitingDecision = await getInterviewsAwaitingDecision();
    let sent = 0;
    let skipped = 0;

    for (const interview of awaitingDecision) {
      const hoursElapsed = 48 - interview.hoursRemaining;

      // Check if reminder already sent
      const existingReminders = await db.execute(sql`
        SELECT reminder_type
        FROM decision_reminders
        WHERE interview_id = ${interview.interviewId}
      `);

      const sentTypes = new Set(existingReminders.rows.map((r: any) => r.reminder_type));

      // Determine which reminder to send based on hours elapsed
      let reminderType: '24h' | '40h' | '48h_deadline' | '54h_overdue' | null = null;

      if (hoursElapsed >= 54 && !sentTypes.has('54h_overdue')) {
        reminderType = '54h_overdue';
      } else if (hoursElapsed >= 48 && !sentTypes.has('48h_deadline')) {
        reminderType = '48h_deadline';
      } else if (hoursElapsed >= 40 && !sentTypes.has('40h')) {
        reminderType = '40h';
      } else if (hoursElapsed >= 24 && !sentTypes.has('24h')) {
        reminderType = '24h';
      }

      if (reminderType) {
        const success = await sendDecisionReminder(
          interview.interviewId,
          interview.organizationId,
          reminderType
        );
        if (success) {
          sent++;
        } else {
          skipped++;
        }
      } else {
        skipped++;
      }
    }

    log.info('decision.reminders.processing.complete', {
      processed: awaitingDecision.length,
      sent,
      skipped,
    });

    return {
      processed: awaitingDecision.length,
      sent,
      skipped,
    };
  } catch (error) {
    log.error('decision.reminders.processing.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return { processed: 0, sent: 0, skipped: 0 };
  }
}
