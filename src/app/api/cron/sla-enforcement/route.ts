import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { matches, interviews } from '@/db/schema';
import { lt, and, eq, isNull, sql } from 'drizzle-orm';
import {
  MATCHING_CONSTRAINTS,
  DECISION_CONSTRAINTS,
  getDecisionDeadline,
} from '@/lib/sla/constraints';
import { log } from '@/lib/log';

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
          isNull(interviews.decision),
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

    log.info('sla.cron.completed', {
      expiredMatches: results.expiredMatches,
      expiredInterviews: results.expiredInterviews,
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
