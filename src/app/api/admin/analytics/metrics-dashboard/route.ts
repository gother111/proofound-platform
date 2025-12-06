import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdminJson } from '@/lib/api/route-helpers';
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
    const user = await requirePlatformAdminJson();
    if (user instanceof NextResponse) return user;

    const metrics = await getAllMetrics();

    log.info('metrics-dashboard.fetched', {
      userId: user.userId,
      hasData: {
        ttsc: !!metrics.ttsc,
        ttfqi: !!metrics.ttfqi,
        ttv: !!metrics.ttv,
        pacLift: !!metrics.pacLift,
      },
    });

    return NextResponse.json({
      metrics,
      summary: {
        ttscMeetsTarget: metrics.ttsc ? metrics.ttsc.value <= 30 : null,
        ttfqiMeetsTarget: metrics.ttfqi ? metrics.ttfqi.value <= 72 : null,
        ttvMeetsTarget: metrics.ttv ? metrics.ttv.value <= 7 : null,
        pacMeetsTargets: metrics.pacLift ? metrics.pacLift.onTrack : null,
      },
    });
  } catch (error) {
    log.error('metrics-dashboard.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to fetch metrics dashboard' }, { status: 500 });
  }
}
