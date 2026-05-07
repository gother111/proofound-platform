import { NextResponse } from 'next/server';

import { safeApiErrorResponse } from '@/lib/api/errors';
import { requireApiAuthContext } from '@/lib/auth';
import { FEATURE_FLAG_KEYS } from '@/lib/featureFlags';
import { isFeatureEnabled } from '@/lib/feature-flags/server';
import { getIndividualReadiness, getIndividualReadinessCached } from '@/lib/readiness/individual';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const usePerfCache = await isFeatureEnabled(
      FEATURE_FLAG_KEYS.PLATFORM_PERF_CACHE,
      { userId: user.id },
      true
    );
    const readiness = usePerfCache
      ? await getIndividualReadinessCached(user.id)
      : await getIndividualReadiness(user.id);
    return NextResponse.json(readiness);
  } catch (error) {
    return safeApiErrorResponse({
      event: 'individual.readiness.failed',
      error,
      publicMessage: 'Failed to build individual readiness',
    });
  }
}
