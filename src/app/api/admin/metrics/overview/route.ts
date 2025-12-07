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


