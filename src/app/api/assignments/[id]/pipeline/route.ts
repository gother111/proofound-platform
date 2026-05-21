import { legacySurfaceJsonResponse } from '@/lib/mvp/nonLaunch';

export const dynamic = 'force-dynamic';

const DETAIL =
  'Generic assignment pipeline steps are archived for the locked launch MVP. Use assignment drafting, internal review, publish readiness, intro, reveal, interview, and decision routes instead.';

export async function GET() {
  return legacySurfaceJsonResponse('Assignment pipeline API', DETAIL);
}

export async function POST() {
  return legacySurfaceJsonResponse('Assignment pipeline API', DETAIL);
}
