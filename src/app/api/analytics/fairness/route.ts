import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateFairnessNote } from '@/lib/analytics/fairness';

/**
 * GET /api/analytics/fairness
 *
 * PRD Part 2: Fairness/Equity Signal
 * Generates fairness note for specified time period
 * Monitors demographic fairness gaps (opt-in only)
 *
 * Query params:
 * - startDate: ISO date string (default: 90 days ago)
 * - endDate: ISO date string (default: today)
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);

    // Parse date parameters
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days ago

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({
        error: 'Invalid date format',
        message: 'Dates must be valid ISO 8601 strings',
      }, { status: 400 });
    }

    if (startDate >= endDate) {
      return NextResponse.json({
        error: 'Invalid date range',
        message: 'startDate must be before endDate',
      }, { status: 400 });
    }

    // Generate fairness note
    const fairnessNote = await generateFairnessNote(startDate, endDate);

    return NextResponse.json({
      success: true,
      fairnessNote,
    });

  } catch (error) {
    console.error('Fairness note generation error:', error);
    return NextResponse.json({
      error: 'Failed to generate fairness note',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
