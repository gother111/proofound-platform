/**
 * All Metrics API Endpoint
 *
 * GET /api/metrics/all
 * Returns all key PRD metrics in one call
 * Requires: platform_admin or super_admin
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/auth/admin';
import { calculateAllMetrics } from '@/lib/analytics/metrics';
import { log } from '@/lib/log';

export async function GET(request: NextRequest) {
  try {
    // Use consistent admin auth pattern
    const adminUser = await requirePlatformAdmin();

    // Get date range from query params
    const url = new URL(request.url);
    const daysParam = url.searchParams.get('days') || '30';
    const days = parseInt(daysParam);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    log.info('metrics.all.request', { admin: adminUser.userId, days });

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
    // Check if this is a redirect from requirePlatformAdmin
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error;
    }

    log.error('metrics.all.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to calculate metrics' }, { status: 500 });
  }
}
