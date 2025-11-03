import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { calculateTTFQI } from '@/lib/analytics/metrics';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/analytics/ttfqi
 *
 * Calculate TTFQI (Time to First Qualified Introduction) metric
 * Query params:
 * - startDate: ISO date string (optional, defaults to 90 days ago)
 * - endDate: ISO date string (optional, defaults to now)
 * - cohort: cohort name (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // TODO: Add admin role check
    // For now, allow authenticated users

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined;
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined;
    const cohort = searchParams.get('cohort') || undefined;

    const result = await calculateTTFQI(startDate, endDate, cohort);

    if (!result) {
      return NextResponse.json({
        metric: 'ttfqi',
        result: null,
        message: 'Insufficient data to calculate TTFQI',
      });
    }

    log.info('ttfqi.calculated', {
      userId: user.id,
      median: result.median,
      sampleSize: result.sampleSize,
      cohort,
    });

    return NextResponse.json({
      metric: 'ttfqi',
      result,
    });
  } catch (error) {
    log.error('ttfqi.calculation.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to calculate TTFQI' }, { status: 500 });
  }
}
