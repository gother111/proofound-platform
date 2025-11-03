import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/auth/admin';
import { calculatePACLift } from '@/lib/analytics/metrics';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/analytics/pac
 *
 * Calculate PAC (Purpose-Alignment Contribution) lift metric
 * Query params:
 * - startDate: ISO date string (optional, defaults to 90 days ago)
 * - endDate: ISO date string (optional, defaults to now)
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

    const result = await calculatePACLift(startDate, endDate);

    if (!result) {
      return NextResponse.json({
        metric: 'pac',
        result: null,
        message: 'Insufficient data to calculate PAC lift',
      });
    }

    log.info('pac.calculated', {
      userId: user.userId,
      acceptanceLift: result.acceptanceLift,
      contractLift: result.contractLift,
      sampleSize: result.sampleSize,
    });

    return NextResponse.json({
      metric: 'pac',
      result,
    });
  } catch (error) {
    log.error('pac.calculation.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to calculate PAC lift' }, { status: 500 });
  }
}
