/**
 * Skill Gap Analysis API
 * GET /api/skill-gaps
 *
 * Returns skill gaps for the authenticated user based on
 * assignments they are matched to or have shown interest in.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuthContext } from '@/lib/auth';
import { computeSkillGaps } from '@/lib/skills/gap-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const search = request.nextUrl.searchParams;

    const roleFilter = search.get('role') || undefined;
    const timeframe = Number(search.get('timeframe') ?? 180);
    const timeframeDays = Number.isFinite(timeframe) && timeframe > 0 ? timeframe : 180;

    const result = await computeSkillGaps({
      profileId: user.id,
      roleFilter,
      timeframeDays,
    });

    return NextResponse.json({
      gaps: result.gaps,
      assignments: result.assignments,
      matrix: result.matrix,
      coverage: result.coverage,
    });
  } catch (error) {
    console.error('Skill gap analysis failed', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze skill gaps',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
