/**
 * Tour Analytics Event API
 * POST /api/analytics/tour-event
 *
 * Records tour events (started, completed, skipped)
 * Used by client components to emit analytics without Node.js imports
 */

import { NextRequest, NextResponse } from 'next/server';
import { emitTourStarted, emitTourCompleted, emitTourSkipped } from '@/lib/analytics/events';
import { requireApiAuth } from '@/lib/api/auth';
import { requireAnalyticsConsentForUser } from '@/lib/privacy/analytics-consent';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const hasAnalyticsConsent = await requireAnalyticsConsentForUser(authResult.user.id);
    if (!hasAnalyticsConsent) {
      return NextResponse.json(
        { success: true, skipped: 'analytics_consent_missing' },
        { status: 202 }
      );
    }

    const body = await request.json();
    const { event } = body;

    if (!event) {
      return NextResponse.json({ error: 'Missing event' }, { status: 400 });
    }

    switch (event) {
      case 'started':
        await emitTourStarted(authResult.user.id);
        break;
      case 'completed':
        await emitTourCompleted(authResult.user.id);
        break;
      case 'skipped':
        await emitTourSkipped(authResult.user.id);
        break;
      default:
        return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to record tour event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
