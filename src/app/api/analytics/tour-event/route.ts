/**
 * Tour Analytics Event API
 * POST /api/analytics/tour-event
 *
 * Records tour events (started, completed, skipped)
 * Used by client components to emit analytics without Node.js imports
 */

import { NextRequest, NextResponse } from 'next/server';
import { emitTourStarted, emitTourCompleted, emitTourSkipped } from '@/lib/analytics/events';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, event } = body;

    if (!userId || !event) {
      return NextResponse.json({ error: 'Missing userId or event' }, { status: 400 });
    }

    switch (event) {
      case 'started':
        await emitTourStarted(userId);
        break;
      case 'completed':
        await emitTourCompleted(userId);
        break;
      case 'skipped':
        await emitTourSkipped(userId);
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
