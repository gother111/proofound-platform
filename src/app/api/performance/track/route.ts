/**
 * POST /api/performance/track
 *
 * Endpoint for receiving client-side performance metrics
 * Called by the client-side performance tracker
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { performanceMetrics } from '@/db/schema';
import type { InsertPerformanceMetric } from '@/db/schema';
import { anonymizeUserAgent } from '@/lib/utils/privacy';
import { requireApiAuth } from '@/lib/api/auth';
import { requireAnalyticsConsentForUser } from '@/lib/privacy/analytics-consent';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiAuth();
    if (authResult instanceof NextResponse) {
      return NextResponse.json(
        { success: true, skipped: 'analytics_consent_missing' },
        { status: 202 }
      );
    }

    const hasAnalyticsConsent = await requireAnalyticsConsentForUser(authResult.user.id);
    if (!hasAnalyticsConsent) {
      return NextResponse.json(
        { success: true, skipped: 'analytics_consent_missing' },
        { status: 202 }
      );
    }

    const data = await request.json();

    const { metricType, pageRoute, valueMs, deviceType, timestamp } = data;

    // Validate required fields
    if (!metricType || !pageRoute || valueMs === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: metricType, pageRoute, valueMs' },
        { status: 400 }
      );
    }

    // Validate metric type
    const validMetricTypes = ['page_load', 'api_latency', 'tti', 'fcp', 'lcp', 'cls', 'fid'];
    if (!validMetricTypes.includes(metricType)) {
      return NextResponse.json({ error: 'Invalid metric type' }, { status: 400 });
    }

    // Validate device type
    const validDeviceTypes = ['desktop', 'mobile', 'tablet'];
    if (deviceType && !validDeviceTypes.includes(deviceType)) {
      return NextResponse.json({ error: 'Invalid device type' }, { status: 400 });
    }

    const rawUserAgent = request.headers.get('user-agent') || '';
    let userAgentHash: string | null = null;
    if (rawUserAgent) {
      try {
        userAgentHash = anonymizeUserAgent(rawUserAgent);
      } catch {
        userAgentHash = null;
      }
    }

    // Create metric record
    const metric: InsertPerformanceMetric = {
      metricType,
      pageRoute,
      apiEndpoint: null,
      valueMs: String(valueMs),
      deviceType: deviceType || null,
      userAgent: userAgentHash,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      sampleCount: 1,
      p50: null,
      p95: null,
      p99: null,
      periodStart: null,
      periodEnd: null,
    };

    await db.insert(performanceMetrics).values(metric);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Performance tracking error:', error);

    // Return success even on error to avoid disrupting client experience
    // Log errors for monitoring but don't fail the request
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
