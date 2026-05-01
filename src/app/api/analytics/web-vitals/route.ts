import { legacySurfaceJsonResponse } from '@/lib/mvp/nonLaunch';

export const dynamic = 'force-dynamic';

export async function GET() {
  return legacySurfaceJsonResponse(
    'Analytics API',
    'Web-vitals analytics reporting is archived outside the locked launch MVP corridor.'
  );
}

export async function POST() {
  return legacySurfaceJsonResponse(
    'Analytics API',
    'Web-vitals analytics collection is archived outside the locked launch MVP corridor.'
  );
}
