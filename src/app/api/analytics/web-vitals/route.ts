/**
 * Web Vitals API
 *
 * Receives and stores Core Web Vitals metrics from the client.
 * PRD Reference: Part 8 NFR - Performance Monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { performanceMetrics } from '@/db/schema';
import { log } from '@/lib/log';

interface WebVitalPayload {
  metricName: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
  pagePath: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload: WebVitalPayload = await request.json();

    // Extract user agent for diagnostics
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Map Web Vitals metric names to schema enum values
    const metricTypeMap: Record<string, string> = {
      LCP: 'lcp',
      FID: 'fid',
      CLS: 'cls',
      FCP: 'fcp',
      TTFB: 'page_load', // TTFB maps to page_load
    };

    const metricType = metricTypeMap[payload.metricName] || 'page_load';

    // Store metric in database
    await db.insert(performanceMetrics).values({
      metricType,
      pageRoute: payload.pagePath,
      valueMs: payload.value.toString(), // Store as string for precision
      userAgent,
    });

    // Alert if metric is poor (for monitoring)
    if (payload.rating === 'poor') {
      log.warn('web-vitals.poor', {
        metric: payload.metricName,
        value: payload.value,
        path: payload.pagePath,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('web-vitals.store.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Don't fail the client request even if storage fails
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
