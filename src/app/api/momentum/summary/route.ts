import { NextRequest, NextResponse } from 'next/server';

import { requireApiAuthContext } from '@/lib/auth';
import { CLIENT_FF_DEFAULTS, FEATURE_FLAG_KEYS } from '@/lib/featureFlags';
import { isFeatureEnabled } from '@/lib/feature-flags/server';
import { getMomentumSummary, getMomentumSummaryCached } from '@/lib/momentum/summary';
import { legacySurfaceJsonResponse } from '@/lib/mvp/nonLaunch';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!CLIENT_FF_DEFAULTS.legacyMvpSurfaces) {
    return legacySurfaceJsonResponse(
      'Momentum summary API',
      'Momentum summaries are gated out of the shipped MVP surface.'
    );
  }
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const searchParams = request.nextUrl.searchParams;

    const persona =
      searchParams.get('persona') === 'organization'
        ? ('organization' as const)
        : ('individual' as const);
    const orgRef = searchParams.get('org') || undefined;
    const usePerfCache = await isFeatureEnabled(
      FEATURE_FLAG_KEYS.PLATFORM_PERF_CACHE,
      { userId: user.id },
      true
    );

    const summary = usePerfCache
      ? await getMomentumSummaryCached(user.id, persona, orgRef)
      : await getMomentumSummary(user.id, persona, orgRef);

    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to build momentum summary',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
