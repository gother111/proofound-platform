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

function resolveAllowedOrigins(request: NextRequest): Set<string> {
  const allowed = new Set<string>();
  allowed.add(new URL(request.url).origin);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    try {
      allowed.add(new URL(siteUrl).origin);
    } catch {
      // ignore invalid env var
    }
  }

  return allowed;
}

function isAllowedRequestOrigin(request: NextRequest): boolean {
  const allowed = resolveAllowedOrigins(request);

  const origin = request.headers.get('origin');
  if (origin) return allowed.has(origin);

  const referer = request.headers.get('referer');
  if (referer) {
    try {
      return allowed.has(new URL(referer).origin);
    } catch {
      return false;
    }
  }

  const secFetchSite = request.headers.get('sec-fetch-site');
  if (secFetchSite === 'same-origin' || secFetchSite === 'same-site') return true;

  return process.env.NODE_ENV !== 'production';
}

export async function POST(request: NextRequest) {
  try {
    if (!isAllowedRequestOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();

    const { metricType, pageRoute, valueMs, deviceType, userAgent, timestamp } = data;

    // Validate required fields
    if (!metricType || !pageRoute || valueMs === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: metricType, pageRoute, valueMs' },
        { status: 400 }
      );
    }

    // Validate metric type
    const validMetricTypes = [
      'page_load',
      'api_latency',
      'tti',
      'fcp',
      'lcp',
      'cls',
      'fid',
      'inp',
      'ttfb',
    ];
    if (!validMetricTypes.includes(metricType)) {
      return NextResponse.json({ error: 'Invalid metric type' }, { status: 400 });
    }

    // Validate device type
    const validDeviceTypes = ['desktop', 'mobile', 'tablet'];
    if (deviceType && !validDeviceTypes.includes(deviceType)) {
      return NextResponse.json({ error: 'Invalid device type' }, { status: 400 });
    }

    // Create metric record
    const metric: InsertPerformanceMetric = {
      metricType,
      pageRoute,
      apiEndpoint: null,
      valueMs: String(valueMs),
      deviceType: deviceType || null,
      userAgent: userAgent || null,
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
