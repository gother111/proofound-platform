import { NextRequest, NextResponse } from 'next/server';

import { requireApiAuthContext } from '@/lib/auth';
import { FEATURE_FLAG_KEYS } from '@/lib/featureFlags';
import { isFeatureEnabled } from '@/lib/feature-flags/server';
import {
  getMomentumUpdatesForPersona,
  getMomentumUpdatesForPersonaCached,
} from '@/lib/momentum/summary';

export const dynamic = 'force-dynamic';

/**
 * GET /api/updates
 *
 * Query params:
 * - persona: individual | organization (default: individual)
 * - org: organization id or slug (optional for organization persona)
 * - limit: max number of updates (default: 8)
 */
export async function GET(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const searchParams = request.nextUrl.searchParams;
    const personaParam = searchParams.get('persona');
    const orgParam = searchParams.get('org');
    const limitRaw = Number(searchParams.get('limit') ?? 8);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 20) : 8;

    const persona = personaParam === 'organization' ? 'organization' : 'individual';
    const usePerfCache = await isFeatureEnabled(
      FEATURE_FLAG_KEYS.PLATFORM_PERF_CACHE,
      { userId: user.id },
      true
    );
    const updatesPayload = usePerfCache
      ? await getMomentumUpdatesForPersonaCached(user.id, persona, limit, orgParam || undefined)
      : await getMomentumUpdatesForPersona(user.id, persona, limit, orgParam || undefined);

    return NextResponse.json({
      updates: updatesPayload.updates,
      persona: updatesPayload.persona,
      eventTypes: [
        'goal_progress',
        'profile_progress',
        'verification_update',
        'assignment_readiness',
        'new_match',
        'message',
        'interview',
      ],
    });
  } catch (error) {
    console.error('Failed to fetch updates:', error);
    return NextResponse.json({ updates: [] });
  }
}
