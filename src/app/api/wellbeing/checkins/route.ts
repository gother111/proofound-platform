/**
 * Well-Being Check-ins API
 * 
 * GET /api/wellbeing/checkins - Get user's check-in history
 * Used by WellBeingDeltaChart to display trends
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const days = parseInt(searchParams.get('days') || '90');

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch check-ins
    const { data: checkIns, error } = await supabase
      .from('wellbeing_checkins')
      .select('id, stress_level, control_level, milestone, created_at')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch check-ins' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      checkIns: checkIns || [],
      count: checkIns?.length || 0,
    });
  } catch (error) {
    console.error('Check-ins API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

