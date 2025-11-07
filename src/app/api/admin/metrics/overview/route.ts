/**
 * Admin Metrics Overview API
 * GET /api/admin/metrics/overview
 *
 * Returns all 6 core PRD metrics for the admin dashboard
 *
 * PRD References:
 * - Part 2: Goals & Success Metrics
 * - Part 8: Performance (cache for 1 hour)
 */

import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/auth/admin';
import {
  calculateTTSCMedian,
  calculateTTFQIMedian,
  calculateTTVMedian,
  calculateWellBeingImprovementRate,
} from '@/lib/analytics/metrics';
import { db } from '@/db';
import { analyticsEvents } from '@/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import {
  EventType,
  TTSC_TARGET_DAYS,
  TTFQI_TARGET_HOURS,
  TTV_TARGET_DAYS,
  SUS_TARGET_SCORE,
  WELLBEING_DELTA_TARGET_PERCENT,
  PAC_LIFT_TARGET_PERCENT,
} from '@/lib/analytics/constants';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Verify admin access
    await requirePlatformAdmin();

    // Calculate TTSC (North Star Metric)
    const ttscMedian = await calculateTTSCMedian();
    const ttscCount = await getEventCount(EventType.CONTRACT_SIGNED);
    const ttscP75 = await calculatePercentile('ttsc', 75);

    // Calculate TTFQI
    const ttfqiMedian = await calculateTTFQIMedian();
    const ttfqiCount = await getEventCount(EventType.FIRST_QUALIFIED_INTRO);
    const ttfqiP75 = await calculatePercentile('ttfqi', 75);

    // Calculate TTV
    const ttvMedian = await calculateTTVMedian();
    const ttvCount = await getEventCount(EventType.INTERVIEW_SCHEDULED);
    const ttvP75 = await calculatePercentile('ttv', 75);

    // Calculate Well-Being Delta
    const wellbeingRate = await calculateWellBeingImprovementRate(14);
    const wellbeingCount = await getEventCount(EventType.WELLBEING_CHECKIN);

    // Calculate SUS Score
    const susData = await calculateAverageSUS();

    // Calculate PAC Lift (placeholder - requires more complex analysis)
    const pacLift = null; // TODO: Implement PAC lift calculation
    const pacCount = await getEventCount(EventType.MATCH_VIEWED);

    const metrics = {
      ttsc: {
        median: ttscMedian,
        p75: ttscP75,
        count: ttscCount,
        targetMet: ttscMedian !== null && ttscMedian <= TTSC_TARGET_DAYS,
      },
      ttfqi: {
        median: ttfqiMedian,
        p75: ttfqiP75,
        count: ttfqiCount,
        targetMet: ttfqiMedian !== null && ttfqiMedian <= TTFQI_TARGET_HOURS,
      },
      ttv: {
        median: ttvMedian,
        p75: ttvP75,
        count: ttvCount,
        targetMet: ttvMedian !== null && ttvMedian <= TTV_TARGET_DAYS,
      },
      wellbeing: {
        improvementRate: wellbeingRate,
        targetMet: wellbeingRate !== null && wellbeingRate >= WELLBEING_DELTA_TARGET_PERCENT,
        sampleSize: wellbeingCount,
      },
      sus: {
        average: susData.average,
        targetMet: susData.average !== null && susData.average >= SUS_TARGET_SCORE,
        responseCount: susData.count,
      },
      pac: {
        topDecileLift: pacLift,
        targetMet: pacLift !== null && pacLift >= PAC_LIFT_TARGET_PERCENT,
        sampleSize: pacCount,
      },
    };

    return NextResponse.json({
      metrics,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to calculate metrics:', error);
    return NextResponse.json(
      {
        error: 'Failed to calculate metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Get count of events by type
 */
async function getEventCount(eventType: string): Promise<number> {
  try {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(analyticsEvents)
      .where(eq(analyticsEvents.eventType, eventType));

    return result[0]?.count || 0;
  } catch (error) {
    console.error(`Failed to count events for ${eventType}:`, error);
    return 0;
  }
}

/**
 * Calculate percentile for a metric type
 */
async function calculatePercentile(
  metricType: 'ttsc' | 'ttfqi' | 'ttv',
  percentile: number
): Promise<number | null> {
  try {
    let query;

    if (metricType === 'ttsc') {
      query = sql`
        WITH activations AS (
          SELECT 
            user_id,
            created_at as activated_at
          FROM analytics_events
          WHERE event_type = ${EventType.PROFILE_ACTIVATED}
        ),
        contracts AS (
          SELECT DISTINCT ON (user_id)
            user_id,
            created_at as contract_signed_at
          FROM analytics_events
          WHERE event_type = ${EventType.CONTRACT_SIGNED}
          ORDER BY user_id, created_at ASC
        ),
        time_diffs AS (
          SELECT 
            EXTRACT(EPOCH FROM (c.contract_signed_at - a.activated_at)) / 86400 as days
          FROM activations a
          INNER JOIN contracts c ON a.user_id = c.user_id
          WHERE c.contract_signed_at >= a.activated_at
        )
        SELECT PERCENTILE_CONT(${percentile / 100}) WITHIN GROUP (ORDER BY days) as p_value
        FROM time_diffs
      `;
    } else if (metricType === 'ttfqi') {
      query = sql`
        WITH activations AS (
          SELECT 
            user_id,
            created_at as activated_at
          FROM analytics_events
          WHERE event_type = ${EventType.PROFILE_ACTIVATED}
        ),
        first_intros AS (
          SELECT DISTINCT ON (user_id)
            user_id,
            created_at as first_intro_at
          FROM analytics_events
          WHERE event_type = ${EventType.FIRST_QUALIFIED_INTRO}
          ORDER BY user_id, created_at ASC
        ),
        time_diffs AS (
          SELECT 
            EXTRACT(EPOCH FROM (fi.first_intro_at - a.activated_at)) / 3600 as hours
          FROM activations a
          INNER JOIN first_intros fi ON a.user_id = fi.user_id
          WHERE fi.first_intro_at >= a.activated_at
        )
        SELECT PERCENTILE_CONT(${percentile / 100}) WITHIN GROUP (ORDER BY hours) as p_value
        FROM time_diffs
      `;
    } else {
      // TTV
      query = sql`
        WITH activations AS (
          SELECT 
            user_id,
            created_at as activated_at
          FROM analytics_events
          WHERE event_type = ${EventType.PROFILE_ACTIVATED}
        ),
        first_interviews AS (
          SELECT DISTINCT ON (user_id)
            user_id,
            created_at as first_interview_at
          FROM analytics_events
          WHERE event_type = ${EventType.INTERVIEW_SCHEDULED}
          ORDER BY user_id, created_at ASC
        ),
        time_diffs AS (
          SELECT 
            EXTRACT(EPOCH FROM (fi.first_interview_at - a.activated_at)) / 86400 as days
          FROM activations a
          INNER JOIN first_interviews fi ON a.user_id = fi.user_id
          WHERE fi.first_interview_at >= a.activated_at
        )
        SELECT PERCENTILE_CONT(${percentile / 100}) WITHIN GROUP (ORDER BY days) as p_value
        FROM time_diffs
      `;
    }

    const result = await db.execute<{ p_value: number }>(query);
    return result.rows[0]?.p_value || null;
  } catch (error) {
    console.error(`Failed to calculate ${percentile}th percentile for ${metricType}:`, error);
    return null;
  }
}

/**
 * Calculate average SUS score
 */
async function calculateAverageSUS(): Promise<{ average: number | null; count: number }> {
  try {
    const surveys = await db
      .select()
      .from(analyticsEvents)
      .where(eq(analyticsEvents.eventType, EventType.SUS_SURVEY_COMPLETED));

    if (surveys.length === 0) {
      return { average: null, count: 0 };
    }

    const scores = surveys
      .map((s) => (s.properties as any)?.score)
      .filter((score) => typeof score === 'number');

    if (scores.length === 0) {
      return { average: null, count: 0 };
    }

    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    return { average, count: scores.length };
  } catch (error) {
    console.error('Failed to calculate SUS average:', error);
    return { average: null, count: 0 };
  }
}
