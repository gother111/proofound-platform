/**
 * All Metrics API Endpoint
 *
 * GET /api/metrics/all
 * Returns all key PRD metrics in one call
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { calculateAllMetrics } from '@/lib/analytics/metrics';
import { log } from '@/lib/log';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Only platform admins can view metrics
    const { data: profile } = await db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.id, user.id),
    });

    if (!profile || profile.platformRole !== 'platform_admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    // Get date range from query params
    const url = new URL(request.url);
    const daysParam = url.searchParams.get('days') || '30';
    const days = parseInt(daysParam);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    log.info('metrics.all.request', { admin: user.id, days });

    // Calculate all metrics
    const metrics = await calculateAllMetrics(startDate, endDate);

    return NextResponse.json({
      metrics,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days,
      },
    });
  } catch (error) {
    log.error('metrics.all.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to calculate metrics' }, { status: 500 });
  }
}
