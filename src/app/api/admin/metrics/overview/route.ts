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

import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdminJson } from '@/lib/api/route-helpers';
import {
  calculateTTSC,
  calculateTTFQI,
  calculateTTV,
  calculateWellBeingDelta,
  calculateSUS,
  calculatePACLift,
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

export async function GET(_request: NextRequest) {
  try {
    // Verify admin access (JSON-friendly)
    const adminUser = await requirePlatformAdminJson();
    if (adminUser instanceof NextResponse) return adminUser;

    // Calculate TTSC (North Star Metric)
    const ttscResult = await calculateTTSC();

    // Calculate TTFQI
    const ttfqiResult = await calculateTTFQI();

    // Calculate TTV
    const ttvResult = await calculateTTV();

    // Calculate Well-Being Delta
    const wellbeingResult = await calculateWellBeingDelta();

    // Calculate SUS Score
    const susResult = await calculateSUS();

    // Calculate PAC Lift
    const pacResult = await calculatePACLift();

    const metrics = {
      ttsc: {
        median: ttscResult.value,
        p75: ttscResult.percentile?.p75 || null,
        count: ttscResult.sampleSize,
        targetMet: ttscResult.onTrack,
      },
      ttfqi: {
        median: ttfqiResult.value,
        p75: ttfqiResult.percentile?.p75 || null,
        count: ttfqiResult.sampleSize,
        targetMet: ttfqiResult.onTrack,
      },
      ttv: {
        median: ttvResult.value,
        p75: ttvResult.percentile?.p75 || null,
        count: ttvResult.sampleSize,
        targetMet: ttvResult.onTrack,
      },
      wellbeing: {
        improvementRate: wellbeingResult.positiveChange,
        targetMet: wellbeingResult.onTrack,
        sampleSize: wellbeingResult.sampleSize,
      },
      sus: {
        average: susResult.value,
        targetMet: susResult.onTrack,
        responseCount: susResult.responses,
      },
      pac: {
        topDecileLift: pacResult.lift,
        targetMet: pacResult.onTrack,
        sampleSize: pacResult.sampleSize.withPAC + pacResult.sampleSize.withoutPAC,
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
