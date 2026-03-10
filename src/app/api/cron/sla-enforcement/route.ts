import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { matches, interviews } from '@/db/schema';
import { lt, and, eq, isNull, sql } from 'drizzle-orm';
import { getRows } from '@/lib/db/rows';
import {
  MATCHING_CONSTRAINTS,
  DECISION_CONSTRAINTS,
  getDecisionDeadline,
} from '@/lib/sla/constraints';
import { log } from '@/lib/log';
import { resolveFeedbackFollowUpState } from '@/lib/feedback/service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/sla-enforcement
 *
 * Automated SLA enforcement cron job
 * - Expires matches past 72-hour review window
 * - Flags interviews past 48-hour decision window
 *
 * Protected by CRON_SECRET environment variable
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      log.warn('sla.cron.unauthorized', {
        hasAuth: !!authHeader,
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = {
      expiredMatches: 0,
      expiredInterviews: 0,
      matchIds: [] as string[],
      interviewIds: [] as string[],
      flaggedOverdueDecisions: 0,
      feedbackDue: 0,
      feedbackBreached: 0,
      feedbackInterviewIds: [] as string[],
    };

    // 1. Expire matches past 72-hour review window (PRD I-23)
    const matchReviewCutoff = new Date(
      Date.now() - MATCHING_CONSTRAINTS.REVIEW_WINDOW_HOURS * 60 * 60 * 1000
    );

    // Only expire matches that haven't been snoozed or actioned
    const expiredMatches = await db
      .select({ id: matches.id })
      .from(matches)
      .where(
        and(
          lt(matches.createdAt, matchReviewCutoff),
          isNull(matches.snoozedUntil),
          sql`NOT EXISTS (
            SELECT 1
            FROM interviews i
            WHERE i.match_id = ${matches.id}
          )`
        )
      )
      .limit(100); // Process in batches

    if (expiredMatches.length > 0) {
      const matchIds = expiredMatches.map((m) => m.id);

      // Soft delete by setting snoozedUntil to far future (or add status field in future)
      // For now, we'll mark them as "expired" by snoozing them for a year
      const expiredDate = new Date();
      expiredDate.setFullYear(expiredDate.getFullYear() + 1);

      await db
        .update(matches)
        .set({ snoozedUntil: expiredDate })
        .where(
          sql`${matches.id} IN (${sql.join(
            matchIds.map((id) => sql`${id}`),
            sql`, `
          )})`
        );

      results.expiredMatches = expiredMatches.length;
      results.matchIds = matchIds;

      log.info('sla.matches.expired', {
        count: expiredMatches.length,
        cutoff: matchReviewCutoff.toISOString(),
      });
    }

    // 2. Flag interviews past 48-hour decision window (PRD I-22)
    const decisionCutoff = new Date(
      Date.now() - DECISION_CONSTRAINTS.WINDOW_HOURS * 60 * 60 * 1000
    );

    // Find completed interviews without decisions past the deadline.
    // Keep status unchanged until explicit product policy confirms auto-transition behavior.
    const expiredInterviews = await db
      .select({ id: interviews.id })
      .from(interviews)
      .where(
        and(
          eq(interviews.status, 'completed'),
          isNull(interviews.decidedBy),
          lt(interviews.scheduledAt, decisionCutoff)
        )
      )
      .limit(100); // Process in batches

    if (expiredInterviews.length > 0) {
      const interviewIds = expiredInterviews.map((i) => i.id);

      results.expiredInterviews = expiredInterviews.length;
      results.interviewIds = interviewIds;
      results.flaggedOverdueDecisions = expiredInterviews.length;

      log.info('sla.interviews.overdue_decision_window', {
        count: expiredInterviews.length,
        cutoff: decisionCutoff.toISOString(),
        decisionDeadlineExample: getDecisionDeadline(new Date(decisionCutoff)).toISOString(),
      });
    }

    const feedbackFollowUpsResult = await db.execute(sql`
      SELECT
        i.id AS interview_id,
        i.completed_at,
        MAX(CASE WHEN fr.direction = 'candidate_to_org' THEN fr.shared_at END) AS candidate_submitted_at,
        MAX(CASE WHEN fr.direction = 'org_to_candidate' THEN fr.shared_at END) AS organization_submitted_at
      FROM interviews i
      LEFT JOIN feedback_responses fr ON fr.interview_id = i.id
      WHERE i.status = 'completed'
        AND i.completed_at IS NOT NULL
      GROUP BY i.id, i.completed_at
      ORDER BY i.completed_at ASC
      LIMIT 200
    `);

    const feedbackWindows = (
      getRows(feedbackFollowUpsResult) as Array<{
        interview_id: string;
        completed_at: string;
        candidate_submitted_at: string | null;
        organization_submitted_at: string | null;
      }>
    ).map((row) => ({
      interviewId: row.interview_id,
      state: resolveFeedbackFollowUpState({
        completedAt: row.completed_at,
        candidateSubmittedAt: row.candidate_submitted_at,
        organizationSubmittedAt: row.organization_submitted_at,
      }),
    }));

    results.feedbackDue = feedbackWindows.filter((row) => row.state.overallState === 'due').length;
    results.feedbackBreached = feedbackWindows.filter(
      (row) => row.state.overallState === 'breached'
    ).length;
    results.feedbackInterviewIds = feedbackWindows
      .filter((row) => row.state.overallState === 'due' || row.state.overallState === 'breached')
      .map((row) => row.interviewId);

    log.info('sla.cron.completed', {
      expiredMatches: results.expiredMatches,
      expiredInterviews: results.expiredInterviews,
      feedbackDue: results.feedbackDue,
      feedbackBreached: results.feedbackBreached,
    });

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    log.error('sla.cron.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        error: 'SLA enforcement failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
