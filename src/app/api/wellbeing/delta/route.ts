import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Well-Being Delta API
 * GET /api/wellbeing/delta
 * 
 * Calculates well-being delta over specified period (14 or 30 days)
 * Returns change in stress/control levels
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const periodDays = parseInt(searchParams.get('period') || '14');

    if (![14, 30].includes(periodDays)) {
      return NextResponse.json(
        { error: 'Period must be 14 or 30 days' },
        { status: 400 }
      );
    }

    // 1. Get all check-ins for user
    const { data: allCheckins, error: allError } = await supabase
      .from('wellbeing_checkins')
      .select('stress_level, control_level, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (allError) {
      console.error('Database error:', allError);
      return NextResponse.json(
        { error: 'Failed to calculate well-being delta' },
        { status: 500 }
      );
    }

    if (!allCheckins || allCheckins.length < 2) {
      return NextResponse.json({ 
        period: periodDays,
        stressDelta: 0,
        controlDelta: 0,
        checkinsCount: allCheckins?.length || 0,
        hasBaseline: false,
        message: 'Not enough check-ins to calculate delta (minimum 2 required)',
      });
    }

    // 2. Get baseline check-ins (first 7 days)
    const firstCheckinDate = new Date(allCheckins[0].created_at);
    const baselineEndDate = new Date(firstCheckinDate);
    baselineEndDate.setDate(baselineEndDate.getDate() + 7);
    
    const baselineCheckins = allCheckins.filter(c => 
      new Date(c.created_at) <= baselineEndDate
    );

    // 3. Get recent check-ins (last N days)
    const recentStartDate = new Date();
    recentStartDate.setDate(recentStartDate.getDate() - periodDays);
    
    const recentCheckins = allCheckins.filter(c => 
      new Date(c.created_at) >= recentStartDate
    );

    if (baselineCheckins.length === 0 || recentCheckins.length === 0) {
      return NextResponse.json({ 
        period: periodDays,
        stressDelta: 0,
        controlDelta: 0,
        checkinsCount: allCheckins.length,
        hasBaseline: false,
        message: 'Insufficient data in baseline or recent period',
      });
    }

    // 4. Calculate averages
    const baselineStressAvg = baselineCheckins.reduce((sum, c) => sum + c.stress_level, 0) / baselineCheckins.length;
    const baselineControlAvg = baselineCheckins.reduce((sum, c) => sum + c.control_level, 0) / baselineCheckins.length;
    
    const recentStressAvg = recentCheckins.reduce((sum, c) => sum + c.stress_level, 0) / recentCheckins.length;
    const recentControlAvg = recentCheckins.reduce((sum, c) => sum + c.control_level, 0) / recentCheckins.length;

    // 5. Calculate delta (positive = improvement)
    // For stress: lower is better, so baseline - recent = positive when stress decreased
    // For control: higher is better, so recent - baseline = positive when control increased
    const stressDelta = Number((baselineStressAvg - recentStressAvg).toFixed(2));
    const controlDelta = Number((recentControlAvg - baselineControlAvg).toFixed(2));

    return NextResponse.json({ 
      period: periodDays,
      stressDelta, // Positive = less stress (improvement)
      controlDelta, // Positive = more control (improvement)
      checkinsCount: allCheckins.length,
      hasBaseline: true,
      baseline: {
        stress: Number(baselineStressAvg.toFixed(2)),
        control: Number(baselineControlAvg.toFixed(2)),
        count: baselineCheckins.length,
      },
      recent: {
        stress: Number(recentStressAvg.toFixed(2)),
        control: Number(recentControlAvg.toFixed(2)),
        count: recentCheckins.length,
      },
    });
  } catch (error) {
    console.error('Delta calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate well-being delta' },
      { status: 500 }
    );
  }
}

