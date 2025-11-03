import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
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
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const weeks = parseInt(searchParams.get('weeks') || '4', 10);

    const trend = await getWellBeingTrend(user.id, weeks);

    return NextResponse.json(trend);
  } catch (error) {
    console.error('Failed to get well-being trend:', error);
    return NextResponse.json({ error: 'Failed to get trend' }, { status: 500 });
  }
}
