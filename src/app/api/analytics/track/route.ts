import { NextRequest, NextResponse } from 'next/server';
import { emitEvent, EVENT_TYPES, type EventType } from '@/lib/analytics/events';

/**
 * POST /api/analytics/track
 *
 * Track analytics events from client-side code
 * This endpoint acts as a bridge to allow client components to emit
 * analytics events without importing server-side database code
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { eventType, userId, orgId, entityType, entityId, properties, sessionId } = body;

    // Validate required fields
    if (!eventType || typeof eventType !== 'string') {
      return NextResponse.json(
        { error: 'eventType is required and must be a string' },
        { status: 400 }
      );
    }

    if (!EVENT_TYPES.includes(eventType as EventType)) {
      return NextResponse.json({ error: `Invalid eventType: ${eventType}` }, { status: 400 });
    }

    // Emit the event
    const eventId = await emitEvent({
      eventType: eventType as EventType,
      userId,
      orgId,
      entityType,
      entityId,
      properties,
      sessionId,
    });

    return NextResponse.json({ success: true, eventId });
  } catch (error) {
    console.error('Failed to track analytics event:', error);
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 });
  }
}
