import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/auth/admin';
import { calculateTTV } from '@/lib/analytics/metrics';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/analytics/ttv
 *
 * Calculate TTV (Time to Value) metric
 * Query params:
 * - startDate: ISO date string (optional, defaults to 90 days ago)
 * - endDate: ISO date string (optional, defaults to now)
 * - cohort: cohort name (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requirePlatformAdmin();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined;
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined;
    const cohort = searchParams.get('cohort') || undefined;

    const result = await calculateTTV(startDate, endDate, cohort);

    if (!result) {
      return NextResponse.json({
        metric: 'ttv',
        result: null,
        message: 'Insufficient data to calculate TTV',
      });
    }

    log.info('ttv.calculated', {
      userId: user.userId,
      median: result.median,
      sampleSize: result.sampleSize,
      cohort,
    });

    return NextResponse.json({
      metric: 'ttv',
      result,
    });
  } catch (error) {
    log.error('ttv.calculation.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to calculate TTV' }, { status: 500 });
  }
}
