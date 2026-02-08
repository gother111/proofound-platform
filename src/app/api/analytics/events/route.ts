import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { emitAnalyticsEventAsync } from '@/lib/analytics/events';

export const dynamic = 'force-dynamic';

type IncomingBody = Record<string, unknown> & {
  event_type?: string;
  eventType?: string;
  event?: string;
  event_data?: unknown;
  eventData?: unknown;
  properties?: unknown;
  timestamp?: string;
};

/**
 * POST /api/analytics/events
 *
 * Compatibility endpoint for older/newer client payloads.
 * Stores the payload as a CUSTOM analytics event, scoped to the authenticated user.
 *
 * Accepted payload shapes (examples):
 * - { event_type: "evidence_pack_generated", event_data: {...} }
 * - { event: "api_latency", properties: {...}, timestamp: "..." }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as IncomingBody;

    const eventTypeRaw =
      (typeof body.event_type === 'string' && body.event_type) ||
      (typeof body.eventType === 'string' && body.eventType) ||
      (typeof body.event === 'string' && body.event) ||
      null;

    if (!eventTypeRaw) {
      return NextResponse.json({ error: 'event_type is required' }, { status: 400 });
    }

    const eventData = body.event_data ?? body.eventData ?? body.properties ?? null;

    emitAnalyticsEventAsync({
      eventType: 'custom',
      userId: user.id,
      profileId: user.id,
      entityType: 'api',
      entityId: eventTypeRaw,
      properties: {
        event_type: eventTypeRaw,
        event_data: eventData,
        client_timestamp: typeof body.timestamp === 'string' ? body.timestamp : undefined,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to record event' }, { status: 500 });
  }
}
