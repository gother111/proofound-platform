import { legacySurfaceJsonResponse } from '@/lib/mvp/nonLaunch';

export const dynamic = 'force-dynamic';

export async function POST() {
  return legacySurfaceJsonResponse(
    'Performance API',
    'Client performance telemetry is archived outside the locked launch MVP flow.'
  );
}
