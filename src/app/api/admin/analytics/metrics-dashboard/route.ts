import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getAllMetrics } from '@/lib/analytics/metrics';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/analytics/metrics-dashboard
 *
 * Get all metrics in a single consolidated response
 * Query params:
 * - startDate: ISO date string (optional, defaults to 90 days ago)
 * - endDate: ISO date string (optional, defaults to now)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // TODO: Add admin role check
    // For now, allow authenticated users

    const metrics = await getAllMetrics();

    log.info('metrics-dashboard.fetched', {
      userId: user.id,
      hasData: {
        ttsc: !!metrics.ttsc,
        ttfqi: !!metrics.ttfqi,
        ttv: !!metrics.ttv,
        pac: !!metrics.pac,
      },
    });

    return NextResponse.json({
      metrics,
      summary: {
        ttscMeetsTarget: metrics.ttsc ? metrics.ttsc.median <= 30 : null,
        ttfqiMeetsTarget: metrics.ttfqi ? metrics.ttfqi.median <= 72 : null,
        ttvMeetsTarget: metrics.ttv ? metrics.ttv.median <= 7 : null,
        pacMeetsTargets: metrics.pac
          ? metrics.pac.meetsAcceptanceTarget && metrics.pac.meetsContractTarget
          : null,
      },
    });
  } catch (error) {
    log.error('metrics-dashboard.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to fetch metrics dashboard' }, { status: 500 });
  }
}
