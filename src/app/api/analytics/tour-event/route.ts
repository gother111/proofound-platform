import { legacySurfaceJsonResponse } from '@/lib/mvp/nonLaunch';

export const dynamic = 'force-dynamic';

export async function POST() {
  return legacySurfaceJsonResponse(
    'Analytics API',
    'Product-tour analytics are archived outside the locked launch MVP flow.'
  );
}
