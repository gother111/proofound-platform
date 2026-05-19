import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/profile/completeness
 *
 * Legacy non-MVP endpoint. The launch surface uses /api/individual/readiness
 * so the active product does not expose legacy scoring.
 */
export async function GET() {
  return NextResponse.json(
    {
      error: 'Profile completeness scoring is not part of the MVP launch surface.',
      surface: 'Legacy Profile API',
      launchState: 'non_launch',
      replacement: '/api/individual/readiness',
    },
    { status: 410 }
  );
}
