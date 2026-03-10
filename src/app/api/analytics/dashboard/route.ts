import { NextRequest, NextResponse } from 'next/server';

import { requireApiAuthContext } from '@/lib/auth';
import { trackEvent, AnalyticsEventType } from '@/lib/analytics';
import { requireAnalyticsConsentForUser } from '@/lib/privacy/analytics-consent';
import { CLIENT_FF_DEFAULTS } from '@/lib/featureFlags';
import { legacySurfaceJsonResponse } from '@/lib/mvp/nonLaunch';

const ALLOWED_EVENTS: AnalyticsEventType[] = [
  'dashboard_viewed',
  'dashboard_tile_added',
  'dashboard_tile_removed',
  'dashboard_tile_reordered',
  'next_best_action_clicked',
];

type DashboardPayload = {
  eventType?: AnalyticsEventType;
  properties?: Record<string, unknown>;
};

function sanitizeProperties(raw: Record<string, unknown> = {}) {
  const { tiles, load_ms, fromMock, widgetId, oldIndex, newIndex, actionId, position } = raw as any;

  return {
    tiles: Array.isArray(tiles)
      ? tiles.map((tile) => (typeof tile === 'string' ? tile : 'unknown')).slice(0, 20)
      : undefined,
    load_ms: typeof load_ms === 'number' ? load_ms : undefined,
    from_mock: Boolean(fromMock),
    widget_id: typeof widgetId === 'string' ? widgetId : undefined,
    position: typeof position === 'number' ? position : undefined,
    old_index: typeof oldIndex === 'number' ? oldIndex : undefined,
    new_index: typeof newIndex === 'number' ? newIndex : undefined,
    action_id: typeof actionId === 'string' ? actionId : undefined,
  };
}

export async function POST(request: NextRequest) {
  if (!CLIENT_FF_DEFAULTS.legacyMvpSurfaces) {
    return legacySurfaceJsonResponse(
      'Dashboard analytics API',
      'Dashboard telemetry is disabled in the launch MVP corridor.'
    );
  }
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const hasAnalyticsConsent = await requireAnalyticsConsentForUser(user.id);
    if (!hasAnalyticsConsent) {
      return NextResponse.json(
        { success: true, skipped: 'analytics_consent_missing' },
        { status: 202 }
      );
    }

    const body = (await request.json()) as DashboardPayload;

    if (!body.eventType || !ALLOWED_EVENTS.includes(body.eventType)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    const properties = sanitizeProperties(body.properties);

    await trackEvent(body.eventType, properties, request, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to record dashboard analytics event', error);
    return NextResponse.json({ error: 'Failed to record event' }, { status: 500 });
  }
}
