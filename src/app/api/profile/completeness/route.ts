import { NextResponse } from 'next/server';
import { requireApiAuthContext } from '@/lib/auth';
import { getIndividualReadinessState } from '@/lib/readiness/individual-state';
import { toProfileCompletenessPresentation } from '@/lib/readiness/presentation';

export const dynamic = 'force-dynamic';

/**
 * GET /api/profile/completeness
 *
 * Calculate profile completeness and return next best actions
 */
export async function GET() {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const readiness = await getIndividualReadinessState(authContext.user.id);
    return NextResponse.json(toProfileCompletenessPresentation(readiness));
  } catch (error) {
    console.error('Error calculating profile completeness:', error);
    return NextResponse.json(
      { error: 'Failed to calculate profile completeness' },
      { status: 500 }
    );
  }
}
