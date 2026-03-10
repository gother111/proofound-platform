import { NextResponse } from 'next/server';

import { FEATURE_FLAG_KEYS, getFeatureFlagDefault } from '@/lib/featureFlags';
import { isFeatureEnabled, type FeatureFlagContext } from '@/lib/feature-flags/server';

export async function isLegacyMvpSurfaceEnabled(
  context: FeatureFlagContext = {}
): Promise<boolean> {
  return isFeatureEnabled(
    FEATURE_FLAG_KEYS.LEGACY_MVP_SURFACES,
    context,
    getFeatureFlagDefault(FEATURE_FLAG_KEYS.LEGACY_MVP_SURFACES)
  );
}

export function legacySurfaceJsonResponse(surface: string, detail: string, status = 410) {
  return NextResponse.json(
    {
      error: `${surface} is not part of the launch MVP corridor.`,
      message: detail,
      surface,
      launchState: 'non_launch',
    },
    { status }
  );
}
