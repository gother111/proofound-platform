import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuthContext } from '@/lib/auth';
import { getWellBeingTrend } from '@/lib/wellbeing/delta';

/**
 * GET /api/wellbeing/trend
 *
 * Get well-being trend over time (weekly averages)
 * Query params:
 * - weeks: number of weeks to include (default 4)
 */
export async function GET(req: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const { searchParams } = new URL(req.url);
    const weeks = parseInt(searchParams.get('weeks') || '4', 10);

    const trend = await getWellBeingTrend(user.id, weeks);

    return NextResponse.json(trend);
  } catch (error) {
    console.error('Failed to get well-being trend:', error);
    return NextResponse.json({ error: 'Failed to get trend' }, { status: 500 });
  }
}
