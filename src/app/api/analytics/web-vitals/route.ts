/**
 * Web Vitals Analytics API
 * POST /api/analytics/web-vitals
 *
 * Stores Web Vitals metrics for performance monitoring
 * Implements PRD Gap 2: Performance instrumentation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const WebVitalSchema = z.object({
  name: z.enum(['CLS', 'FID', 'LCP', 'FCP', 'TTFB', 'INP']),
  value: z.number(),
  rating: z.enum(['good', 'needs-improvement', 'poor']).optional(),
  delta: z.number().optional(),
  id: z.string(),
  navigationType: z.string().optional(),
  url: z.string().optional(),
  userAgent: z.string().optional(),
  timestamp: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = WebVitalSchema.parse(body);

    const supabase = await createClient();

    // Get user if authenticated (optional for web vitals)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Store in analytics events table
    await supabase.from('analytics_events').insert({
      event: 'web_vital',
      properties: {
        metric_name: data.name,
        metric_value: data.value,
        rating: data.rating,
        delta: data.delta,
        metric_id: data.id,
        navigation_type: data.navigationType,
        url: data.url,
        user_agent: data.userAgent,
      },
      user_id: user?.id || null,
      created_at: data.timestamp ? new Date(data.timestamp) : new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to store web vital:', error);

    // Don't fail hard on analytics errors
    return NextResponse.json(
      { success: false, error: 'Failed to store metric' },
      { status: 200 } // Return 200 to avoid console errors
    );
  }
}
