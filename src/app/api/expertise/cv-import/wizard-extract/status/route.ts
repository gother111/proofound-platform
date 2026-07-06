import { legacySurfaceJsonResponse } from '@/lib/mvp/nonLaunch';

export const dynamic = 'force-dynamic';

export async function GET() {
  return legacySurfaceJsonResponse(
    'Legacy Expertise API',
    'CV import extraction status polling is archived outside the locked launch MVP flow.'
  );
}
