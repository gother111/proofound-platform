import { legacySurfaceJsonResponse } from '@/lib/mvp/nonLaunch';

export const dynamic = 'force-dynamic';

export async function POST() {
  return legacySurfaceJsonResponse(
    'Legacy Expertise API',
    'CV import wizard suggestions are archived outside the locked launch MVP corridor.'
  );
}
